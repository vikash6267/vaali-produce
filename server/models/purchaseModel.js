const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  unitPrice: {
    type: Number,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  qualityStatus: {
    type: String,
    enum: ['approved', 'rejected',"pending"],
    default: 'pending',
  },
  
  qualityNotes: {
    type: String,
    default: '',
  },
  batchNumber: {
    type: String,
    
  },
  mediaUrls: {
    type: [String], // Array of strings
    default: []
  }
  
  
});


const purchaseOrderSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
  },
  purchaseOrderNumber: { type: String, required: true, unique: true },
  purchaseDate: { type: Date, required: true },
  deliveryDate: { type: Date },
  notes: { type: String },
  paymentStatus: { type: String },
  status: { type: String ,default:"quality-check"},
  totalAmount: { type: Number },
  items: [purchaseItemSchema],
}, { timestamps: true });


module.exports = mongoose.model("PurchaseOrder", purchaseOrderSchema);
