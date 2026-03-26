const express = require("express");
const authenticate=require('../middleware/auth.middleware');
const authorize=require('../validators/auth.validators');

const router = express.Router();

const { verifyPaymentController } = require("../controllers/payment.controller");

router.post("/verify",authenticate,authorize('user'), verifyPaymentController);

module.exports = router;