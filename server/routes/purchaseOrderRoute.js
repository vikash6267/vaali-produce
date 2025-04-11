// purchaseOrderRoute.js
const express = require("express");
const {
  createPurchaseOrder,
  getAllPurchaseOrders,
  getSinglePurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,updateItemQualityStatus
} = require("../controllers/purchaseCtrl");

const router = express.Router();

router.post("/create", createPurchaseOrder);
router.get("/getAll", getAllPurchaseOrders);
router.get("/get/:id", getSinglePurchaseOrder);
router.put("/update/:id", updatePurchaseOrder);
router.delete("/delete/:id", deletePurchaseOrder);
router.put("/update-quality/:purchaseOrderId", updateItemQualityStatus);

module.exports = router;
