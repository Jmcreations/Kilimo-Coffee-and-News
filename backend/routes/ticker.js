/*const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        // 1. Fetch the NCE website HTML
        const targetUrl = 'https://nairobicoffeeexchange.co.ke/'; // Update this if the prices are on a specific subpage
        const { data } = await axios.get(targetUrl);

        // 2. Load the HTML into Cheerio
        const $ = cheerio.load(data);
        const coffeePrices = [];

        // 3. Target the HTML elements containing the grades and prices
        // NOTE: We will need to update these CSS selectors based on the actual NCE website structure!
        $('table.prices-table tr').each((index, element) => {
            const grade = $(element).find('td:nth-child(1)').text().trim();
            const price = $(element).find('td:nth-child(2)').text().trim();

            // Ignore empty rows or headers
            if (grade && price && grade !== 'Grade') {
                coffeePrices.push({ grade, price });
            }
        });

        // 4. Send the data to your Angular frontend
        res.status(200).json(coffeePrices);

    } catch (error) {
        console.error('Error fetching NCE data:', error.message);
        res.status(500).json({ message: 'Failed to fetch ticker data' });
    }
});

module.exports = router;*/