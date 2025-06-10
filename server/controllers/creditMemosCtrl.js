// controllers/creditMemoController.js

const CreditMemo = require("../models/creditMemosModel");
const Order = require("../models/orderModle");
const mongoose = require("mongoose");
// Generate unique CreditMemo number (simple example)
const generateCreditMemoNumber = async () => {
  const count = await CreditMemo.countDocuments();
  return `CM-${count + 1}`; // Customize format as needed
};
const cloudinary = require("cloudinary").v2

// Create Credit Memo
exports.createCreditMemo = async (req, res) => {
  try {
    const { files, body } = req;

    // Parse credit memo data
    const creditMemoData = JSON.parse(body.creditMemoData);
    const creditItems = [];

    // Parse items and upload files
    for (let i = 0; ; i++) {
      const itemKey = `items[${i}]`;
      if (!body[itemKey]) break;

      const itemData = JSON.parse(body[itemKey]);
      const fileCount = Number(itemData.fileCount || 0);
      const uploadedFiles = [];

      for (let j = 0; j < fileCount; j++) {
        const fileField = `item_${i}_file_${j}`;
        const file = files[fileField];

        if (file) {
          const result = await cloudinary.uploader.upload(file.tempFilePath, {
            resource_type: "auto",
            folder: "credit-memos",
          });

          uploadedFiles.push({
            url: result.secure_url,
            type: result.resource_type,
          });
        }
      }

      creditItems.push({
        ...itemData,
        files: uploadedFiles,
      });
    }

    // Save credit memo
    const newCreditMemo = new CreditMemo({
      creditMemoNumber: creditMemoData.creditMemoNumber,
      date: creditMemoData.date,
      reason: creditMemoData.reason,
      notes: creditMemoData.notes,
      refundMethod: creditMemoData.refundMethod,
      totalAmount: creditMemoData.totalAmount,
      orderId: new mongoose.Types.ObjectId(creditMemoData.orderId),
      customerId: new mongoose.Types.ObjectId(creditMemoData.customerId),
      orderNumber: creditMemoData.orderNumber,
      customerName: creditMemoData.customerName,
      status: creditMemoData.status || "pending",
      createdAt: creditMemoData.createdAt || new Date(),
      items: creditItems,
    });

    await newCreditMemo.save();

    // ✅ Push credit memo into the order
    const order = await Order.findById(new mongoose.Types.ObjectId(creditMemoData.orderId));
    if (order) {
      if (!Array.isArray(order.creditMemos)) {
        order.creditMemos = [];
      }
      order.creditMemos.push(newCreditMemo._id);
      await order.save();
    }

    return res.status(201).json({
      message: "Credit memo created and added to order",
      success:true,
      creditMemo: newCreditMemo,
    });
  } catch (error) {
    console.error("Error creating credit memo:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// Get All Credit Memos with optional filters, pagination
exports.getCreditMemos = async (req, res) => {
  try {
    const { status, customerId, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const creditMemos = await CreditMemo.find(filter)
      .populate("orderId")
      .populate("customerId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await CreditMemo.countDocuments(filter);

    return res.json({
      data: creditMemos,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching credit memos:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// Get single Credit Memo by ID
exports.getCreditMemoById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ error: "Invalid credit memo ID" });

    const creditMemo = await CreditMemo.findById(id)
      .populate("orderId")
      .populate("customerId");

    if (!creditMemo) return res.status(404).json({ error: "Credit memo not found" });

    return res.json(creditMemo);
  } catch (error) {
    console.error("Error fetching credit memo:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// Update Credit Memo status or reason etc.
exports.updateCreditMemo = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ error: "Invalid credit memo ID" });

    // Only allow specific fields to update for safety
    const allowedUpdates = ["status", "reason", "refundMethod", "items", "totalAmount"];
    const updateData = {};
    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) updateData[field] = updates[field];
    });

    updateData.updatedAt = new Date();

    const updatedCreditMemo = await CreditMemo.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedCreditMemo) return res.status(404).json({ error: "Credit memo not found" });

    return res.json({ message: "Credit memo updated", creditMemo: updatedCreditMemo });
  } catch (error) {
    console.error("Error updating credit memo:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// Delete Credit Memo (optional)
exports.deleteCreditMemo = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ error: "Invalid credit memo ID" });

    const deleted = await CreditMemo.findByIdAndDelete(id);

    if (!deleted) return res.status(404).json({ error: "Credit memo not found" });

    return res.json({ message: "Credit memo deleted" });
  } catch (error) {
    console.error("Error deleting credit memo:", error);
    return res.status(500).json({ error: "Server error" });
  }
};
