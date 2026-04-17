const express = require("express");
const router = express.Router();

const { searchStations, searchStationById, getStationRoutes } = require("../controllers/station.controller");
const { createStation, updateStations, deleteStations, getStation } = require('../controllers/admin.controller')
const {authenticate,authorize} = require('../middleware/auth.middleware');


router.get("/user/search", authenticate, authorize('user'), searchStations);

router.get('/user/search/', authenticate, authorize('user'), searchStationById);

router.get('/user/search/route', authenticate, authorize('user'), getStationRoutes(20));

router.post('/admin/create', authenticate, authorize('admin'), createStation);

router.put('/admin/update', authenticate, authorize('admin'), updateStations);

router.delete('/admin/delete', authenticate, authorize('admin'), deleteStations);

router.get('/admin/station/:id', authenticate, authorize('admin'), getStation);


module.exports = router;