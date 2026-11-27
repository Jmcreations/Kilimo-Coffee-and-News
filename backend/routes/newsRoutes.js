const express = require('express');
const router = express.Router();
const multer = require('multer');
const mongoose = require('mongoose');
const News = require('../models/news');
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const { uploadBufferToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 } // 8 MB max image upload
});

function canManageArticle(user, article) {
  if (user.role === 'admin') return true;
  if (article.authorId && article.authorId.toString() === user.id) return true;
  if (
    article.author &&
    user.name &&
    article.author.trim().toLowerCase() === user.name.trim().toLowerCase()
  ) {
    return true;
  }
  return false;
}

function handleUploadError(err, req, res, next) {
  if (req.aborted || err.message === 'Request aborted' || err.message === 'Request closed') {
    console.warn('News image upload was interrupted by the client.');
    if (!res.headersSent && !res.destroyed) {
      return res.status(400).json({
        message: 'The upload was interrupted. Check your connection and try again.'
      });
    }
    return;
  }

  if (err instanceof multer.MulterError) {
    const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Image must be 8 MB or smaller.'
        : 'The uploaded image could not be processed.';
    return res.status(status).json({ message });
  }

  next(err);
}

// GET /api/news
router.get('/', async (_req, res) => {
  try {
    const articles = await News.find().sort({ _id: -1 });
    res.status(200).json(articles);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch news articles', error: err.message });
  }
});

// GET /api/news/:id
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

// POST /api/news
router.post(
  '/',
  verifyToken,
  authorizeRoles('journalist', 'admin'),
  upload.single('contentImage'),
  async (req, res) => {
    try {
      const { title, category, readTime, content } = req.body;
      if (!title || !category || !content) {
        return res.status(400).json({ message: 'Title, category, and content are required.' });
      }

      const formattedDate = new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });

      const creditedAuthor =
        req.user.role === 'admin'
          ? 'Henry Kinyua'
          : req.user.name || 'Kilimo News Desk';

      let contentImage = null;
      let contentImagePublicId = null;

      if (req.file) {
        const uploaded = await uploadBufferToCloudinary(req.file.buffer, 'kilimo-news');
        contentImage = uploaded.secure_url;
        contentImagePublicId = uploaded.public_id;
      }

      const newArticle = new News({
        title: title.trim(),
        category: category.trim(),
        date: formattedDate,
        readTime: readTime?.trim() || '3 min read',
        content: content.trim(),
        contentImage,
        contentImagePublicId,
        author: creditedAuthor,
        authorId: req.user.id
      });

      const savedArticle = await newArticle.save();
      res.status(201).json(savedArticle);
    } catch (err) {
      res.status(500).json({ message: 'Failed to publish article', error: err.message });
    }
  },
  handleUploadError
);

// PUT /api/news/:id
router.put(
  '/:id',
  verifyToken,
  authorizeRoles('journalist', 'admin'),
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

      if (!canManageArticle(req.user, article)) {
        return res.status(403).json({ message: 'You can only edit articles that you authored.' });
      }

      const { title, category, readTime, content } = req.body;
      if (title) article.title = title.trim();
      if (category) article.category = category.trim();
      if (readTime) article.readTime = readTime.trim();
      if (content) article.content = content.trim();

      if (req.user.role === 'admin') {
        article.author = 'Henry Kinyua';
      } else {
        article.author = req.user.name;
        article.authorId = req.user.id;
      }

      if (req.file) {
        if (article.contentImagePublicId) {
          await deleteFromCloudinary(article.contentImagePublicId);
        }
        const uploaded = await uploadBufferToCloudinary(req.file.buffer, 'kilimo-news');
        article.contentImage = uploaded.secure_url;
        article.contentImagePublicId = uploaded.public_id;
      }

      const updatedArticle = await article.save();
      res.status(200).json(updatedArticle);
    } catch (err) {
      res.status(500).json({ message: 'Failed to update article', error: err.message });
    }
  },
  handleUploadError
);

// DELETE /api/news/:id
router.delete(
  '/:id',
  verifyToken,
  authorizeRoles('journalist', 'admin'),
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

      if (!canManageArticle(req.user, article)) {
        return res.status(403).json({ message: 'You can only delete articles that you authored.' });
      }

      if (article.contentImagePublicId) {
        await deleteFromCloudinary(article.contentImagePublicId);
      }

      await News.findByIdAndDelete(id);
      res.status(200).json({ message: 'Article deleted successfully.' });
    } catch (err) {
      res.status(500).json({ message: 'Failed to delete article', error: err.message });
    }
  }
);

module.exports = router;
