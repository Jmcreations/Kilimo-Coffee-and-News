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
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/orderRoutes');
const configRoutes = require('./routes/configRoutes');
const { startNceTuesdayCron } = require('./jobs/nceSync');
const { startReviewEmailCron } = require('./services/email');

const app = express();
const PORT = process.env.PORT || 3000;

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const allowedOrigins = [
  'https://an-coffee-main.vercel.app',
  'https://kilimo-coffee-and-news.vercel.app',
  'https://kilimocoffeeandnews.vercel.app',
  'https://kilimonews.co.ke',
  'https://www.kilimonews.co.ke',
  /\.vercel\.app$/,
  /\.pages\.dev$/,
  'http://localhost:4200'
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL.trim().replace(/\/+$/, ''));
}

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Normalize accidental double slashes (e.g. /api//news)
app.use((req, _res, next) => {
  req.url = req.url.replace(/\/{2,}/g, '/');
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));

app.get('/', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'Kilimo Coffee & News API' });
});

const resolveHandler = (mod) =>
  typeof mod === 'function' ? mod : mod.router || mod.default;

app.use('/api/auth', resolveHandler(authRoutes));
app.use('/api/users', resolveHandler(userRoutes));
app.use('/api/orders', resolveHandler(orderRoutes));
app.use('/api/news', resolveHandler(newsRoutes));
app.use('/api/config', resolveHandler(configRoutes));
app.use('/api/ticker', resolveHandler(tickerRoutes));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    startNceTuesdayCron();
    startReviewEmailCron();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
