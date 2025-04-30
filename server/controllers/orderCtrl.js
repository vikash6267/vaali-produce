const orderModel = require("../models/orderModle");
const mongoose = require("mongoose");
const authModel = require("../models/authModel");  // Ensure the correct path for your Auth model

const createOrderCtrl = async (req, res) => {
    try {
        const { items, 
            status, 
            total, 
            clientId, 
            billingAddress, shippingAddress, shippinCost = 0,
            orderType="Regural"
        
        } = req.body;
      


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
            return `${randomNumber}`;
        };
        const newOrder = new orderModel({
            orderNumber: generateOrderNumber(),
            items,
            store: clientId.value,
            status,
            shippingAddress,
            billingAddress,
            total,
            orderType,
            shippinCost
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


const updateOrderCtrl = async (req, res) => {
    try {
        const { id } = req.params;
        const updateFields = req.body;

        // Ensure the order exists
        const existingOrder = await orderModel.findById(id);
        if (!existingOrder) {
            return res.status(404).json({ success: false, message: "Order not found!" });
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
  console.log(req.body)
    try {
      const updatedOrder = await orderModel.findByIdAndUpdate(
        orderId,
        { palletData },
        { new: true }
      );
  
      if (!updatedOrder) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
          data: null
        });
      }

      res.status(200).json({
        success: true,
        message: 'Pallet info saved successfully',
        data: updatedOrder
      });
    } catch (err) {
      console.error('Failed to save pallet info:', err);
      res.status(500).json({
        success: false,
        message: 'Something went wrong while saving pallet info',
        error: err.message
      });
    }
  };

  const userDetailsWithOrder = async (req, res) => {
    const { userId } = req.params;

    try {
        const result = await authModel.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(userId) }
            },
            {
                $lookup: {
                    from: "orders",
                    localField: "_id",
                    foreignField: "store",
                    as: "orders"
                }
            },
            {
                $addFields: {
                    totalOrders: { $size: "$orders" },
                    totalSpent: {
                        $sum: {
                            $map: {
                                input: "$orders",
                                as: "order",
                                in: "$$order.total"
                            }
                        }
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
                                        0
                                    ]
                                }
                            }
                        }
                    },
                    balanceDue: {
                        $sum: {
                            $map: {
                                input: "$orders",
                                as: "order",
                                in: {
                                    $cond: [
                                        { $ne: ["$$order.paymentStatus", "paid"] },
                                        "$$order.total",
                                        0
                                    ]
                                }
                            }
                        }
                    }
                }
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
                                date: "$createdAt"
                            }
                        }
                    }
                }
            }
        ]);

        if (result.length > 0) {
            return res.status(200).json({
                success: true,
                message: "User details with order summary fetched successfully",
                data: result[0]
            });
        } else {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
    } catch (error) {
        console.error("Error fetching user order details:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching order details",
            error: error.message
        });
    }
};




const updatePaymentDetails = async (req, res) => {
    const { orderId } = req.params;
    const { method, transactionId, notes } = req.body;
  
    try {
      // Check for valid method
      if (!["cash", "creditcard",'cheque'].includes(method)) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment method. Allowed: 'cash' or 'creditcard'"
        });
      }
  
      // Validate based on method
      if (method === "creditcard" && !transactionId) {
        return res.status(400).json({
          success: false,
          message: "Transaction ID is required for credit card payments"
        });
      }
  
      if (method === "cash" && !notes) {
        return res.status(400).json({
          success: false,
          message: "Notes are required for cash payments"
        });
      }
  
      // Prepare paymentDetails object
      const paymentDetails = {
        method,
        ...(method === "creditcard" ? { transactionId } : {}),
        ...(method === "cash" ? { notes } : {}),
        ...(method === "cheque" ? { notes } : {})
      };
  
      const updatedOrder = await orderModel.findByIdAndUpdate(
        orderId,
        { paymentDetails, paymentStatus: "paid" },
        { new: true }
      );
  
      if (!updatedOrder) {
        return res.status(404).json({
          success: false,
          message: "Order not found"
        });
      }
  
      return res.status(200).json({
        success: true,
        message: "Payment details updated successfully",
        data: updatedOrder
      });
  
    } catch (error) {
      console.error("Error updating payment details:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message
      });
    }
  };

  const deleteOrderCtrl = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid order ID" });
        }

        const deletedOrder = await orderModel.findByIdAndDelete(id);

        if (!deletedOrder) {
            return res.status(404).json({ success: false, message: "Order not found" });
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


module.exports = { 
    createOrderCtrl, 
    getAllOrderCtrl, 
    getOrderForStoreCtrl, 
    updateOrderCtrl,
    updatePalletInfo,
    userDetailsWithOrder,
    updatePaymentDetails,
    deleteOrderCtrl
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