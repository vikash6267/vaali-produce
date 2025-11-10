const mongoose = require("mongoose");

const TripSchema = new mongoose.Schema(
  {
    route: {
      from: { type: String, required: true, trim: true },
      to: { type: String, required: true, trim: true },
    },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ["Planned", "On Route", "Delivered", "Cancelled"],
      default: "Planned",
    },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", required: true },
    truck: { type: mongoose.Schema.Types.ObjectId, required: true },
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
    capacity_kg: { type: Number, default: 0 },
    capacity_m3: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Trip", TripSchema);
