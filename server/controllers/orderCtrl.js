const orderModel = require("../models/orderModle");
const mongoose = require("mongoose");
const authModel = require("../models/authModel"); // Ensure the correct path for your Auth model
const { generateStatementPDF } = require("../utils/generateOrder");
const nodemailer = require("nodemailer");
const { exportInvoiceToPDFBackend } = require("../templates/exportInvoice");
const Counter = require("../models/counterModel");

const mailSender = async (
  to,
  subject,
  text,
  pdfBase64,
  filename = "Customer_Statement.pdf"
) => {
  try {
    let transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      secure: false,
    });

    const mailOptions = {
      from: process.env.MAIL_USER,
      to,
      subject,
      text,
      attachments: [
        {
          filename: filename,
          content: Buffer.from(pdfBase64, "base64"),
          contentType: "application/pdf",
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
  } catch (err) {
    console.error("Email sending failed:", err);
  }
};


const getNextOrderNumber = async () => {
  const counter = await Counter.findByIdAndUpdate(
    { _id: "order" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const paddedSeq = String(counter.seq).padStart(5, "0"); // 00101, 00102...
  return `N-${paddedSeq}`;
};

const createOrderCtrl = async (req, res) => {
  try {
    const {
      items,
      status,
      total,
      clientId,
      billingAddress,
      shippingAddress,
      orderType = "Regural",
      orderNumber,
      createdAt,
    } = req.body;

    console.log(req.body);

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Order items are required" });
    }

    if (!status) {
      return res.status(400).json({ message: "Order status is required" });
    }
    if (!total || total <= 0) {
      return res
        .status(400)
        .json({ message: "Total amount must be greater than zero" });
    }

    const generateOrderNumber = () => {
      const randomNumber = Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit random number
      return `${randomNumber}`;
    };

    const user = await authModel
      .findById(clientId.value)
      .select("shippingCost");

    const shippinCost = user.shippingCost;

    // More robust date handling for VPS deployment
    let orderDate;
    if (createdAt) {
      // If a specific date was provided, use it directly as an ISO string
      // This bypasses timezone issues by storing the exact string representation
      if (typeof createdAt === "string") {
        // If it's already a string (like from a date picker), parse it
        const dateObj = new Date(createdAt);
        // Force the date to be interpreted as is, without timezone adjustment
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth();
        const day = dateObj.getDate();

        // Create date at noon to avoid any day boundary issues
        orderDate = new Date(Date.UTC(year, month, day, 12, 0, 0));
      } else {
        // If it's already a Date object
        const year = createdAt.getFullYear();
        const month = createdAt.getMonth();
        const day = createdAt.getDate();

        orderDate = new Date(Date.UTC(year, month, day, 12, 0, 0));
      }
    } else {
      // If no date provided, use current date (today)
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const day = now.getDate();

      orderDate = new Date(Date.UTC(year, month, day, 12, 0, 0));
    }

    const newOrder = new orderModel({
      orderNumber: orderNumber ? orderNumber : await getNextOrderNumber(),
      items,
      store: clientId.value,
      status,
      shippingAddress,
      billingAddress,
      total: total + shippinCost,
      orderType,
      shippinCost,
      createdAt: orderDate, // Use the fixed date
    });

    await newOrder.save();

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      newOrder,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getAllOrderCtrl = async (req, res) => {
  try {
    const user = req.user;
    const search = req.query.search || "";
    const orderType = req.query.orderType || "";
    const paymentStatus = req.query.paymentStatus || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const matchStage = {};

    // Filter by user role
    if (user.role === "store") {
      matchStage.store = mongoose.Types.ObjectId(user.id);
    }

    if (paymentStatus !== "all") {
      matchStage.paymentStatus = paymentStatus;
    }

    if (orderType && orderType !== "Regural") {
      matchStage.orderType = orderType;
    } else if (orderType === "Regural") {
      matchStage.$or = [
        { orderType: "Regural" },
        { orderType: { $exists: false } },
      ];
    }

    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

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
          from: "auths",
          localField: "store",
          foreignField: "_id",
          as: "store",
        },
      },
      { $unwind: "$store" },
      {
        $match: {
          ...matchStage,
          ...(search
            ? {
                $or: [
                  { orderNumber: searchRegex },
                  { "store.storeName": searchRegex },
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
                totalAmount: { $sum: "$total" },
                totalReceived: {
                  $sum: {
                    $cond: [
                      { $eq: ["$paymentStatus", "paid"] },
                      "$total",
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
                totalReceived: 1,
                totalPending: { $subtract: ["$totalAmount", "$totalReceived"] },
              },
            },
          ],
        },
      },
    ];

    const result = await orderModel.aggregate(aggregateQuery);

    const orders = result[0].data;
    const totalOrders = result[0].totalCount[0]?.count || 0;
    const totalPages = Math.ceil(totalOrders / limit);

    const summary = result[0].summary[0] || {
      totalOrders: 0,
      totalAmount: 0,
      totalReceived: 0,
      totalPending: 0,
    };

    return res.status(200).json({
      success: true,
      message: orders.length
        ? "Orders fetched successfully!"
        : "No orders found!",
      orders,
      totalOrders,
      totalPages,
      currentPage: page,
      summary,
    });
  } catch (error) {
    console.error("Error fetching orders:", error.message, error.stack);
    return res.status(500).json({
      success: false,
      message: "Error fetching orders!",
      error: error.message,
    });
  }
};

const getOrderForStoreCtrl = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await orderModel.findById(id);
    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error in getting  order API!",
    });
  }
};

