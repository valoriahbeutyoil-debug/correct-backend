const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();

// ---------------- Order Schema ----------------
const OrderSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  items: Array, 
  totalUSD: Number,
  paymentMethod: String, // "crypto" | "bank" | "paypal"
  cryptoType: String,    // BTC | ETH | USDT (TRC20)
  cryptoAmount: Number,
  paymentProof: String,  // image URL
  status: { type: String, default: "pending" },
}, { timestamps: true });

const Order = mongoose.model("Order", OrderSchema);

// ---------------- Order Routes ----------------

// Create new order
router.post("/", async (req, res) => {
  try {
    const order = await Order.create(req.body);
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all orders (admin)
router.get("/", async (req, res) => {
  const orders = await Order.find();
  res.json(orders);
});

module.exports = router;
