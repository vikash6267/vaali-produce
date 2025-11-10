const Trip = require("../models/tripModel");
const Driver = require("../models/DriverAndTruckModel");
const Order = require("../models/orderModle");

// ======================================
// ✅ Create Trip
// ======================================
const createTripCtrl = async (req, res) => {
  try {
    const {
      route,
      date,
      driver: driverId,
      truck: truckId, // truck _id inside driver.trucks
      orders = [],
      capacity_kg = 0,
      capacity_m3 = 0,
    } = req.body;

    // Validate required fields
    if (!route?.from || !route?.to || !date || !driverId || !truckId) {
      return res.status(400).json({
        success: false,
        message: "Route, date, driver and truck are required",
      });
    }

    // Fetch driver and check truck exists
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ success: false, message: "Driver not found" });
    }

    const truck = driver.trucks.id(truckId);
    if (!truck) {
      return res.status(404).json({ success: false, message: "Truck not found for this driver" });
    }

    // Capacity validation
    if (capacity_kg > truck.capacity_kg) {
      return res.status(400).json({
        success: false,
        message: `Trip weight ${capacity_kg}kg exceeds truck capacity ${truck.capacity_kg}kg`,
      });
    }
    if (capacity_m3 > truck.capacity_m3) {
      return res.status(400).json({
        success: false,
        message: `Trip volume ${capacity_m3}m³ exceeds truck capacity ${truck.capacity_m3}m³`,
      });
    }

    // Create trip
    const newTrip = await Trip.create({
      route,
      date,
      driver: driverId,
      truck: truckId,
      orders,
      capacity_kg,
      capacity_m3,
    });

    res.status(201).json({
      success: true,
      message: "Trip created successfully",
      data: newTrip,
    });
  } catch (error) {
    console.error("CREATE TRIP ERROR:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ======================================
// ✅ Edit Trip
// ======================================
const editTripCtrl = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // If truck or driver changed, validate truck exists in driver
    if (updates.driver || updates.truck) {
      const driver = await Driver.findById(updates.driver || undefined);
      if (!driver) {
        return res.status(404).json({ success: false, message: "Driver not found" });
      }
      const truck = driver.trucks.id(updates.truck);
      if (!truck) {
        return res.status(404).json({ success: false, message: "Truck not found for this driver" });
      }

      // Capacity validation
      if (updates.capacity_kg > truck.capacity_kg) {
        return res.status(400).json({
          success: false,
          message: `Trip weight ${updates.capacity_kg}kg exceeds truck capacity ${truck.capacity_kg}kg`,
        });
      }
      if (updates.capacity_m3 > truck.capacity_m3) {
        return res.status(400).json({
          success: false,
          message: `Trip volume ${updates.capacity_m3}m³ exceeds truck capacity ${truck.capacity_m3}m³`,
        });
      }
    }

    const updatedTrip = await Trip.findByIdAndUpdate(id, updates, { new: true });
    if (!updatedTrip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    res.status(200).json({
      success: true,
      message: "Trip updated successfully",
      data: updatedTrip,
    });
  } catch (error) {
    console.error("EDIT TRIP ERROR:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ======================================
// ✅ Get All Trips
// ======================================
const getAllTripsCtrl = async (req, res) => {
  try {
    const trips = await Trip.find()
      .populate("driver")      // ✅ FULL driver populate
      .populate("orders")      // ✅ full orders
      .lean();

    const updatedTrips = trips.map((trip) => {
      const driver = trip.driver;

      // ✅ Find full truck object from driver's trucks
      let fullTruck = null;
      if (driver?.trucks?.length) {
        fullTruck = driver.trucks.find(
          (t) => t._id.toString() === trip.truck.toString()
        );
      }

      return {
        ...trip,
        driver: driver, // ✅ Full driver object
        selectedTruck: fullTruck || null // ✅ Full truck object
      };
    });

    res.status(200).json({
      success: true,
      data: updatedTrips,
    });
  } catch (error) {
    console.error("GET ALL TRIPS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  createTripCtrl,
  editTripCtrl,
  getAllTripsCtrl,
};
