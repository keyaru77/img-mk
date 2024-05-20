const express = require('express');
const cheerio = require('cheerio');
const axios = require('axios');
const app = express();

// Endpoint root untuk menampilkan informasi
app.get('/', (req, res) => {
    res.json({
        message: "Selamat datang di API MangaKita Scraper!",
        endpoints: {
            scrape: "/scrape/:maid",
            example: "/scrape/one-piece"
        },
        description: "Gunakan endpoint '/scrape/:maid' untuk melakukan scraping data manga dengan parameter 'maid'."
    });
});

// Endpoint untuk scraping
app.get('/scrape/:maid', async (req, res) => {
    const maid = req.params.maid;
    const url = `https://mangakita.id/${maid}`;

    try {
        console.log(`Fetching URL: ${url}`);
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
            }
        });

        const $ = cheerio.load(response.data);

        // Cari elemen title
        const pageTitle = $('title').first().text() || '';
        console.log(`Page title: ${pageTitle}`);

        // Cari elemen h1 dengan class entry-title
        const h1Text = $('h1.entry-title').first().text() || '';
        console.log(`H1 text: ${h1Text}`);

        // Cari elemen div dengan class allc
        const allcElement = $('div.allc').first();
        const allcText = allcElement.text().replace('All chapters are in', '').trim() || '';
        const allcLink = allcElement.find('a').attr('href') ? allcElement.find('a').attr('href').replace('https://mangakita.id/', '') : '';
        console.log(`Allc text: ${allcText}`);
        console.log(`Allc link: ${allcLink}`);

        // Cari elemen link dengan type 'application/json'
        const jsonLink = $('link[type="application/json"]').attr('href');
        console.log(`JSON link: ${jsonLink}`);

        // Fetch konten JSON
        const jsonResponse = await axios.get(jsonLink, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
            }
        });

        const jsonData = jsonResponse.data;
        const contentRendered = jsonData.content.rendered;

        // Muat konten yang dirender untuk mem-parsing gambar
        const contentHtml = cheerio.load(contentRendered);
        const imageElements = contentHtml('img').map((i, el) => contentHtml(el).attr('src')).get();
        console.log(`Image elements: ${imageElements}`);

        // Siapkan hasil dalam bentuk JSON
        const result = {
            title: pageTitle,
            h1: h1Text,
            allcText: allcText,
            allcLink: allcLink,
            images: imageElements
        };

        res.json(result);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

// Export module untuk digunakan oleh Vercel
module.exports = app;
