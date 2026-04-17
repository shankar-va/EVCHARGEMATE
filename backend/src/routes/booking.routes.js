const express = require("express");
const {authenticate,authorize}=require('../middleware/auth.middleware');

const router = express.Router();

const { bookAndCreateOrder,cancelBooking,bookings } = require("../controllers/booking.controller");

router.post("/book",authenticate,authorize('user'),bookAndCreateOrder);

router.get("/my-bookings",authenticate,authorize('user'),bookings);

router.patch("/cancel",authenticate,authorize('user'),cancelBooking);

module.exports = router;