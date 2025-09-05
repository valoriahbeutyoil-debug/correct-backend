const mongoose = require('mongoose');

const PaymentMethodSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['PayPal', 'Stripe', 'Crypto', 'Bank'],
    required: true
  },
  credentials: {
    // For PayPal/Stripe: API keys, for Bank: account info, for Crypto: address
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  active: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PaymentMethod', PaymentMethodSchema);
