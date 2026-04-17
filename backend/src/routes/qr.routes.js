const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const qrLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 30, 
  message: { message: "Hardware rate limit exceeded. Please throttle scan operations." }
});

const { confirmQR, cancelQR, bootStation } = require("../controllers/qr.controller");

// Hardware endpoints rely strictly on stationSecret cryptography, bypassing user JWTs securely.
router.post("/boot", qrLimiter, bootStation);
router.post("/confirm", qrLimiter, confirmQR);
router.post("/cancel", qrLimiter, cancelQR);

module.exports = router;