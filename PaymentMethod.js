const mongoose = require("mongoose");

const PaymentMethodSchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g. "paypal", "bank", "crypto"
  credentials: { type: Object, required: true }, // { email: "xxx", account: "...", address: "..." }
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("PaymentMethod", PaymentMethodSchema);
