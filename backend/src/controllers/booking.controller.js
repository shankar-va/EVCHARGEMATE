const { createBooking } = require("../services/booking/booking.service");
const { createOrder } = require("../services/booking/payment.services");

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

module.exports = { bookAndCreateOrder };