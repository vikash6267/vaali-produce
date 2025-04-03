const express = require("express");
const router = express.Router();
const { auth, } = require("../middleware/auth");
const { createOrderCtrl, getAllOrderCtrl, getOrderForStoreCtrl } = require("../controllers/orderCtrl");

router.post("/create", auth, createOrderCtrl)
router.get("/getAll", auth,  getAllOrderCtrl)
router.get("/get/:id", auth, getOrderForStoreCtrl)




module.exports = router
