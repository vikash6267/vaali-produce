const  PurchaseOrder =  require("../models/purchaseModel");
const Product = require("../models/productModel");

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
        const orders = await PurchaseOrder.find()
            .populate('vendorId')
            .populate('items.productId')
            .sort({ createdAt: -1 }); // 👈 Sorting by most recent

        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error', error });
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