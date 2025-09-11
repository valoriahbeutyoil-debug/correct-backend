const mongoose = require('mongoose');

const PaymentMethodSchema = new mongoose.Schema({
  type: { type: String, required: true }, // 'Crypto', 'PayPal', 'Bank', 'Skype'
  credentials: { type: Object, required: true },
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('PaymentMethod', PaymentMethodSchema);
