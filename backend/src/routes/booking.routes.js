const express = require("express");
const authenticate=require('../middleware/auth.middleware');
const authorize=require('../validators/auth.validators');

const router = express.Router();

const { bookAndCreateOrder } = require("../controllers/booking.controller");

router.post("/book",authenticate,authorize('user'),bookAndCreateOrder);

module.exports = router;