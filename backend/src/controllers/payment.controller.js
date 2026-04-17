const Booking = require("../models/bookings");
const chargingStation = require("../models/chargingStation");
const CryptoJS = require("crypto-js");
const crypto = require("crypto");

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

    // ✅ Step 1: Verify Razorpay signature
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

    // ✅ Step 3: Fetch station
    const mongoose = require("mongoose");

let station;

// 🔥 HANDLE BOTH TYPES OF IDs
if (mongoose.Types.ObjectId.isValid(booking.stationId)) {
  station = await chargingStation.findById(booking.stationId);
} else {
  station = await chargingStation.findOne({
    externalStationId: booking.stationId
  });
}

if (!station) {
  return res.status(404).json({
    message: "Station not found"
  });
}

    if (!station) {
      return res.status(404).json({
        message: "Station not found"
      });
    }

    // ✅ Step 4: Prepare QR payload
    const qrData = {
      bookingId: booking._id,
      stationId: booking.stationId,
      timeSlot: booking.timeSlots,
      date: booking.date
    };

    /**
     * 🔥 UNIVERSAL HARDWARE MOCK SUPPORT
     * For OpenChargeMap stations, the DB stores the SHA256 Hash of "EV_MOCK_SECRET".
     * Therefore, station.stationSecret ALREADY perfectly equals the Frontend's CryptoJS.SHA256("EV_MOCK_SECRET")!
     * No double-hashing required!
     */

    const stableSymmetricKey = station.stationSecret; // Already hashed internally!

    // ✅ Step 5: Encrypt QR payload
    const encryptedPayload = CryptoJS.AES.encrypt(
      JSON.stringify(qrData),
      stableSymmetricKey
    ).toString();

    console.log("\n==================================");
    console.log("🔒 ENCRYPTED QR PAYLOAD (USE IN STATION):");
    console.log(encryptedPayload);
    console.log("==================================\n");

    let qrUrl;

    try {
      // ✅ Generate QR image
      const qrImage = await generateQRCode(encryptedPayload);

      // ✅ Upload to Cloudinary
      qrUrl = await uploadQR(qrImage);

      console.log("Cloudinary URL:", qrUrl);

    } catch (err) {
      console.error("⚠️ Cloudinary failed:", err.message);

      // fallback
      qrUrl = await generateQRCode(encryptedPayload);
    }

    // ✅ Step 6: Update booking
    booking.status = "confirmed";         // 🔥 REQUIRED for check-in
    booking.paymentStatus = "success";
    booking.qrCode = qrUrl;
    booking.razorpayPaymentId = razorpay_payment_id;

    await booking.save();

    console.log("BOOKING UPDATED ✅");
    console.log("FINAL QR URL:", booking.qrCode);

    // ✅ Step 7: Response
    res.json({
      success: true,
      message: "Payment verified successfully",
      booking: booking.toObject(),
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