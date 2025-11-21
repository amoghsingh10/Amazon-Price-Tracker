const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();

// Correct relative paths
const connectDB = require("./config/db");
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const Product = require('./models/Product');
const PriceHistory = require('./models/PriceHistory');
const { scrapeAmazonProduct } = require('./services/scraper');
const { sendPriceAlert } = require('./services/emailService');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Cron job to check prices every 6 hours
cron.schedule('0 */6 * * *', async () => {
  console.log('Running price check...');

  try {
    const products = await Product.find({ alertEnabled: true }).populate('user');

    for (const product of products) {
      try {
        const scrapedData = await scrapeAmazonProduct(product.url);
        const newPrice = scrapedData.price;

        // Update product price
        product.currentPrice = newPrice;
        product.lastChecked = new Date();

        // Update lowest/highest prices
        if (newPrice < product.lowestPrice || product.lowestPrice === 0) {
          product.lowestPrice = newPrice;
        }
        if (newPrice > product.highestPrice) {
          product.highestPrice = newPrice;
        }

        await product.save();

        // Add to price history
        const priceHistory = new PriceHistory({
          product: product._id,
          price: newPrice
        });
        await priceHistory.save();

        // Send alert if price dropped below target
        if (newPrice <= product.targetPrice) {
          await sendPriceAlert(product.alertEmail, product);
        }

        console.log(`Updated ${product.name}: $${newPrice}`);
      } catch (error) {
        console.error(`Error updating ${product.name}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Cron job error:', error.message);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
