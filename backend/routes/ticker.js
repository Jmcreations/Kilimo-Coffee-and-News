const mongoose = require('mongoose');

const gradeEntrySchema = new mongoose.Schema(
  {
    grade: { type: String, enum: ['AA', 'AB', 'PB', 'C', 'E', 'TT'], required: true },
    price: { type: Number, required: true },      // USD per 50kg bag
    change: { type: Number, default: 0 },         // +/- vs that grade's prior sale price
    lastSaleNumber: { type: Number, required: true }
  },
  { _id: false }
);

const tickerSchema = new mongoose.Schema(
  {
    latestSaleNumber: { type: Number, required: true, default: 1 },
    lastSaleDate: { type: String, default: '' },
    grades: { type: [gradeEntrySchema], required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ticker', tickerSchema);
