const Task = require('../models/taskModel');
const productModel = require("../models/productModel")
const categoryModel = require("../models/categoryModel")
const Order = require("../models/orderModle");
const Product = require("../models/productModel");
const mongoose = require("mongoose");



const createProductCtrl = async (req, res) => {
    try {
        const {
            name,
            category,
            quantity,
            unit,
            price,
            threshold,
            description,
            enablePromotions,
            palette,
            weightVariation,
            expiryDate,
            batchInfo,
            origin,
            organic,
            storageInstructions,
            boxSize,
            pricePerBox,
            image,
            shippinCost=0,
            
        } = req.body;

      
        if (!name || !category || !quantity || !price) {
            return res.status(400).json({ success: false, message: "All required fields must be filled." });
        }


        const newProduct = new productModel({
            name,
            category,
            quantity,
            unit,
            price,
            threshold,
            description: description || "N/A",
            enablePromotions,
            palette,
            weightVariation,
            expiryDate,
            batchInfo,
            origin,
            organic,
            shippinCost,
            storageInstructions,
            boxSize,
            pricePerBox,
            image: image,
          
        });

        const product = await newProduct.save();

        await categoryModel.findByIdAndUpdate(category, { $push: { products: product._id } });

        res.status(201).json({ success: true, message: "Product created successfully", product });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Error in create product API", error: error.message });
    }
};

const getAllProductCtrl = async (req, res) => {
  try {
    // Step 1: Fetch all products with category
    const products = await productModel.find()
      .populate({
        path: "category",
        select: "categoryName",
      })
      .lean();

    // Step 2: Aggregate total orders for each product
    const orderStats = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId", 
          totalOrder: { $sum: "$items.quantity" }, // or use $sum: 1 for just count
        }
      }
    ]);

    // Step 3: Convert stats to a map for quick access
    const orderMap = {};
    orderStats.forEach(stat => {
      orderMap[stat._id.toString()] = stat.totalOrder;
    });

    // Step 4: Attach totalOrder to each product and format category
    const modifiedProducts = products.map(product => ({
      ...product,
      category: product.category?.categoryName || null,
      totalOrder: orderMap[product._id.toString()] || 0,
    }));


    return res.status(200).json({
      success: true,
      products: modifiedProducts,
    });
  } catch (error) {
    console.error("Product fetch error:", error);
    return res.status(500).json({
      success: false,
      message: "Error in getting products API!",
    });
  }
};

const getWeeklyOrdersByProductCtrl = async (req, res) => {
    try {
      const { productId } = req.params;
  
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ success: false, message: "Invalid Product ID" });
      }
  
      // Fetch product details
      const product = await Product.findById(productId).select("name image").lean();
      if (!product) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }
  
      const today = new Date();
      const currentDay = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  
      // If today is Monday, return empty
      if (currentDay === 1) {
        return res.status(200).json({
          success: true,
          productId,
          productTitle: product.name,
          productImage: product.image || null,
          totalOrdersThisWeek: 0,
          buyers: []
        });
      }
  
      // Calculate start of the week (Monday)
      const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - diffToMonday);
      startOfWeek.setHours(0, 0, 0, 0);
  
      // End date is yesterday (not including today)
      const endDate = new Date(today);
      endDate.setDate(today.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
  
      // Get orders for the product this week (until yesterday)
      const orders = await Order.find({
        createdAt: { $gte: startOfWeek },
        "items.productId": productId,
         orderType: "Regural"
      })
        .populate("store", "storeName ownerName")
        .lean();
  
      let totalQuantity = 0;
      const buyers = [];
  
 orders.forEach(order => {
  const buyerName = order.store?.storeName || order.store?.ownerName || "Unknown";

  order.items.forEach(item => {
    if (item.productId?.toString() === productId && item.quantity > 0) {
      totalQuantity += item.quantity;

      buyers.push({
        name: buyerName,
        quantity: item.quantity,
        orderDate: order.createdAt
      });
    }
  });
});

  
      return res.status(200).json({
        success: true,
        productId,
        productTitle: product.name,
        productImage: product.image || null,
        totalOrdersThisWeek: totalQuantity,
        buyers
      });
  
    } catch (error) {
      console.error("Error in getWeeklyOrdersByProductCtrl:", error);
      return res.status(500).json({
        success: false,
        message: "Server Error",
      });
    }
  };
  




