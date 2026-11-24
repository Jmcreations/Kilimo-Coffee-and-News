const express = require('express');
const { getOrInitTicker, applySaleUpdate } = require('../services/tickerService');

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const ticker = await getOrInitTicker();
    res.status(200).json(ticker);
  } catch (error) {
    console.error('Error loading ticker:', error);
    res.status(500).json({ message: 'Could not load the NCE ticker.' });
  }
});

router.put('/', async (req, res) => {
  try {
    const ticker = await applySaleUpdate(req.body);
    res.status(200).json(ticker);
  } catch (error) {
    const status = error.message.includes('required') || error.message.includes('Enter at least')
      ? 400
      : 500;
    res.status(status).json({ message: error.message });
  }
});

module.exports = router;
