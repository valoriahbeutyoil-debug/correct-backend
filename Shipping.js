const mongoose = require("mongoose");

const ShippingSchema = new mongoose.Schema({
  method: { type: String, default: "Standard Shipping" },
  cost: { type: Number, default: 0 },
  estimatedDelivery: { type: String, default: "3-5 business days" }
}, { timestamps: true });

module.exports = mongoose.model("Shipping", ShippingSchema);
