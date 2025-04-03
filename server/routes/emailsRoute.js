const express = require("express");
const router = express.Router();


const { priceListSend } = require("../controllers/emails");



router.post("/price-list", priceListSend)



module.exports = router