const getSingleProductCtrl = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await productModel.findById(id);
        return res.status(200).json({
            success: true,
            product
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error in getting product API!",
        });
    }
}


const deleteProductCtrl = async (req, res) => {
    try {
        const { id } = req.params;
      
        const existProduct = await productModel.findById(id);
        if (!existProduct) {
            return res.status(400).json({
                success: false,
                message: "Product Not Found",
            });
        }


        await productModel.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Product deleted successfully!",
        });
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: "Error in deleting Product API!",
        });
    }
};


const updateProductCtrl = async (req, res) => {
    try {
        const {
            name,
            category,
            quantity,
            unit,
            price,
            threshold,
            description,
            enablePromotions,
            palette,
            weightVariation,
            expiryDate,
            batchInfo,
            origin,
            organic,
            storageInstructions,
            boxSize,
            pricePerBox,
            image,
            shippinCost,
            totalPurchase
        } = req.body;

        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Product ID is required",
            });
        }

        const product = await productModel.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        product.name = name || product.name;
        product.category = category || product.category;
        product.quantity = quantity || product.quantity;
        product.unit = unit || product.unit;
        product.price = price || product.price;
        product.threshold = threshold || product.threshold;
        product.description = description || product.description;
        product.enablePromotions = enablePromotions ?? product.enablePromotions;
        product.palette = palette || product.palette;
        product.weightVariation = weightVariation || product.weightVariation;
        product.expiryDate = expiryDate || product.expiryDate;
        product.batchInfo = batchInfo || product.batchInfo;
        product.origin = origin || product.origin;
        product.organic = organic ?? product.organic;
        product.storageInstructions = storageInstructions || product.storageInstructions;
        product.boxSize = boxSize || product.boxSize;
        product.pricePerBox = pricePerBox || product.pricePerBox;
        product.image = image;
        product.shippinCost = shippinCost;
        product.totalPurchase = totalPurchase;

        await product.save();

        return res.status(200).json({
            success: true,
            message: "Product Updated Successfully!",
            product,
        });
    } catch (error) {
        console.error("Error updating product:", error);
        return res.status(500).json({
            success: false,
            message: "Error in updating product API!",
        });
    }
};


const updateProductPrice = async (req, res) => {
    try {
        const priceUpdates = req.body; // Expected: { 'id1': price1, 'id2': price2, ... }

       

        const updatePromises = Object.entries(priceUpdates).map(([id, price]) =>
            productModel.findByIdAndUpdate(id, { pricePerBox:price }, { new: true })
        );

        // Wait for all updates to complete
        const updatedProducts = await Promise.all(updatePromises);

        // Filter out null values in case any product wasn't found
        const successfulUpdates = updatedProducts.filter(product => product !== null);

        if (successfulUpdates.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No products found for the given IDs!",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Product prices updated successfully!",
            updatedProducts
        });

    } catch (error) {
        console.error("Error updating product prices:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating product prices!",
        });
    }
};

const bulkDiscountApply = async (req, res) => {
    try {
        const { formData, product } = req.body;

        // 🔹 Validation: Check if formData & product array exist
        if (!Array.isArray(formData) || formData.length === 0) {
            return res.status(400).json({ success: false, message: "No products selected. Please select at least one product." });
        }
        if (!Array.isArray(product) || product.length === 0) {
            return res.status(400).json({ success: false, message: "Invalid discount data. Please provide at least one discount." });
        }

        // 🔹 Extract product IDs
        const productIds = formData.map(item => item._id);

        // 🔹 Update products with bulk discounts
        const updatedProducts = await productModel.updateMany(
            { _id: { $in: productIds } }, // Match multiple products
            {
                $set: {
                    bulkDiscount: product, // Set discount array
                    lastUpdated: new Date()
                }
            }
        );

        // 🔹 Response Handling
        if (updatedProducts.modifiedCount === 0) {
            return res.status(404).json({ success: false, message: "No products updated. Make sure the product IDs are correct." });
        }

        return res.status(200).json({
            success: true,
            message: `Bulk discounts applied successfully to ${updatedProducts.modifiedCount} products.`,
        });

    } catch (error) {
        console.error("Error updating bulk discounts:", error);
        res.status(500).json({ success: false, message: "Internal Server Error. Please try again later." });
    }
}