const updateOrderCtrl = async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;

    // Ensure the order exists
    const existingOrder = await orderModel.findById(id);
    if (!existingOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found!" });
    }

    // Update only the fields that are present in the request body
    Object.keys(updateFields).forEach((key) => {
      if (updateFields[key] !== undefined) {
        existingOrder[key] = updateFields[key];
      }
    });

    await existingOrder.save();

    return res.status(200).json({
      success: true,
      message: "Order updated successfully",
      updatedOrder: existingOrder,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error while updating order",
    });
  }
};

// POST /api/orders/:orderId/pallet
const updatePalletInfo = async (req, res) => {
  const { orderId } = req.params;
  const { palletData } = req.body;
  console.log(req.body);
  try {
    const updatedOrder = await orderModel.findByIdAndUpdate(
      orderId,
      { palletData },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      message: "Pallet info saved successfully",
      data: updatedOrder,
    });
  } catch (err) {
    console.error("Failed to save pallet info:", err);
    res.status(500).json({
      success: false,
      message: "Something went wrong while saving pallet info",
      error: err.message,
    });
  }
};

const userDetailsWithOrder = async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await authModel.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(userId) },
      },
      {
        $lookup: {
          from: "orders",
          let: { storeId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$store", "$$storeId"] } } },
            { $sort: { createdAt: -1 } },
          ],
          as: "orders",
        },
      },
      {
        $addFields: {
          totalOrders: { $size: "$orders" },
          totalSpent: {
            $sum: {
              $map: {
                input: "$orders",
                as: "order",
                in: "$$order.total",
              },
            },
          },
          totalPay: {
            $sum: {
              $map: {
                input: "$orders",
                as: "order",
                in: {
                  $cond: [
                    { $eq: ["$$order.paymentStatus", "paid"] },
                    "$$order.total",
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
            },
          },
          balanceDue: {
            $sum: {
              $map: {
                input: "$orders",
                as: "order",
                in: {
                  $cond: [
                    { $eq: ["$$order.paymentStatus", "paid"] },
                    0,
                    {
                      $subtract: [
                        { $toDouble: "$$order.total" },
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
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          totalOrders: 1,
          totalSpent: 1,
          totalPay: 1,
          balanceDue: 1,
          orders: 1,
          user: {
            _id: "$_id",
            email: "$email",
            phone: "$phone",
            storeName: "$storeName",
            ownerName: "$ownerName",
            address: "$address",
            city: "$city",
            state: "$state",
            zipCode: "$zipCode",
            businessDescription: "$businessDescription",
            role: "$role",
            createdAt: {
              $dateToString: {
                format: "%Y-%m-%dT%H:%M:%S.%LZ",
                date: "$createdAt",
              },
            },
          },
        },
      },
    ]);

    if (result.length > 0) {
      return res.status(200).json({
        success: true,
        message: "User details with order summary fetched successfully",
        data: result[0],
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
  } catch (error) {
    console.error("Error fetching user order details:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching order details",
      error: error.message,
    });
  }
};

const updatePaymentDetails = async (req, res) => {
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

    const updatedOrder = await orderModel.findByIdAndUpdate(
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

const deleteOrderCtrl = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order ID" });
    }

    const deletedOrder = await orderModel.findByIdAndDelete(id);

    if (!deletedOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    res.status(200).json({
      success: true,
      message: "Order deleted successfully",
      deletedOrder,
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const updateOrderTypeCtrl = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderType } = req.body;

    // Check if orderId is valid
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Order ID" });
    }

    // Validate orderType
    if (!orderType || typeof orderType !== "string") {
      return res
        .status(400)
        .json({
          success: false,
          message: "orderType is required and must be a string",
        });
    }

    // Find and update the order
    const updatedOrder = await orderModel.findByIdAndUpdate(
      orderId,
      { orderType },
      { new: true }
    );

    if (!updatedOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    res.status(200).json({
      success: true,
      message: "Order type updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating orderType:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getUserOrderStatement = async (req, res) => {
  try {
    const userId = req.params.userId || req.query.userId;
    const paymentStatus = req.query.paymentStatus || "all";
    const startMonth = req.query.startMonth;
    const endMonth = req.query.endMonth;
    const sendMail = req.query.send;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }

    // Fetch user details
    const user = await authModel
      .findById(userId)
      .select(
        "name storeName ownerName phone email address city state zipCode"
      );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Building query for orders
    // Building query for orders
    const query = { store: userId };
    if (paymentStatus !== "all") {
      if (paymentStatus === "pending") {
        query.paymentStatus = { $in: ["pending", "partial"] };
      } else {
        query.paymentStatus = paymentStatus;
      }
    }

    // Date range query
    if (startMonth || endMonth) {
      query.createdAt = {};
      if (startMonth) {
        const [year, month] = startMonth.split("-");
        query.createdAt.$gte = new Date(`${year}-${month}-01`);
      }
      if (endMonth) {
        const [year, month] = endMonth.split("-");
        const endDate = new Date(year, Number(month), 0);
        query.createdAt.$lte = endDate;
      }
    }

    // Fetch orders based on the query
    const orders = await orderModel.find(query).sort({ createdAt: 1 });

    if (!orders.length) {
      return res
        .status(404)
        .json({
          success: false,
          message: "No orders found with applied filters",
        });
    }

    // Generate summary and calculate totals
    const summary = {};
    let totalPaid = 0,
      totalPending = 0,
      totalProductsOrdered = 0;
    let allTotalAmount = 0;

    orders.forEach((order) => {
      const created = new Date(order.createdAt);
      const year = created.getFullYear();
      const month = (created.getMonth() + 1).toString().padStart(2, "0");
      const monthKey = `${year}-${month}`;

      if (!summary[monthKey]) {
        summary[monthKey] = {
          orders: [],
          totalAmount: 0,
          totalPaid: 0,
          totalPending: 0,
          totalProducts: 0,
        };
      }

      const itemCount = Array.isArray(order.items)
        ? order.items.reduce((sum, item) => sum + (item.quantity || 1), 0)
        : 0;

      // Determine the payment amount based on the status
      let paymentAmount = 0;
      if (order.paymentStatus === "paid") {
        paymentAmount = order.total; // If paid, the total amount is the payment amount
      } else if (order.paymentStatus === "partial") {
        paymentAmount = order.paymentAmount || 0; // Use the payment amount if partial
      }

      summary[monthKey].orders.push({
        orderNumber: order.orderNumber,
        date: created.toISOString(),
        amount: order.total,
        paymentStatus: order.paymentStatus,
        paymentAmount: paymentAmount, // Use the calculated payment amount
        productCount: itemCount,
      });

      // Calculate paid and balance directly from paymentAmount
      const totalAmount = parseFloat(order.total) || 0;
      const paid = parseFloat(order.paymentAmount) || 0;
      const pending = totalAmount - paid;

      summary[monthKey].totalAmount += totalAmount;
      summary[monthKey].totalPaid += paid;
      summary[monthKey].totalPending += pending;
      summary[monthKey].totalProducts += itemCount;
      allTotalAmount += totalAmount;
      totalPaid += paid;
      totalPending += pending;
      totalProductsOrdered += itemCount;
    });

    // Send mail if required
    if (sendMail == 1) {
      try {
        console.log("Sending statement via email...");

        const responsePDF = await generateStatementPDF({
          user: {
            name: user.ownerName || user.name,
            storeName: user.storeName,
            phone: user.phone,
            email: user.email,
            address: user.address,
            city: user.city,
            state: user.state,
            zipCode: user.zipCode,
          },
          filters: {
            paymentStatus,
            startMonth: startMonth || "all",
            endMonth: endMonth || "all",
          },
          summaryByMonth: summary,
          totalPaid,
          totalPending,
          totalProductsOrdered,
          closingBalance: totalPending,
        });

        // const customerEmail = "vikasmaheshwari6267@gmail.com" ;
        const customerEmail = user.email;
        const subject = `Monthly Statement for ${
          user.storeName
        } - ${new Date().toLocaleString("en-US", {
          month: "long",
          year: "numeric",
        })}`;
        const message = `
          Dear ${user.ownerName || user.name},

          Please find attached the monthly statement for your store "${
            user.storeName
          }".
          This statement includes order details and payment status for the selected period.

          Total Amount: ${allTotalAmount}
          Total Paid: ${totalPaid}
          Total Pending: ${totalPending}
          Total Products Ordered: ${totalProductsOrdered}

          If you have any questions or need further assistance, please reach out to us.

          Best Regards,
          Vali Produce
        `;

        await mailSender(customerEmail, subject, message, responsePDF);
        console.log("Email sent successfully to:", customerEmail);
      } catch (err) {
        console.error("Error while sending email:", err);
      }
    }

    // Sending response with order summary
    res.status(200).json({
      success: true,
      message: "Order statement generated successfully",
      data: {
        user: {
          name: user.ownerName || user.name,
          storeName: user.storeName,
          phone: user.phone,
          email: user.email,
          address: user.address,
          city: user.city,
          state: user.state,
          zipCode: user.zipCode,
        },
        filters: {
          paymentStatus,
          startMonth: startMonth || "all",
          endMonth: endMonth || "all",
        },
        summaryByMonth: summary,
        totalPaid,
        totalPending,
        totalProductsOrdered,
        closingBalance: totalPending,
      },
    });
  } catch (err) {
    console.error("Error generating user statement:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateShippingController = async (req, res) => {
  try {
    // Extract the required values from the request body
    const { orderId, newShippingCost, plateCount } = req.body;

    // Validate input
    if (!orderId || !newShippingCost || !plateCount) {
      return res.status(400).json({
        success: false,
        message: "Please provide orderId, newShippingCost, and plateCount.",
      });
    }

    // Fetch order from the database
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // Store the old shipping cost
    const oldShippingCost = order.shippinCost;

    // Calculate new shipping cost by multiplying with plate count
    const calculatedShippingCost = newShippingCost * plateCount;

    // Update the order's shipping cost and total

    order.shippinCost = calculatedShippingCost; // New shipping cost
    order.total = order.total + (calculatedShippingCost - oldShippingCost); // Update total cost

    // Save the updated order in the database
    await order.save();

    // Respond with success message
    return res.status(200).json({
      success: true,
      message: `Shipping cost updated successfully. Old Shipping Cost: ${oldShippingCost}, New Shipping Cost: ${calculatedShippingCost}`,
      updatedOrder: order, // Optionally send updated order details
    });
  } catch (error) {
    console.error("Error updating shipping cost:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the shipping cost.",
    });
  }
};

const getDashboardData = async (req, res) => {
  try {
    // Total Orders
    const totalOrders = await orderModel.countDocuments();

    // Total Stores
    const totalStores = await authModel.countDocuments({ role: "store" });

    // Aggregation for Payment Data
    const paymentData = await orderModel.aggregate([
      {
        $project: {
          total: 1,
          paymentStatus: 1,
          status: 1,
          paymentAmount: { $toDouble: { $ifNull: ["$paymentAmount", "0"] } },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$total" },
          totalReceived: {
            $sum: {
              $cond: [
                { $eq: ["$paymentStatus", "paid"] },
                "$total", // fully paid orders
                {
                  $cond: [
                    { $eq: ["$paymentStatus", "partial"] },
                    "$paymentAmount", // partial payment amount
                    0,
                  ],
                },
              ],
            },
          },
          // Pending Orders
          pendingPaidAmount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "pending"] },
                    { $eq: ["$paymentStatus", "partial"] },
                  ],
                },
                "$paymentAmount",
                0,
              ],
            },
          },
          pendingDueAmount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "pending"] },
                    { $ne: ["$paymentStatus", "paid"] },
                  ],
                },
                { $subtract: ["$total", "$paymentAmount"] },
                0,
              ],
            },
          },
          // Delivered Orders
          deliveredPaidAmount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "delivered"] },
                    { $eq: ["$paymentStatus", "partial"] },
                  ],
                },
                "$paymentAmount",
                {
                  $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$total", 0],
                },
              ],
            },
          },
          deliveredDueAmount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "delivered"] },
                    { $ne: ["$paymentStatus", "paid"] },
                  ],
                },
                { $subtract: ["$total", "$paymentAmount"] },
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          totalAmount: 1,
          totalReceived: 1,
          totalPending: { $subtract: ["$totalAmount", "$totalReceived"] },
          pendingPaidAmount: 1,
          pendingDueAmount: 1,
          deliveredPaidAmount: 1,
          deliveredDueAmount: 1,
        },
      },
    ]);

    const totalAmount = paymentData[0]?.totalAmount || 0;
    const totalReceived = paymentData[0]?.totalReceived || 0;
    const totalPending = paymentData[0]?.totalPending || 0;
    const pendingPaidAmount = paymentData[0]?.pendingPaidAmount || 0;
    const pendingDueAmount = paymentData[0]?.pendingDueAmount || 0;
    const deliveredPaidAmount = paymentData[0]?.deliveredPaidAmount || 0;
    const deliveredDueAmount = paymentData[0]?.deliveredDueAmount || 0;

    // Top 10 Users by Order Amount
    const topUsers = await orderModel.aggregate([
      {
        $group: {
          _id: "$store",
          totalAmount: { $sum: "$total" },
          orderCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "auths",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: "$userDetails",
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 10 },
      {
        $project: {
          name: "$userDetails.ownerName",
          storeName: "$userDetails.storeName",
          email: "$userDetails.email",
          orderCount: 1,
          totalAmount: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: "Dashboard data fetched successfully",
      data: {
        totalOrders,
        totalStores,
        totalAmount,
        totalReceived,
        totalPending,
        pendingOrders: {
          paidAmount: pendingPaidAmount,
          dueAmount: pendingDueAmount,
        },
        deliveredOrders: {
          paidAmount: deliveredPaidAmount,
          dueAmount: deliveredDueAmount,
        },
        topUsers,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard data",
      error: error.message,
    });
  }
};

const invoiceMailCtrl = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await orderModel.findById(id).populate("store");

    console.log(order);
    const responsePDF = await exportInvoiceToPDFBackend({
      id: order.orderNumber,
      clientId: order.store._id,
      clientName: order.store.storeName,
      shippinCost: order.shippinCost || 0,
      date: order.createdAt,
      shippingAddress: order?.shippingAddress,
      billingAddress: order?.billingAddress,
      status: order.status,
      items: order.items,
      total: order.total,
      paymentStatus: order.paymentStatus || "pending",
      subtotal: order.total,
      store: order.store,
      paymentDetails: order.paymentDetails || {},
    });

    // const customerEmail = "vikasmaheshwari6267@gmail.com" ;
    const customerEmail = order.store.email;
    const subject = `Invoice #${order.orderNumber}`;
    const message = `
      Hi ,

      Thank you for your order! Please find your invoice attached for your recent purchase with us.

      🧾 Invoice Number: ${order.orderNumber}
      📅 Date: ${new Date(order.createdAt).toLocaleDateString()}

      We're awaiting the cheque/payment. Kindly update us on the status at your earliest convenience. If you have any questions or need assistance, feel free to reach out. We appreciate your business and look forward to serving you again!

    Best regards,

    Nada Saiyed
    Sales Manager
    Vali Produce LLC, Atlanta, GA
    501-559-0123
        `;

    await mailSender(
      customerEmail,
      subject,
      message,
      responsePDF,
      `INVOICE- #${order.orderNumber}`
    );
    console.log("Email sent successfully to:", customerEmail);

    res.status(200).json({
      success: true,
      message: "Order type updated successfully",
    });
  } catch (error) {
    console.error("Error updating orderType:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getPendingOrders = async (req, res) => {
  try {
    const pendingOrders = await orderModel.aggregate([
      {
        $group: {
          _id: "$store", // ensure this is your correct field for store reference
          totalOrders: { $sum: 1 },
          totalAmount: { $sum: "$total" },
          totalPaid: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$total", 0] },
          },
          totalPending: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "pending"] }, "$total", 0],
            },
          },
        },
      },
      {
        $match: { totalPending: { $gt: 0 } }, // only stores with pending amount
      },
      {
        $lookup: {
          from: "auths",
          localField: "_id",
          foreignField: "_id",
          as: "storeInfo",
        },
      },
      {
        $unwind: {
          path: "$storeInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $sort: { totalPending: -1 }, // sort by pending amount descending
      },
      {
        $project: {
          storeName: "$storeInfo.storeName",
          storeEmail: "$storeInfo.email",
          totalOrders: 1,
          totalAmount: 1,
          totalPaid: 1,
          totalPending: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: "Pending orders by store fetched successfully",
      data: pendingOrders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching pending orders by store",
      error: error.message,
    });
  }
};

