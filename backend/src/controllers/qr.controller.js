const Booking = require("../models/bookings");

const verifyQRController = async (req, res) => {
  try {
    const { qrData } = req.body;

    const data = JSON.parse(qrData);

    const booking = await Booking.findById(data.bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Invalid QR" });
    }

    if (booking.paymentStatus !== "paid") {
      return res.status(400).json({ message: "Payment not done" });
    }

    if (booking.stationId !== data.stationId) {
      return res.status(400).json({ message: "Wrong station" });
    }

    const today = new Date().toISOString().split("T")[0];

    if (booking.date !== today) {
      return res.status(400).json({ message: "Invalid date" });
    }

    booking.status = "completed";
    await booking.save();

    res.json({
      success: true,
      message: "Charging allowed"
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { verifyQRController };