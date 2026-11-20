const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const newsRoutes = require('./routes/newsRoutes');
const tickerRoutes = require('./routes/ticker');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Ensure uploads directory exists on Linux containers (Northflank/Render)
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 2. Allow requests from Vercel production, preview deployments, and localhost
app.use(cors({
  origin: [
    'https://an-coffee-main.vercel.app',
    'https://kilimocoffeeandnews.vercel.app',
    'https://kilimo-coffee-and-news.vercel.app/',
    /\.vercel\.app$/,
    'http://localhost:4200'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Serve uploaded article images using an absolute path
app.use('/uploads', express.static(uploadsDir));

// 4. Health check endpoint for Northflank container readiness
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'Kilimo Coffee & News API' });
});

// 5. Mount API routes
const newsHandler = typeof newsRoutes === 'function' ? newsRoutes : (newsRoutes.router || newsRoutes.default);
const tickerHandler = typeof tickerRoutes === 'function' ? tickerRoutes : (tickerRoutes.router || tickerRoutes.default);

app.use('/api/news', newsHandler);
app.use('/api/ticker', tickerHandler);

// 6. Connect to MongoDB Atlas
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error('CRITICAL: MONGO_URI environment variable is missing.');
} else {
  mongoose.connect(mongoUri)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch((err) => console.error('MongoDB connection error:', err));
}

// 7. Bind immediately to 0.0.0.0 so cloud load balancers can route traffic
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
