const cron = require('node-cron');
const { getOrInitTicker, applySaleUpdate, GRADE_ORDER } = require('../services/tickerService');

/**
 * Fetches and parses the latest NCE Tuesday auction report if NCE_REPORT_URL is configured.
 * Safely exits without mutating data if the report has not been posted yet or is already synced.
 */
async function syncLatestNceAuction() {
  const reportUrl = process.env.NCE_REPORT_URL;
  if (!reportUrl) {
    return { synced: false, reason: 'NCE_REPORT_URL not configured; awaiting manual or URL sync.' };
  }

  try {
    const response = await fetch(reportUrl, {
      headers: { 'User-Agent': 'KilimoCoffeeNewsBot/1.0' }
    });
    if (!response.ok) {
      return { synced: false, reason: `NCE source returned HTTP ${response.status}` };
    }

    const rawText = await response.text();
    const saleMatch = rawText.match(/Sale\s*(?:No\.?|Number)?\s*[:#-]?\s*(\d{1,3})/i);
    if (!saleMatch) {
      return { synced: false, reason: 'Sale number not found in NCE report yet.' };
    }

    const detectedSaleNumber = Number(saleMatch[1]);
    const currentTicker = await getOrInitTicker();

    if (detectedSaleNumber <= currentTicker.latestSaleNumber) {
      return {
        synced: false,
        reason: `Sale ${detectedSaleNumber} is already up to date (current: Sale ${currentTicker.latestSaleNumber}).`
      };
    }

    // Extract average USD/50kg price per grade when present in the report table
    const extractedPrices = {};
    for (const grade of GRADE_ORDER) {
      const gradeRegex = new RegExp(
        `\\b${grade}\\b[^\\d\\n]{1,30}(\\d{3}(?:\\.\\d{1,2})?)`,
        'i'
      );
      const match = rawText.match(gradeRegex);
      if (match) {
        const val = Number(match[1]);
        if (val >= 100 && val <= 2000) {
          extractedPrices[grade] = val;
        }
      }
    }

    if (Object.keys(extractedPrices).length === 0) {
      return { synced: false, reason: `No grade prices parsed for Sale ${detectedSaleNumber}.` };
    }

    const updated = await applySaleUpdate({
      saleNumber: detectedSaleNumber,
      prices: extractedPrices
    });

    console.log(`[NCE Sync] Updated ticker to Sale ${updated.latestSaleNumber}`, extractedPrices);
    return { synced: true, ticker: updated };
  } catch (err) {
    console.error('[NCE Sync] Error checking Tuesday auction:', err.message);
    return { synced: false, reason: err.message };
  }
}

function startNceTuesdayCron() {
  // Runs every Tuesday at 16:30, 18:30, and 20:30 East Africa Time (EAT)
  cron.schedule(
    '30 16,18,20 * * 2',
    async () => {
      console.log('[NCE Cron] Running Tuesday post-auction ticker check...');
      await syncLatestNceAuction();
    },
    { timezone: 'Africa/Nairobi' }
  );
}

module.exports = {
  syncLatestNceAuction,
  startNceTuesdayCron
};
