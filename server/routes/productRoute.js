
const express = require("express");
const { 
  createProductCtrl, 
  getAllProductCtrl, 
  deleteProductCtrl, 
  updateProductCtrl, 
  getSingleProductCtrl, 
  updateProductPrice, 
  bulkDiscountApply,
  getProductsByStore,
  getWeeklyOrdersByProductCtrl,
  updateTotalSellForAllProducts,
  getAllProductsWithHistorySummary,
  addToTrash,
  compareProductSalesWithOrders,
  resetAndRebuildHistoryForSingleProductCtrl

  
   

   
   
} = require("../controllers/productCtrl");
const router = express.Router();

router.post("/create", createProductCtrl)
router.get("/updateQuantity", updateTotalSellForAllProducts)
router.get("/getAll", getAllProductCtrl)
router.get("/getAllSummary", getAllProductsWithHistorySummary)
router.get("/get/:id", getSingleProductCtrl)
router.get("/get-order/:productId", getWeeklyOrdersByProductCtrl)
// router.get("/get-by-store/:storeId", getProductsByStore)
router.delete("/delete/:id", deleteProductCtrl)
router.put("/update/:id", updateProductCtrl)
router.put("/update-price", updateProductPrice)
router.put("/update-bulk-discounts", bulkDiscountApply)
router.post("/trash", addToTrash);
router.get("/com", compareProductSalesWithOrders);
router.get('/reset-history/:productId', resetAndRebuildHistoryForSingleProductCtrl);

module.exports = router
