const express = require('express');
const router = express.Router();
const News = require('../models/news');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

module.exports = (upload) => {
    
    // GET All News
    router.get('/', async (req, res) => {
        try {
            const articles = await News.find().sort({ _id: -1 });
            
            const formattedArticles = articles.map(a => ({
                id: a._id,
                title: a.title,
                category: a.category,
                date: a.date,
                readTime: a.readTime,
                snippet: a.snippet,
                contentImage: a.contentImage
            }));
            
            res.status(200).json(formattedArticles);
        } catch (err) {
            console.error('Error fetching news:', err);
            res.status(500).json({ message: 'Server error fetching news' });
        }
    });

    // GET Single News Article
    router.get('/:id', async (req, res) => {
        // Clean the ID of any invisible spaces/newlines
        const cleanId = req.params.id.trim();
        console.log('🛎️ Cleaned ID being searched:', cleanId); 
        
        try {
            const article = await News.findById(cleanId);
            console.log('📦 Database returned:', article ? 'Found it!' : 'NULL - Not found!');
            
            if (!article) {
                return res.status(404).json({ message: 'Article not found' });
            }
            
            const formattedArticle = {
                id: article._id,
                title: article.title,
                category: article.category,
                date: article.date,
                readTime: article.readTime,
                content: article.content, 
                contentImage: article.contentImage
            };
            
            console.log('✅ Sending article to frontend!');
            res.status(200).json(formattedArticle);
        } catch (err) {
            console.error('🔥 ERROR fetching single news:', err);
            res.status(500).json({ message: 'Server error fetching news' });
        }
    });

    // POST New Article 
    router.post('/', upload.single('contentImage'), async (req, res) => {
        try {
            const { title, category, readTime, content } = req.body;

            if (!title || !content) {
                return res.status(400).json({ success: false, message: 'Title and content are required.' });
            }

            let contentImageUrl = null;
            if (req.file) {
                const extension = path.extname(req.file.path).toLowerCase();
                const temporaryPath = `${req.file.path}.optimized`;
                let image = sharp(req.file.path).rotate();
                image = extension === '.png'
                    ? image.png({ compressionLevel: 9, palette: true })
                    : image.jpeg({ quality: 82, mozjpeg: true });

                await image.toFile(temporaryPath);
                fs.renameSync(temporaryPath, req.file.path);
                contentImageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
            }

            const newArticle = new News({
                title,
                category: category || 'Market Report',
                date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                readTime: readTime || '3 min read',
                content, // Saving the full article text here
                contentImage: contentImageUrl
            });

            await newArticle.save(); 
            
            res.status(201).json({ success: true, message: 'Article published successfully!', article: newArticle });
        } catch (err) {
            res.status(500).json({ success: false, message: 'Failed to publish article.' });
        }
    });

    return router;
};