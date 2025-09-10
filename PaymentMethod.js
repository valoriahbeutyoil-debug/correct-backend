const mongoose = require('mongoose');

const PaymentMethodSchema = new mongoose.Schema({
  bitcoin: { type: String, default: '' },
  ethereum: { type: String, default: '' },
  usdt: { type: String, default: '' },
  bank: { type: String, default: '' },
  paypal: { type: String, default: '' },
  skype: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('PaymentMethod', PaymentMethodSchema);
