const mongoose = require('mongoose');

const PaymentMethodSchema = new mongoose.Schema({
  type: { type: String, required: true },          // "Crypto", "Bank", "PayPal", "Skype"
  credentials: { type: Object, default: {} },      // e.g. { bitcoin: "...", ethereum: "...", usdt: "..." }
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('PaymentMethod', PaymentMethodSchema);
