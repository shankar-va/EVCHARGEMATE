const mongoose = require("mongoose");
const Booking = require("../../models/bookings");
const ChargingStation = require("../../models/chargingStation");

const UNIT_PRICE = 15; // ₹15 per kWh

const createBooking = async (bookingData) => {
  const { userId, stationId, date, startTime, endTime, units } = bookingData;

  // 1. Calculate amount
  const amount = units * UNIT_PRICE;

  // Resolve True Database ObjectId dynamically seamlessly
  const query = [{ externalStationId: String(stationId) }];
  if (mongoose.Types.ObjectId.isValid(stationId)) {
    query.push({ _id: stationId });
  }

  const station = await ChargingStation.findOne({ $or: query });
  if (!station) {
    throw new Error("Target Station not mapped to Global Ledger correctly.");
  }

  // 2. Insert directly without Mongo Replica Set Transactions
  const booking = new Booking({
    userId: userId,
    stationId: station._id, // 🔥 Forces Pure MongoDB Schema Isolation
    date,
    timeSlots: [`${startTime} - ${endTime}`],
    amount,
    paymentStatus: "pending",
    status: "booked",
    expiresAt: new Date(Date.now() + 10 * 60 * 1000)
  });

  await booking.save();
  return booking;
};

const updateBookingStatus = async (orderId, paymentId, status) => {
  const booking = await Booking.findOne({ razorpayOrderId: orderId });
  
  if (!booking) {
    throw new Error("Booking securely logged but not found locally");
  }

  booking.paymentStatus = status;
  if (status === "Completed") {
    booking.razorpayPaymentId = paymentId;
    
    // Auto-generate QR
    const qrData = JSON.stringify({
      bookingId: booking._id,
      userId: booking.user,
      stationId: booking.station,
      units: booking.units
    });
    booking.qrCode = qrData;
  } else {
    booking.status = "Cancelled";
  }

  await booking.save();
  return booking;
};

module.exports = { createBooking, updateBookingStatus };