const Ticker = require('../models/Ticker');

const GRADE_ORDER = ['AA', 'AB', 'PB', 'C', 'E', 'TT'];

const DEFAULT_GRADES = [
  { grade: 'AA', price: 645.0, change: 12.0, lastSaleNumber: 8 },
  { grade: 'AB', price: 548.0, change: 5.1, lastSaleNumber: 8 },
  { grade: 'PB', price: 590.75, change: -3.5, lastSaleNumber: 8 },
  { grade: 'C', price: 420.0, change: 0.0, lastSaleNumber: 8 },
  { grade: 'E', price: 645.0, change: 12.0, lastSaleNumber: 8 },
  { grade: 'TT', price: 390.5, change: -1.25, lastSaleNumber: 8 }
];

async function getOrInitTicker() {
  let ticker = await Ticker.findOne();
  if (!ticker) {
    ticker = await Ticker.create({
      latestSaleNumber: 8,
      lastSaleDate: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      grades: DEFAULT_GRADES
    });
  }
  return ticker;
}

async function applySaleUpdate({ saleNumber, saleDate, prices = {} }) {
  const parsedSale = Number(saleNumber);
  if (!Number.isInteger(parsedSale) || parsedSale < 1) {
    throw new Error('A valid positive Sale Number is required.');
  }

  const ticker = await getOrInitTicker();
  const existingMap = new Map(ticker.grades.map((grade) => [grade.grade, grade]));
  let updatedCount = 0;

  const mergedGrades = GRADE_ORDER.map((gradeCode) => {
    const previous = existingMap.get(gradeCode) || {
      grade: gradeCode,
      price: 500,
      change: 0,
      lastSaleNumber: parsedSale
    };

    const rawIncoming = prices[gradeCode];
    const incomingPrice =
      rawIncoming !== undefined && rawIncoming !== null && rawIncoming !== ''
        ? Number(rawIncoming)
        : NaN;

    if (!Number.isNaN(incomingPrice) && incomingPrice > 0) {
      updatedCount += 1;
      return {
        grade: gradeCode,
        price: Number(incomingPrice.toFixed(2)),
        change: Number((incomingPrice - previous.price).toFixed(2)),
        lastSaleNumber: parsedSale
      };
    }

    return {
      grade: previous.grade,
      price: previous.price,
      change: previous.change,
      lastSaleNumber: previous.lastSaleNumber
    };
  });

  if (updatedCount === 0) {
    throw new Error('Enter at least one traded grade price to update the sale ticker.');
  }

  ticker.latestSaleNumber = parsedSale;
  ticker.lastSaleDate =
    typeof saleDate === 'string' && saleDate.trim()
      ? saleDate.trim()
      : new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
  ticker.grades = mergedGrades;

  await ticker.save();
  return ticker;
}

module.exports = {
  GRADE_ORDER,
  getOrInitTicker,
  applySaleUpdate
};
