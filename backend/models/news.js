const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  date: { type: String, required: true },
  readTime: { type: String, default: '3 min read' },
  content: { type: String, required: true },
  contentImage: { type: String, default: null },
  contentImagePublicId: { type: String, default: null },
  author: { type: String, default: 'Kilimo News Desk' },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
});

newsSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('News', newsSchema);
