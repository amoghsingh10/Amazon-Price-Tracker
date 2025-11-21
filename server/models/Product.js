const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  currentPrice: {
    type: Number,
    required: true,
    default: 0
  },
  targetPrice: {
    type: Number,
    required: true
  },
  imageUrl: {
    type: String,
    default: ''
  },
  alertEnabled: {
    type: Boolean,
    default: true
  },
  alertEmail: {
    type: String,
    default: ''
  },
  lowestPrice: {
    type: Number,
    default: 0
  },
  highestPrice: {
    type: Number,
    default: 0
  },
  lastChecked: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', productSchema);