// ✅ Create Task
exports.createTask = async (req, res) => {
    try {
        const { assignedTo, title, description, dueDate, priority, progress, status } = req.body;

        // 🛑 Validation
        if (!title || title.length < 3) return res.status(400).json({ success: false, message: "Title must be at least 3 characters long." });
        if (!description || description.length < 5) return res.status(400).json({ success: false, message: "Description must be at least 5 characters long." });
        if (!dueDate || isNaN(new Date(dueDate))) return res.status(400).json({ success: false, message: "Invalid due date." });
        if (priority && !["low", "medium", "high", "urgent", ""].includes(priority.toLowerCase())) return res.status(400).json({ success: false, message: "Invalid priority." });

        // ✅ Save to Database
        const task = new Task({ assignedTo, title, description, dueDate, priority, progress, status });
        await task.save();

        res.status(201).json({ success: true, message: "Task created successfully", task });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ✅ Get All Tasks
exports.getAllTasks = async (req, res) => {
    try {
        const tasks = await Task.find().populate("assignedTo").exec();
        res.json({ success: true, tasks });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};



// ✅ Update Task
exports.updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const task = await Task.findById(id);
        if (!task) return res.status(404).json({ success: false, message: "Task not found" });

        // ✅ Update valid fields
        Object.keys(updateData).forEach((key) => {
            if (updateData[key] !== undefined) task[key] = updateData[key];
        });

        await task.save();
        res.json({ success: true, message: "Task updated successfully", task });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


exports.deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const task = await Task.findByIdAndDelete(id);

        if (!task) return res.status(404).json({ success: false, message: "Task not found" });

        res.json({ success: true, message: "Task deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get products for a specific store
exports.getProductsByStore = async (req, res) => {
  try {
    const { storeId } = req.params;
    
    if (!storeId) {
      return res.status(400).json({ success: false, message: "Store ID is required" });
    }
    
    // You would need to implement the logic to get products for a specific store
    // This is just a placeholder implementation
    const products = await Product.find({ store: storeId }).populate('category').exec();
    
    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const updateTotalSellForAllProducts = async (req, res) => {
  try {
    // Step 1: Fetch all regular orders
    const orders = await Order.find({
      orderType: "Regural"
    }).select("items").lean();

    // Step 2: Prepare map to accumulate total quantity per productId
    const productSalesMap = {};

    orders.forEach(order => {
      order.items.forEach(item => {
        const productId = item.productId?.toString();
        const quantity = item.quantity;

        if (!productId || quantity <= 0) return;

        if (!productSalesMap[productId]) {
          productSalesMap[productId] = 0;
        }

        productSalesMap[productId] += quantity;
      });
    });

    // Step 3: Prepare bulk update operations
    const bulkOps = Object.entries(productSalesMap).map(([productId, totalSell]) => ({
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(productId) },
        update: { $set: { totalSell } }
      }
    }));

    // Step 4: Set totalSell = 0 for unsold products
    const allProductIds = await Product.find().distinct("_id");
    const soldProductIds = Object.keys(productSalesMap).map(id => id.toString());

    const unsoldProductIds = allProductIds
      .map(id => id.toString())
      .filter(id => !soldProductIds.includes(id));

    unsoldProductIds.forEach(productId => {
      bulkOps.push({
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(productId) },
          update: { $set: { totalSell: 0 } }
        }
      });
    });

    // Step 5: Perform bulk update
    if (bulkOps.length > 0) {
      await Product.bulkWrite(bulkOps);
    }

    // Step 6: Return updated data
    const updatedProducts = await Product.find().select("name image totalSell").lean();

    return res.status(200).json({
      success: true,
      message: "Total sell updated from orders successfully",
      products: updatedProducts
    });

  } catch (error) {
    console.error("Error updating totalSell from orders:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


module.exports = { 
    createProductCtrl, 
    getAllProductCtrl, 
    getSingleProductCtrl, 
    deleteProductCtrl, 
    updateProductCtrl, 
    updateProductPrice, 
    bulkDiscountApply,
    getWeeklyOrdersByProductCtrl,
    updateTotalSellForAllProducts

};
