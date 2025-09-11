const mongoose = require('mongoose');

const PaymentMethodSchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g. 'PayPal', 'Crypto', 'Bank'
  credentials: { type: Object, default: {} }, // dynamic key/value pairs
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('PaymentMethod', PaymentMethodSchema);
