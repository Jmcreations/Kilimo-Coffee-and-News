const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const News = require('../models/news');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// GET /api/news - Public list of all articles
router.get('/', async (_req, res) => {
  try {
    const articles = await News.find().sort({ _id: -1 });
    res.status(200).json(articles);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch news articles', error: err.message });
  }
});

// GET /api/news/:id - Public single article
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid article ID format' });
    }

    const article = await News.findById(id);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    res.status(200).json(article);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch article', error: err.message });
  }
});

// POST /api/news - Create article (Journalist or Admin)
router.post(
  '/',
  verifyToken,
  authorizeRoles('journalist', 'admin'),
  upload.single('contentImage'),
  async (req, res) => {
    try {
      const { title, category, readTime, content, author } = req.body;
      if (!title || !category || !content) {
        return res.status(400).json({ message: 'Title, category, and content are required.' });
      }

      const formattedDate = new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });

      const newArticle = new News({
        title: title.trim(),
        category: category.trim(),
        date: formattedDate,
        readTime: readTime || '3 min read',
        content: content.trim(),
        contentImage: req.file ? `/uploads/${req.file.filename}` : null,
        author: author?.trim() || req.user.name || 'Kilimo News Desk'
      });

      const savedArticle = await newArticle.save();
      res.status(201).json(savedArticle);
    } catch (err) {
      res.status(500).json({ message: 'Failed to publish article', error: err.message });
    }
  }
);

// PUT /api/news/:id - Edit any article (Admin only)
router.put(
  '/:id',
  verifyToken,
  authorizeRoles('admin'),
  upload.single('contentImage'),
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid article ID format' });
      }

      const article = await News.findById(id);
      if (!article) {
        return res.status(404).json({ message: 'Article not found' });
      }

      const { title, category, readTime, content, author } = req.body;
      if (title) article.title = title.trim();
      if (category) article.category = category.trim();
      if (readTime) article.readTime = readTime.trim();
      if (content) article.content = content.trim();
      if (author) article.author = author.trim();
      if (req.file) {
        article.contentImage = `/uploads/${req.file.filename}`;
      }

      const updatedArticle = await article.save();
      res.status(200).json(updatedArticle);
    } catch (err) {
      res.status(500).json({ message: 'Failed to update article', error: err.message });
    }
  }
);

// DELETE /api/news/:id - Delete any article (Admin only)
router.delete('/:id', verifyToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid article ID format' });
    }

    const deleted = await News.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Article not found' });
    }

    res.status(200).json({ message: 'Article deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete article', error: err.message });
  }
});

module.exports = router;
