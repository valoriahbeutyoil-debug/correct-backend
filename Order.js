const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  items: Array, 
  totalUSD: Number,
  paymentMethod: String, // "crypto" | "bank" | "paypal"
  cryptoType: String,    // BTC | ETH | USDT (TRC20)
  cryptoAmount: Number,
  paymentProof: String,  // uploaded image URL
  status: { type: String, default: "pending" },
}, { timestamps: true });

module.exports = mongoose.model("Order", OrderSchema);
