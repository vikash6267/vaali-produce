const orderModel = require("../models/orderModle");

const createOrderCtrl = async (req, res) => {
    try {
        const { items,  status, total,clientId ,billingAddress,shippingAddress} = req.body;
console.log(req.body)



        if (!items || items.length === 0) {
            return res.status(400).json({ message: "Order items are required" });
        }
      
        if (!status) {
            return res.status(400).json({ message: "Order status is required" });
        }
        if (!total || total <= 0) {
            return res.status(400).json({ message: "Total amount must be greater than zero" });
        }

        const generateOrderNumber = () => {
            const randomNumber = Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit random number
            return `ORD-${randomNumber}`;
          };
        const newOrder = new orderModel({
            orderNumber:generateOrderNumber(),
            items,
            store:clientId.value,
            status,
            shippingAddress,
            billingAddress,
            total,
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
        let query = {};

        console.log(user)
        // Agar user ka role 'store' ya 'member' hai toh uske store ke orders fetch karo
        if (user.role === "store" || user.role === "member") {
            query.store = user.id;
        }

        // Orders fetch karo
        const orders = await orderModel
            .find(query) // Ye ensure karega ki multiple orders aaye
            .populate("store")
            .sort({ createdAt: -1 }) // Latest orders first
            .select("-__v"); // Hide unnecessary fields

        console.log("Total Orders Fetched:", orders.length); // Debugging ke liye

        return res.status(200).json({
            success: true,
            message: orders.length ? "Orders fetched successfully!" : "No orders found!",
            orders,
        });

    } catch (error) {
        console.error("Error fetching orders:", error.message, error.stack); // Detailed error logging
        return res.status(500).json({
            success: false,
            message: "Error fetching orders!",
            error: error.message, // Extra info for debugging
        });
    }
};



const getOrderForStoreCtrl = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await orderModel.findById(id);
        return res.status(200).json({
            success: true,
            order
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: "Error in getting  order API!",
        });
    }
}




module.exports = { createOrderCtrl, getAllOrderCtrl, getOrderForStoreCtrl };