module.exports = {
  createOrderCtrl,
  getAllOrderCtrl,
  getOrderForStoreCtrl,
  updateOrderCtrl,
  updatePalletInfo,
  userDetailsWithOrder,
  updatePaymentDetails,
  deleteOrderCtrl,
  updateOrderTypeCtrl,
  getUserOrderStatement,
  updateShippingController,
  getDashboardData,
  getPendingOrders,
  invoiceMailCtrl,
};

//    const refreshQuickBooksToken = async () => {
//     const clientId = "ABdBUHAWcAozblp7GuIOwZc2kUoHGO7Cbr03dGeFY5qFGpiMks";
//     const clientSecret = "3T8JO8M35xETx2wFBJk17QdbCaHDllT1Kj3Ykdtl";
//     const refreshToken = "AB11753981833j2wVo6lJ0UcoLDMAE8KA7ySQUeSuGIeN5WDgJ";

//     const base64Creds = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

//     try {
//       const response = await axios.post(
//         "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
//         new URLSearchParams({
//           grant_type: "refresh_token",
//           refresh_token: refreshToken,
//         }),
//         {
//           headers: {
//             Authorization: `Basic ${base64Creds}`,
//             "Content-Type": "application/x-www-form-urlencoded",
//           },
//         }
//       );
//       return {
//         accessToken: response.data.access_token,
//         refreshToken: response.data.refresh_token, // Optional
//       };

