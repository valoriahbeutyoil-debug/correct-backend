const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  products: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      quantity: Number
    }
  ],
  total: Number,
  billingInfo: {
    name: String,
    email: String,
    phone: String,
    address: String,
    city: String,
    country: String
  },
  paymentAddresses: {
    bitcoin: String,
    ethereum: String,
    usdt: String // TRC20
  },
  paymentMethod: { type: String, enum: ["paypal", "bank", "crypto"], default: "crypto" },
  status: { type: String, default: "pending" }
}, { timestamps: true });

module.exports = mongoose.model("Order", OrderSchema);
