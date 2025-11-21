const express = require('express');
const Product = require('../models/Product');
const PriceHistory = require('../models/PriceHistory');
const auth = require('../models/PriceHistory');
const { scrapeAmazonProduct } = require('../services/scraper');

const router = express.Router();

// Get all products for user
router.get('/', auth, async (req, res) => {
  try {
    const products = await Product.find({ user: req.user._id }).sort({ createdAt: -1 });
    
    // Get price history for each product
    const productsWithHistory = await Promise.all(
      products.map(async (product) => {
        const history = await PriceHistory.find({ product: product._id })
          .sort({ date: 1 })
          .limit(30)
          .select('price date');
        
        return {
          ...product.toObject(),
          priceHistory: history.map(h => ({
            price: h.price,
            date: h.date.toISOString().split('T')[0]
          }))
        };
      })
    );

    res.json(productsWithHistory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new product
router.post('/', auth, async (req, res) => {
  try {
    const { url, targetPrice, email } = req.body;

    // Scrape product details
    const productData = await scrapeAmazonProduct(url);

    // Create product
    const product = new Product({
      user: req.user._id,
      name: productData.name,
      url: url,
      currentPrice: productData.price,
      targetPrice: parseFloat(targetPrice),
      imageUrl: productData.imageUrl,
      alertEmail: email || req.user.email,
      lowestPrice: productData.price,
      highestPrice: productData.price
    });

    await product.save();

    // Create initial price history
    const priceHistory = new PriceHistory({
      product: product._id,
      price: productData.price
    });
    await priceHistory.save();

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete product
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, user: req.user._id });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await Product.deleteOne({ _id: req.params.id });
    await PriceHistory.deleteMany({ product: req.params.id });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle alert
router.put('/:id/alert', auth, async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, user: req.user._id });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    product.alertEnabled = !product.alertEnabled;
    await product.save();

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;