//     } catch (err) {
//       console.error("❌ Error refreshing token:", err.response?.data || err.message);
//     }
//   };

//   const createOrderCtrl = async (req, res) => {
//     try {
//       const {
//         items,
//         status,
//         total,
//         clientId,
//         billingAddress,
//         shippingAddress,
//         shippinCost = 0,
//       } = req.body;

//       const user = await authModel.findById(clientId.value);

//       if (!items || items.length === 0) {
//         return res.status(400).json({ message: "Order items are required" });
//       }
//       if (!status) {
//         return res.status(400).json({ message: "Order status is required" });
//       }
//       if (!total || total <= 0) {
//         return res.status(400).json({ message: "Total amount must be greater than zero" });
//       }

//       const generateOrderNumber = () => {
//         const randomNumber = Math.floor(100000 + Math.random() * 900000);
//         return `${randomNumber}`;
//       };

//       // Save order in DB
//       const newOrder = new orderModel({
//         orderNumber: generateOrderNumber(),
//         items,
//         store: clientId.value,
//         status,
//         shippingAddress,
//         billingAddress,
//         total,
//         shippinCost,
//       });

//       await newOrder.save();

//       // ------------------ QUICKBOOKS INTEGRATION ------------------

//     //   const accessToken = "eyJlbmMiOiJBMTI4Q0JDLUhTMjU2IiwiYWxnIjoiZGlyIn0..Ihlg-C-ovwWziR9TPHPEHw.C_T1AsvK_QkZScDgURERs-FFFw_3edJ4Mp35I1tgPprplbYK1RqU13tdniG4u6EpMZJxuPpa6sD6hQg9BPvI666GrRR9_k10UHCr9eAi0FEe0ygDUcZNAOp9vCulqikfgVhNjxtupmridtfFjZpmm9_hjDgVXqxzVJMT48NSEkii0fiADf0T7jCFtt21OoSjBzf-lsoiWuLC2oe_DdGfS3rYC7WaeTuIcyJQ8TiH0Neod8XxWdzwaOLo-N_XZRvbFjPWPCX34RqgPrC75TfzQCMLavc-VyQux6FNe7scAHHOT36FnTVDX4dIcUP8fdMnKLtW4RFtYO6POe7oTB3q6apQe6v_CTBMSF8b0YM4dcs2sJIp8XbD5b2SZz1x6TIap681gxC1fV_wxuZyOfmsTsPQ0KiGAfzugmXlqbTgXyv5n-sBuJIv6wgY7ihQL_sN_ylL_K3SK7z5YdJCTzj8x2W1dYebGz82miEdbaUfHh8gcQLWjbVDaNnaTFOs2FsJDJHrvTpgIiae1uCPiw9gUtBRNV5XVPLQjDsJsygFssNL1pbfUoWd153Hf_6-jpwVj3DUiaV_P2z5vWsOEwf69aupJFOYDA0HbspMue-hsXHx6IbznUQnjjz4vrO2pLKcxlioIJsMjLI_P3CB9DUiO4_T8mZLigZRRXN4dl4bZK2rtAqmfQxJejr9tlMJ6EED7ImtQdQWxAdThy3pFJz4gRhdO6GY93MrVxuI4QPVGMFCnWGtvoh8htUjq7rMrdekvz7EeiWhjL3sWxUqOE2t8uk2ErQAJyssoyOZjIWVoxgAQbRY3nphLl5yZ9oq4puoGNjecy129sq9sXwtHe6a_mx79paB9pQG5Jzq2P9FbGkpVFxbjUKDa1Wjqd0UCtK2GsXIeBoHy9YYim4gjDe75w.EhuyNe9x3jjSZXxZP4-oyA";
// // Replace your accessToken assignment with:
// const { accessToken } = await refreshQuickBooksToken();

