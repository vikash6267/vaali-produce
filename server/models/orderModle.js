const mongoose = require("mongoose");

const addressSchema = {
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  address: { type: String, },
  city: { type: String, },
  postalCode: { type: String,  },
  country: { type: String, },
};

const palletDataSchema = new mongoose.Schema({
  worker: String,
  palletCount: Number,
  boxesPerPallet: {
    type: Map,
    of: Number, // key: item ID, value: number of boxes
  },
  totalBoxes: Number,
  chargePerPallet: Number,
  totalPalletCharge: Number,
  selectedItems: [String], // or [mongoose.Schema.Types.ObjectId] if referencing items
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });


const orderSchema = new mongoose.Schema(
  {
    items: {
      type: Array,
      required: true,
    },
    orderNumber: {
      type: String,
    },
    shippinCost: {
      type: Number,
      default:0
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
    palletData: palletDataSchema,

  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
