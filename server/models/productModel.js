const mongoose = require("mongoose");




const ProductSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            default: 0,
        },
        unit: {
            type: String,


        },
        price: {
            type: Number,
            required: true,
            default: 0,
        },
        threshold: {
            type: Number,
            default: 0,
        },
        description: {
            type: String,
            required: true,
        },
        enablePromotions: {
            type: Boolean,
            default: false,
        },
        palette: {
            type: String,
        },
        bulkDiscount: [
            {
                minQuantity: { type: Number, required: true },
                discountPercent: { type: Number, required: true },
                quantity: { type: Number },
                discountPercentage: { type: Number },
            }
        ],
        weightVariation: {
            type: Number,
            default: 0,
        },
        expiryDate: {
            type: Date,
        },
        batchInfo: {
            type: String,
        },
        origin: {
            type: String,
        },
        organic: {
            type: Boolean,
            default: false,
        },
        storageInstructions: {
            type: String,
        },
        boxSize: {
            type: Number,
            default: 0,
        },
        pricePerBox: {
            type: Number,
            default: 0,
        },
        image:
        {
            type: String,
        },

    },
    { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