//       const realmId = process.env.QUICK_REAL;
//       const customerEndpoint = `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}/customer`;
//       const invoiceEndpoint = `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}/invoice`;

//       const checkCustomerExistence = async (user) => {
//         const searchEndpoint = `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}/query?query=SELECT * FROM Customer`;

//         try {
//           const response = await axios.get(searchEndpoint, {
//             headers: {
//               Authorization: `Bearer ${accessToken}`,
//               Accept: "application/json",
//             },
//           });

//           const customers = response.data?.QueryResponse?.Customer || [];

//           // Find matching by phone or email
//           const matchingCustomer = customers.find((customer) => {
//             const phoneMatch =
//               customer?.PrimaryPhone?.FreeformNumber?.replace(/\D/g, "") ===
//               user?.phone?.replace(/\D/g, "");
//             const emailMatch =
//               customer?.PrimaryEmailAddr?.Address?.toLowerCase() ===
//               user?.email?.toLowerCase();

//             return phoneMatch || emailMatch;
//           });

//           if (matchingCustomer) {
//             return {
//               value: matchingCustomer.Id,
//               name: matchingCustomer.DisplayName,
//             };
//           }

//           return null;
//         } catch (error) {
//           console.error("QuickBooks customer search error:", error.response?.data || error.message);
//           throw new Error("Error checking customer existence in QuickBooks");
//         }
//       };

