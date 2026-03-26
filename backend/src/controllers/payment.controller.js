const Booking = require("../models/bookings");
const { verifyPayment } = require("../services/booking/payment.services");
const { generateQRCode } = require("../services/qr.service.js/genQr");
const { uploadQR } = require("../services/qr.service.js/cloudinary.service");

const verifyPaymentController = async (req, res) => {
  try {
    console.log("FULL BODY:", req.body);

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    console.log("VERIFY ORDER:", razorpay_order_id);

    // ✅ Step 1: Verify signature
    const isValid = verifyPayment({
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      signature: razorpay_signature
    });

    if (!isValid) {
      return res.status(400).json({
        message: "Invalid signature"
      });
    }

    // ✅ Step 2: Find booking
    const booking = await Booking.findOne({
      razorpayOrderId: razorpay_order_id
    });

    console.log("BOOKING FOUND:", booking);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found"
      });
    }

    // ✅ Step 3: Generate QR + Upload (SAFE WAY)
    const qrData = {
      bookingId: booking._id,
      stationId: booking.stationId,
      timeSlot: booking.timeSlots,
      date: booking.date
    };

    let qrUrl;

    try {
      // 1️⃣ Generate QR
      const qrImage = await generateQRCode(qrData);

      // 2️⃣ Upload to Cloudinary
      qrUrl = await uploadQR(qrImage);

      console.log("Cloudinary URL:", qrUrl);

    } catch (err) {
      console.error("⚠️ Cloudinary failed:", err.message);

      // ✅ fallback (important)
      qrUrl = await generateQRCode(qrData);
    }

    // ✅ Step 4: Update booking
    booking.paymentStatus = "success";
    booking.qrCode = qrUrl;
    booking.razorpayPaymentId = razorpay_payment_id;

    await booking.save();

    console.log("BOOKING UPDATED ✅");
    console.log("FINAL BOOKING SENT:", booking.qrCode);

    // ✅ Step 5: Response
    res.json({
      success: true,
      message: "Payment verified successfully",
      booking:booking.toObject(),
       qrCode: booking.qrCode
    });

  } catch (err) {
    console.error("❌ VERIFY ERROR:", err);

    res.status(500).json({
      message: err.message
    });
  }
};

module.exports = { verifyPaymentController };