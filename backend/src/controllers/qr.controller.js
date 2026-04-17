const Booking = require("../models/bookings");
const chargingStation = require("../models/chargingStation");
const crypto = require("crypto");
const mongoose = require("mongoose");

const validateHardwareNode = async (stationId, stationSecret) => {
  if (!stationId || !stationSecret) throw new Error("Hardware authentication credentials missing");
  
  const cleanId = stationId.trim();
  const cleanSecret = stationSecret.trim();

  const hashedIncomingSecret = crypto.createHash("sha256").update(cleanSecret).digest("hex");
  const query = [{ externalStationId: cleanId }];
  if (mongoose.Types.ObjectId.isValid(cleanId)) query.push({ _id: cleanId });

  const station = await chargingStation.findOne({ $or: query, stationSecret: hashedIncomingSecret });
  if (!station) throw new Error("Unauthorized Station Identity. Check ID/Secret.");
  return station;
};

const confirmQR = async (req, res) => {
  try {
    const { stationId, stationSecret, bookingId } = req.body;

    const station = await validateHardwareNode(stationId, stationSecret);
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Invalid QR: Booking not found." });
    }

    // ✅ station validation
    const bookingStation = String(booking.stationId);
    const dbStationId = String(station._id);
    const externalId = String(station.externalStationId);

    if (![dbStationId, externalId].includes(bookingStation)) {
      return res.status(403).json({ message: "Hardware mismatch." });
    }

    // ✅ lifecycle checks
    if (booking.status === "active") {
      return res.status(400).json({ message: "Already active." });
    }

    if (["completed", "cancelled"].includes(booking.status)) {
      return res.status(400).json({ message: "Invalid lifecycle." });
    }

    if (booking.status !== "confirmed") {
      return res.status(400).json({ message: `Status is '${booking.status}'` });
    }

    if (!["success", "paid"].includes(booking.paymentStatus)) {
      return res.status(400).json({ message: "Payment not done." });
    }

    // ✅ date check
    const today = new Date();
    today.setHours(0,0,0,0);

    const bookingDate = new Date(booking.date);

    if (bookingDate < today) {
      return res.status(400).json({ message: "Booking expired." });
    }

    // ✅ success
    booking.status = "active";
    await booking.save();

    res.json({
      success: true,
      message: "Charging started"
    });

  } catch (err) {
    res.status(403).json({ message: err.message });
  }
};

const cancelQR = async (req, res) => {
  try {
    const { stationId, stationSecret, bookingId } = req.body;
    const station = await validateHardwareNode(stationId, stationSecret);
    const booking = await Booking.findById(bookingId);
    
    if (!booking) return res.status(404).json({ message: "Invalid QR: Booking not found in global ledger." });

    const isHardwareValid = String(booking.stationId) === String(station._id) || String(booking.stationId) === String(station.externalStationId);
    if (!isHardwareValid) {
      return res.status(403).json({ message: "Hardware Mismatch: You cannot cancel a booking for a different station." });
    }

    if (booking.status === "active" || booking.status === "completed" || booking.status === "cancelled") {
      return res.status(400).json({ message: `Cannot cancel a booking that is currently ${booking.status}.` });
    }

    booking.status = "cancelled";
    if (booking.paymentStatus === "success" || booking.paymentStatus === "paid") {
      booking.paymentStatus = "refunded"; 
    }
    await booking.save();

    res.json({ success: true, message: "Booking securely cancelled. Time slot freed and refund initiated.", booking });
  } catch (err) {
    res.status(err.message.includes('Hardware') || err.message.includes('Unauthorized') ? 403 : 500).json({ message: err.message });
  }
};

const bootStation = async (req, res) => {
  try {
    const { stationId, stationSecret } = req.body;
    await validateHardwareNode(stationId, stationSecret);
    res.json({ success: true, message: "Node Validated Securely." });
  } catch (err) {
    res.status(403).json({ message: err.message });
  }
};

module.exports = { confirmQR, cancelQR, bootStation };