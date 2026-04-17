const express = require("express");
const router = express.Router();
const {register,login,getSession}=require('../controllers/auth.controller');
const { createStation, updateStations, deleteStations, getStation, getAllStations, getAllBookings, getAnalytics,createAdmin } = require("../controllers/admin.controller");
const {authenticate,authorize} = require('../middleware/auth.middleware');

// Public Admin Routes
router.post('/register', register('admin'));
router.post('/login', login('admin'));

// Must be Admin to pass route block
router.use(authenticate);
router.use(authorize('admin'));

// Stations
router.post('/stations', createStation);
router.put('/stations/:id', updateStations);
router.delete('/stations/:id', deleteStations);
router.get('/stations', getAllStations);
router.get('/stations/:id', getStation);

// Bookings & Analytics
router.get('/bookings', getAllBookings);
router.get('/analytics', getAnalytics);

module.exports = router;