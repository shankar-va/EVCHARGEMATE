const express = require("express");
const router = express.Router();
const authenticate=require('../middleware/auth.middleware');
const authorize=require('../validators/auth.validators');



const { verifyQRController } = require("../controllers/qr.controller");

router.post("/scan",authenticate,authorize('user'), verifyQRController);

module.exports = router;