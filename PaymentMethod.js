const mongoose = require("mongoose");

const PaymentSettingsSchema = new mongoose.Schema({
  paypalEmail: String,
  bankDetails: {
    accountName: String,
    accountNumber: String,
    bankName: String,
  },
  cryptoDetails: {
    btcAddress: String,
    ethAddress: String,
    usdtTrc20Address: String, // ✅ USDT (TRC20)
  },
}, { timestamps: true });

module.exports = mongoose.model("PaymentSettings", PaymentSettingsSchema);
