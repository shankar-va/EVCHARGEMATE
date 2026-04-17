const express = require("express");
const {authenticate,authorize}=require('../middleware/auth.middleware');

const router = express.Router();

const { verifyPaymentController } = require("../controllers/payment.controller");

router.post("/verify",authenticate,authorize('user'), verifyPaymentController);

module.exports = router;