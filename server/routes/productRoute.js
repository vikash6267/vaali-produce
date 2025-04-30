
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

  
   

   
   
} = require("../controllers/productCtrl");
const router = express.Router();

router.post("/create", createProductCtrl)
router.get("/getAll", getAllProductCtrl)
router.get("/get/:id", getSingleProductCtrl)
router.get("/get-order/:productId", getWeeklyOrdersByProductCtrl)
// router.get("/get-by-store/:storeId", getProductsByStore)
router.delete("/delete/:id", deleteProductCtrl)
router.put("/update/:id", updateProductCtrl)
router.put("/update-price", updateProductPrice)
router.put("/update-bulk-discounts", bulkDiscountApply)

module.exports = router
