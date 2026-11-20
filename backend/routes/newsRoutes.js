const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const News = require('../models/news');

// Ensure uploads folder exists before Multer writes to it
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB max image upload
});

// GET /api/news - Fetch all articles (newest first)
router.get('/', async (req, res) => {
  try {
    const articles = await News.find().sort({ _id: -1 });
    res.status(200).json(articles);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch news articles', error: err.message });
  }
});

// GET /api/news/:id - Fetch single article safely
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
    console.error('Error fetching article:', err);
    res.status(500).json({ message: 'Failed to fetch article', error: err.message });
  }
});

// POST /api/news - Create a new article (with optional contentImage)
router.post('/', upload.single('contentImage'), async (req, res) => {
  try {
    const { title, category, readTime, content, author } = req.body;

    if (!title || !category || !content) {
      return res.status(400).json({ message: 'Title, category, and content are required.' });
    }

    // Format date like "November 20, 2026" to match existing database records
    const formattedDate = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    // Store normalized web path (/uploads/filename.jpg) or null if no file was attached
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    const newArticle = new News({
      title: title.trim(),
      category: category.trim(),
      date: formattedDate,
      readTime: readTime || '3 min read',
      content: content.trim(),
      contentImage: imagePath,
      author: author ? author.trim() : 'Henry Kinyua'
    });

    const savedArticle = await newArticle.save();
    res.status(201).json(savedArticle);
  } catch (err) {
    console.error('Error saving news article:', err);
    res.status(500).json({ message: 'Failed to publish article', error: err.message });
  }
});

module.exports = router;
