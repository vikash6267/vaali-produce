const express = require("express");
const router = express.Router();

const {
  createTripCtrl,
  editTripCtrl,
  getAllTripsCtrl,
} = require("../controllers/tripCtrl");

router.post("/create", createTripCtrl);

router.put("/update/:id", editTripCtrl);

router.get("/getAll", getAllTripsCtrl);

module.exports = router;
