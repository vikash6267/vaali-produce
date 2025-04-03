const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  items: {
    type: Array,
    required: true,
  },
  orderNumber: {
    type: String,
  
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "auth",
  },
  status: {
    type: String,
    default: "Processing",
  },
  total: {
    type: Number,
  }



}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
