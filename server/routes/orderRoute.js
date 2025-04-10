const express = require("express");
const router = express.Router();
const { auth, } = require("../middleware/auth");
const { createOrderCtrl, getAllOrderCtrl, getOrderForStoreCtrl, updateOrderCtrl, updatePalletInfo } = require("../controllers/orderCtrl");

router.post("/create", auth, createOrderCtrl)
router.get("/getAll", auth,  getAllOrderCtrl)
router.get("/get/:id", auth, getOrderForStoreCtrl)
router.put("/update/:id", auth, updateOrderCtrl)
router.put("/update-plate/:orderId", auth, updatePalletInfo)




module.exports = router
