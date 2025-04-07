const mongoose = require("mongoose");

const addressSchema = {
  name: { type: String, required: true },
  email: { type: String },
  address: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
};

const orderSchema = new mongoose.Schema(
  {
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
    },
    billingAddress: {
      type: addressSchema,
      required: true,
    },
    shippingAddress: {
      type: addressSchema,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