//       const getCustomerRef = async (user) => {
//         try {
//           const customerRef = await checkCustomerExistence(user);
//           console.log(customerRef);
//         } catch (error) {
//           console.error(error.message);
//         }
//       };

// console.log(getCustomerRef(user))

//       try {
//         // 1. Create Customer in QuickBooks
//         const customerData = {
//           DisplayName: user?.storeName || user?.name,
//           PrimaryEmailAddr: { Address: user?.email },
//           PrimaryPhone: { FreeFormNumber: user?.phone },
//           BillAddr: {
//             Line1: billingAddress?.address,
//             City: billingAddress?.city,
//             CountrySubDivisionCode: billingAddress?.state || "GJ",
//             PostalCode: billingAddress?.postalCode,
//             Country: billingAddress?.country || "India",
//           },
//         };

//         const customerRef = await checkCustomerExistence(user);
//         let finalCustomerRef = customerRef;

//         if (!finalCustomerRef) {
//           const customerRes = await axios.post(customerEndpoint, customerData, {
//             headers: {
//               Authorization: `Bearer ${accessToken}`,
//               Accept: "application/json",
//               "Content-Type": "application/json",
//             },
//           });

//           finalCustomerRef = {
//             value: customerRes.data.Customer.Id,
//             name: customerRes.data.Customer.DisplayName,
//           };
//         }

