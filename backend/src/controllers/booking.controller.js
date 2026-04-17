const { createBooking } = require("../services/booking/booking.service");
const { createOrder } = require("../services/booking/payment.services");
const Booking = require("../models/bookings");

const bookAndCreateOrder = async (req, res) => {
  try {
    const {
      stationId,
      date,
      startTime,
      endTime,
      units
    } = req.body;

    const userId = req.user.userId || req.user._id || req.user.id;

    if (!stationId || !date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    if (!units || units <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid units"
      });
    }

    // 🔥 CREATE BOOKING
    const booking = await createBooking({
      userId,
      stationId,
      date,
      startTime,
      endTime,
      units
    });

    // 🔥 CREATE ORDER
    const order = await createOrder(booking.amount);

    booking.razorpayOrderId = order.id;
    await booking.save();

    res.json({
      success: true,
      booking,
      order
    });

  } catch (err) {
    console.error("BOOKING ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

const bookings = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id || req.user.id;
    
    // Support either schema mapping standard (`user` vs `userId`) gracefully
    const userBookings = await Booking.find({
      $or: [{ user: userId }, { userId: userId }]
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: userBookings
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const userId = String(req.user.userId || req.user._id || req.user.id);

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const bookingOwner = String(booking.userId || booking.user || "");
    if (bookingOwner !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (booking.status === "active" || booking.status === "completed" || booking.status === "cancelled") {
      return res.status(400).json({ message: "Cannot cancel a live charging session, a completed booking, or an already cancelled booking" });
    }

    booking.status = "cancelled";

    if (booking.paymentStatus === "success" || booking.paymentStatus === "paid") {
      booking.paymentStatus = "refunded"; 
    }

    await booking.save();

    res.json({
      success: true,
      message: "Booking cancelled safely",
      booking
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { bookAndCreateOrder , cancelBooking, bookings };