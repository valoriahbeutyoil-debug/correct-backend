const mongoose = require("mongoose");

const PaymentMethodSchema = new mongoose.Schema({
  paypalEmail: String,
  bankDetails: {
    accountName: String,
    accountNumber: String,
    bankName: String,
  },
  cryptoDetails: {
    btcAddress: String,
    ethAddress: String,
    usdtTrc20Address: String,
  },
}, { timestamps: true });

module.exports = mongoose.model("PaymentMethod", PaymentMethodSchema);
