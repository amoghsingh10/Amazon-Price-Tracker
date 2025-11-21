const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeAmazonProduct(url) {
  try {
    // Note: Amazon has anti-scraping measures. In production, use:
    // 1. Puppeteer with headless browser
    // 2. Proxy rotation
    // 3. Amazon Product Advertising API
    
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(data);

    // Extract product details (selectors may need updates)
    const name = $('#productTitle').text().trim() || 'Unknown Product';
    const priceWhole = $('.a-price-whole').first().text().replace(/[^0-9]/g, '') || '0';
    const priceFraction = $('.a-price-fraction').first().text() || '00';
    const price = parseFloat(`${priceWhole}.${priceFraction}`);
    const imageUrl = $('#landingImage').attr('src') || '';

    return {
      name,
      price,
      imageUrl
    };
  } catch (error) {
    console.error('Scraping error:', error.message);
    // Return mock data if scraping fails
    return {
      name: 'Product (Scraping Failed)',
      price: 0,
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop'
    };
  }
}

module.exports = { scrapeAmazonProduct };