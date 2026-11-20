const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: { type: String, default: 'General News' },
    date: { type: String, required: true },
    readTime: { type: String, default: '3 min read' },
    content: { type: String, required: true },
    contentImage: { type: String, default: null }, // The uploaded supporting image
    author: { type: String, default: 'Henry Kinyua' }
});
newsSchema.set('toJSON', { virtuals: true });
module.exports = mongoose.model('News', newsSchema);
