const express = require("express");
const router = express.Router();
const { auth, } = require("../middleware/auth");
const { createOrderCtrl, getAllOrderCtrl, getOrderForStoreCtrl, updateOrderCtrl, updatePalletInfo, userDetailsWithOrder, updatePaymentDetails, deleteOrderCtrl } = require("../controllers/orderCtrl");

router.post("/create", auth, createOrderCtrl)
router.get("/getAll", auth,  getAllOrderCtrl)
router.get("/get/:id", auth, getOrderForStoreCtrl)
router.delete("/delete/:id", auth, deleteOrderCtrl)
router.put("/update/:id", auth, updateOrderCtrl)
router.put("/update-plate/:orderId", auth, updatePalletInfo)
router.get("/user/:userId",  userDetailsWithOrder)
router.put("/payment-update/:orderId",  updatePaymentDetails)




module.exports = router