//         // 2. Format Line Items
//         const lineItems = items.map((item) => ({
//           DetailType: "SalesItemLineDetail",
//           Amount: item.unitPrice * item.quantity,
//           Description: item.productName, // Show real product name here

//           SalesItemLineDetail: {
//             ItemRef: {
//               value: "1", // Replace with real item ID
//               name: item.productName || "Product",
//             },
//             Qty: item.quantity,
//           },
//         }));

//         // Add shipping as line item if applicable
//         if (shippinCost > 0) {
//           lineItems.push({
//             DetailType: "SalesItemLineDetail",
//             Amount: shippinCost,
//           Description: "Shipping Charges", // Show real product name here

//             SalesItemLineDetail: {
//               ItemRef: {
//                 value: "2", // Replace with real "Shipping" item ID
//                 name: "Shipping Charges",
//               },
//               Qty: 1,
//             },
//           });
//         }

//         // 3. Create Invoice
//         const invoiceData = {
//           CustomerRef: finalCustomerRef,
//           Line: lineItems,
//           BillAddr: {
//             Line1: billingAddress.address,
//             City: billingAddress.city,
//             Country: billingAddress.country,
//             PostalCode: billingAddress.postalCode,
//           },
//           ShipAddr: {
//             Line1: shippingAddress.address,
//             City: shippingAddress.city,
//             Country: shippingAddress.country,
//             PostalCode: shippingAddress.postalCode,
//           },
//         };

//         const invoiceRes = await axios.post(invoiceEndpoint, invoiceData, {
//           headers: {
//             Authorization: `Bearer ${accessToken}`,
//             Accept: "application/json",
//             "Content-Type": "application/json",
//           },
//         });

//         console.log("Invoice created:", invoiceRes.data.Invoice);

//         return res.status(200).json({
//           success: true,
//           message: "Order and Invoice created successfully",
//           order: newOrder,
//           invoice: invoiceRes.data.Invoice,
//         });
//       } catch (qbError) {
//         console.error("QuickBooks Error:", qbError?.response?.data || qbError.message);
//         return res.status(500).json({
//           success: false,
//           message: "Order created but failed to create invoice in QuickBooks",
//           order: newOrder,
//           error: qbError?.response?.data || qbError.message,
//         });
//       }
//     } catch (err) {
//       console.error("General Error:", err.message);
//       return res.status(500).json({ success: false, message: "Something went wrong", error: err.message });
//     }
//   };
