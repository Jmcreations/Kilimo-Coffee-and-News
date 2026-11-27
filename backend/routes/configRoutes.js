const express = require('express');
const router = express.Router();

// GET /api/config/public
// Serves domain-restricted browser identifiers from Northflank env vars so zero keys live in GitHub
router.get('/public', (req, res) => {
  res.status(200).json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    microsoftClientId: process.env.MICROSOFT_CLIENT_ID || '',
    appleClientId: process.env.APPLE_CLIENT_ID || '',
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || ''
  });
});

module.exports = router;
