const  PurchaseOrder =  require("../models/purchaseModel");
const Product = require("../models/productModel");
const Vendor = require('../models/vendorModel'); // adjust path
const { default: mongoose } = require("mongoose");

exports.createPurchaseOrder = async (req, res) => {
    try {
        const {
            vendorId,
            purchaseOrderNumber,
            purchaseDate,
            deliveryDate,
            notes,
            items,
            totalAmount
        } = req.body;

        const newOrder = new PurchaseOrder({
            vendorId,
            purchaseOrderNumber,
            purchaseDate,
            deliveryDate,
            notes,
            items,
            totalAmount
        });

        await newOrder.save();

        res.status(201).json({ success: true, message: 'Purchase order created successfully.', data: newOrder });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error', error });
    }
};

exports.getAllPurchaseOrders = async (req, res) => {
  try {
    
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const paymentStatus = req.query.paymentStatus || "all";
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const matchStage = {};

  
console.log(paymentStatus)
    // Filter by payment status
    if (paymentStatus !== "all") {
      matchStage.paymentStatus = paymentStatus;
    }

    // Filter by date range
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) {
        matchStage.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        matchStage.createdAt.$lte = new Date(endDate + "T23:59:59.999Z");
      }
    }

    const searchRegex = new RegExp(search, "i");

    const aggregateQuery = [
      {
        $lookup: {
          from: "vendors",
          localField: "vendorId",
          foreignField: "_id",
          as: "vendor",
        },
      },
      { $unwind: "$vendor" },
      {
        $match: {
          ...matchStage,
          ...(search
            ? {
                $or: [
                  { purchaseOrderNumber: searchRegex },
                  { "vendor.name": searchRegex },
                ],
              }
            : {}),
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: "count" }],
          summary: [
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalAmount: { $sum: "$totalAmount" },
                totalPaid: {
                  $sum: {
                    $cond: [
                      { $eq: ["$paymentStatus", "paid"] },
                      "$totalAmount",
                      {
                        $cond: [
                          { $eq: ["$paymentStatus", "partial"] },
                          { $toDouble: { $ifNull: ["$paymentAmount", 0] } },
                          0,
                        ],
                      },
                    ],
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                totalOrders: 1,
                totalAmount: 1,
                totalPaid: 1,
                totalPending: { $subtract: ["$totalAmount", "$totalPaid"] },
              },
            },
          ],
        },
      },
    ];

    const result = await PurchaseOrder.aggregate(aggregateQuery);

    const orders = result[0].data;
    const totalOrders = result[0].totalCount[0]?.count || 0;
    const totalPages = Math.ceil(totalOrders / limit);

    const summary = result[0].summary[0] || {
      totalOrders: 0,
      totalAmount: 0,
      totalPaid: 0,
      totalPending: 0,
    };

    return res.status(200).json({
      success: true,
      message: orders.length
        ? "Purchase Orders fetched successfully!"
        : "No purchase orders found!",
      orders,
      totalOrders,
      totalPages,
      currentPage: page,
      summary,
    });
  } catch (error) {
    console.error("Error fetching purchase orders:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error fetching purchase orders!",
      error: error.message,
    });
  }
};




exports.getSinglePurchaseOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await PurchaseOrder.findById(id).populate('vendorId').populate('items.productId');

        if (!order) return res.status(404).json({ success: false, message: 'Purchase order not found' });

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error', error });
    }
};

exports.updatePurchaseOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            vendorId,
            purchaseOrderNumber,
            purchaseDate,
            deliveryDate,
            notes,
            items,
        } = req.body;

        const updatedOrder = await PurchaseOrder.findByIdAndUpdate(
            id,
            {
                vendorId,
                purchaseOrderNumber,
                purchaseDate,
                deliveryDate,
                notes,
                items,
            },
            { new: true }
        );

        if (!updatedOrder) return res.status(404).json({ success: false, message: 'Purchase order not found' });

        res.status(200).json({ success: true, message: 'Purchase order updated successfully', data: updatedOrder });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error', error });
    }
};

exports.deletePurchaseOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await PurchaseOrder.findByIdAndDelete(id);

        if (!deleted) return res.status(404).json({ success: false, message: 'Purchase order not found' });

        res.status(200).json({ success: true, message: 'Purchase order deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error', error });
    }
};




exports.updateItemQualityStatus = async (req, res) => {
    try {
      const { purchaseOrderId } = req.params;
      const updatedItems = req.body;
  
      const order = await PurchaseOrder.findById(purchaseOrderId);
      if (!order) {
        return res.status(404).json({ success: false, message: "Purchase order not found" });
      }
  
      // Loop over the incoming updatedItems
      for (const incomingItem of updatedItems) {
        const existingItem = order.items.id(incomingItem._id);
        if (existingItem) {
          // Update item quality status
          existingItem.qualityStatus = incomingItem.qualityStatus || existingItem.qualityStatus;
          existingItem.qualityNotes = incomingItem.qualityNotes || existingItem.qualityNotes;
          existingItem.mediaUrls = incomingItem.mediaUrls || existingItem.mediaUrls;
  
          // If approved, update the product quantity
          if (incomingItem.qualityStatus === "approved") {
            const product = await Product.findById(incomingItem.productId._id);
            if (product) {
              // Check if already updated for this order
              const alreadyUpdated = product.updatedFromOrders.includes(purchaseOrderId);
              if (!alreadyUpdated) {
                product.quantity += incomingItem.quantity;
                product.updatedFromOrders.push(purchaseOrderId);
                await product.save();
              }
            }
          }
        }
      }
  
      await order.save();
  
      res.status(200).json({
        success: true,
        message: "Items and product quantities updated successfully",
        data: order.items,
      });
    } catch (error) {
      console.error("Error in bulk quality update:", error);
      res.status(500).json({ success: false, message: "Internal server error", error });
    }
  };


