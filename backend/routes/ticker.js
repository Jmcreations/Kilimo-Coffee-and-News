const express = require('express');
const router = express.Router();

// GET /api/ticker - Return live/latest Nairobi Coffee Exchange (NCE) grades
router.get('/', (req, res) => {
  res.status(200).json([
    { grade: 'KENYA AA', price: '612.50', unit: 'USD/50kg', change: '+8.25', isPositive: true },
    { grade: 'KENYA AB', price: '548.00', unit: 'USD/50kg', change: '+5.10', isPositive: true },
    { grade: 'KENYA PB', price: '590.75', unit: 'USD/50kg', change: '-3.50', isPositive: false },
    { grade: 'KENYA C', price: '420.00', unit: 'USD/50kg', change: '0.00', isPositive: true },
    { grade: 'KENYA E', price: '645.00', unit: 'USD/50kg', change: '+12.00', isPositive: true },
    { grade: 'KENYA TT', price: '390.50', unit: 'USD/50kg', change: '-1.25', isPositive: false }
  ]);
});

module.exports = router;
