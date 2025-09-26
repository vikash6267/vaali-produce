const mongoose = require("mongoose");

const chequeSchema = new mongoose.Schema(
  {
    images: [
      {
        type: String,
        trim: true,
      },
    ],
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now, // हमेशा UTC में save होगा
    },
    notes: {
      type: String,
      trim: true,
    },
    chequeNumber: {
      type: String,
      required: true,
      unique: true, // हर cheque का unique number
      trim: true,
    },
  },
  
);

const authSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
    },
    storeName: {
      type: String,
      trim: true,
    },
    ownerName: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    zipCode: {
      type: String,
      trim: true,
    },
    businessDescription: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    priceCategory: {
      type: String,
      default: "price",
    },
    shippingCost: {
      type: Number,
      default: 0,
    },
    agreeTerms: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["member", "store", "admin"],
      default: "member",
    },
    isOrder: {
      type: Boolean,
      default: false,
    },
    isProduct: {
      type: Boolean,
      default: false,
    },
    token: {
      type: String,
    },

    // ✅ नया cheque field
    cheques: [chequeSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("auth", authSchema);