exports.updatePaymentDetailsPurchase = async (req, res) => {
    const { orderId } = req.params;
    const { method, transactionId, notes, paymentType, amountPaid } = req.body;
  
    console.log(req.body);
  
    try {
      // Check for valid method
      if (!["cash", "creditcard", "cheque"].includes(method)) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment method. Allowed: 'cash' or 'creditcard'",
        });
      }
  
      // Validate based on method
      if (method === "creditcard" && !transactionId) {
        return res.status(400).json({
          success: false,
          message: "Transaction ID is required for credit card payments",
        });
      }
  
      if (method === "cash" && !notes) {
        return res.status(400).json({
          success: false,
          message: "Notes are required for cash payments",
        });
      }
  
      // Prepare paymentDetails object
      const paymentDetails = {
        method,
        ...(method === "creditcard" ? { transactionId } : {}),
        ...(method === "cash" ? { notes } : {}),
        ...(method === "cheque" ? { notes } : {}),
        paymentDate: new Date(), // Yaha backend me hi current date daal do
      };
  
      const updatedOrder = await PurchaseOrder.findByIdAndUpdate(
        orderId,
        {
          paymentDetails,
          paymentStatus: paymentType === "full" ? "paid" : "partial",
          paymentAmount: amountPaid,
        },
        { new: true }
      );
  
      if (!updatedOrder) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }
  
      return res.status(200).json({
        success: true,
        message: "Payment details updated successfully",
        data: updatedOrder,
      });
    } catch (error) {
      console.error("Error updating payment details:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  };





exports.vendorDetailsWithPurchaseOrders = async (req, res) => {
  const { vendorId } = req.params;

  try {
    const result = await Vendor.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(vendorId) },
      },
      {
        $lookup: {
          from: "purchaseorders",
          let: { vendorId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$vendorId", "$$vendorId"] }
              }
            },
            { $sort: { purchaseDate: -1 } },
            // Add product details
            {
              $lookup: {
                from: "products",
                localField: "items.productId",
                foreignField: "_id",
                as: "productDetails"
              }
            },
            // Merge product details into each item
            {
              $addFields: {
                items: {
                  $map: {
                    input: "$items",
                    as: "item",
                    in: {
                      $mergeObjects: [
                        "$$item",
                        {
                          $let: {
                            vars: {
                              product: {
                                $arrayElemAt: [
                                  {
                                    $filter: {
                                      input: "$productDetails",
                                      as: "prod",
                                      cond: {
                                        $eq: ["$$prod._id", "$$item.productId"]
                                      }
                                    }
                                  },
                                  0
                                ]
                              }
                            },
                            in: {
                              productName: "$$product.name",
                              productUnit: "$$product.unit",
                              productCategory: "$$product.category"
                            }
                          }
                        }
                      ]
                    }
                  }
                }
              }
            },
            {
              $project: {
                productDetails: 0 // remove the redundant array
              }
            }
          ],
          as: "purchaseOrders"
        }
      },
      {
        $addFields: {
          purchaseOrders: { $ifNull: ["$purchaseOrders", []] },
          totalOrders: { $size: { $ifNull: ["$purchaseOrders", []] } },
          totalSpent: {
            $sum: {
              $map: {
                input: { $ifNull: ["$purchaseOrders", []] },
                as: "order",
                in: "$$order.totalAmount"
              }
            }
          },
          totalPay: {
            $sum: {
              $map: {
                input: { $ifNull: ["$purchaseOrders", []] },
                as: "order",
                in: {
                  $cond: [
                    { $eq: ["$$order.paymentStatus", "paid"] },
                    "$$order.totalAmount",
                    {
                      $cond: [
                        { $eq: ["$$order.paymentStatus", "partial"] },
                        { $toDouble: "$$order.paymentAmount" },
                        0,
                      ],
                    },
                  ],
                },
              },
            }
          },
          balanceDue: {
            $sum: {
              $map: {
                input: { $ifNull: ["$purchaseOrders", []] },
                as: "order",
                in: {
                  $cond: [
                    { $eq: ["$$order.paymentStatus", "paid"] },
                    0,
                    {
                      $subtract: [
                        { $toDouble: "$$order.totalAmount" },
                        {
                          $cond: [
                            { $eq: ["$$order.paymentStatus", "partial"] },
                            { $toDouble: "$$order.paymentAmount" },
                            0,
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            }
          },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          type: 1,
          email: 1,
          phone: 1,
          address: 1,
          productsSupplied: 1,
          totalOrders: 1,
          totalSpent: 1,
          totalPay: 1,
          balanceDue: 1,
          purchaseOrders: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);

    if (result.length > 0) {
      return res.status(200).json({
        success: true,
        message: "Vendor details with purchase orders fetched successfully",
        data: result[0],
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }
  } catch (error) {
    console.error("Error fetching vendor purchase order details:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching purchase order details",
      error: error.message,
    });
  }
};




