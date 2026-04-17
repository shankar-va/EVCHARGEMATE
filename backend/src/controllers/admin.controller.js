const chargingStation = require('../models/chargingStation');
const Booking = require('../models/bookings');
const crypto = require('crypto');

const createAdmin=async (req,res)=>{
    const {username,email,password}=req.body;
    const admin=await Admin.create({username,email,password});
    res.status(201).json({success:true,data:admin});
}
const createStation = async (req, res) => {
    const stationDetails = req.body;
    let rawSecret = stationDetails.stationSecret;
    if (!rawSecret) {
        rawSecret = crypto.randomBytes(8).toString('hex');
    }

    // Secure One-Way Hash
    stationDetails.stationSecret = crypto.createHash('sha256').update(rawSecret).digest('hex');

    const newStation = await chargingStation.create(stationDetails);
    if (!newStation) {
        return res.status(400).json({ success: false, message: `Cannot create new Station` });
    }
    
    res.status(201).json({ 
        success: true, 
        message: `Station created successfully. Store the rawSecret securely.`, 
        data: newStation,
        rawSecret: rawSecret
    });
}

const updateStations = async (req, res) => {
    // Legacy support via ID Params OR Address Body
    const id = req.params.id || req.body.id;
    const update = req.body;
    let updateStation;

    if (id) {
        updateStation = await chargingStation.findByIdAndUpdate(id, update, { new: true });
    } else if (req.body.address) {
        const stationExist = await chargingStation.findOne({ address: req.body.address });
        if (!stationExist) return res.status(400).json({ success: false, message: `Cannot update a new Station` });
        updateStation = await chargingStation.findByIdAndUpdate(stationExist._id, update, { new: true });
    }

    if (!updateStation) return res.status(400).json({ success: false, message: `Cannot update existing Station` });
    res.status(200).json({ success: true, message: `Station updated successfully`, data: updateStation });
}

const deleteStations = async (req, res) => {
    const id = req.params.id;
    const externalStationId = req.body.externalStationId || req.query.externalStationId;
    let deleteStation;

    if (id) {
        deleteStation = await chargingStation.findByIdAndDelete(id);
    } else if (externalStationId) {
        const stationExist = await chargingStation.findOne({ externalStationId });
        if (!stationExist) return res.status(400).json({ success: false, message: `Station does not exist` });
        deleteStation = await chargingStation.findByIdAndDelete(stationExist._id);
    }

    if (!deleteStation) return res.status(400).json({ success: false, message: `Cannot delete existing Station` });
    res.status(200).json({ success: true, message: `Station deleted successfully`, data: deleteStation });
}

const getStation = async (req, res) => {
    const id = req.params.id || req.query.id;
    const station = await chargingStation.findById(id);
    if (!station) return res.status(400).json({ success: false, message: `Station not found` });
    res.status(200).json({ success: true, message: `Station fetched successfully`, data: station });
}

const getAllStations = async (req, res) => {
    const stations = await chargingStation.find({});
    res.status(200).json({ success: true, count: stations.length, data: stations });
}

const getAllBookings = async (req, res) => {
    const bookings = await Booking.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: bookings.length, data: bookings });
}

const getAnalytics = async (req, res) => {
    try {
        // 1. Total Stations Aggregate
        const stationAgg = await chargingStation.aggregate([
            { $count: "totalStations" }
        ]);
        const totalStations = stationAgg.length > 0 ? stationAgg[0].totalStations : 0;

        // 2. Global Bookings & Active Sessions Aggregate
        // Uses $facet to compute both arrays efficiently in a single database pass
        const bookingAgg = await Booking.aggregate([
            {
                $facet: {
                    totalBookings: [{ $count: "count" }],
                    activeSessions: [
                        { $match: { status: "active" } },
                        { $count: "count" }
                    ],
                    revenueInfo: [
                        { $match: { paymentStatus: { $in: ["success", "paid"] } } },
                        { $group: { _id: null, totalRevenue: { $sum: "$amount" } } }
                    ]
                }
            }
        ]);

        const stats = bookingAgg[0];
        const totalBookings = stats.totalBookings.length > 0 ? stats.totalBookings[0].count : 0;
        const activeSessions = stats.activeSessions.length > 0 ? stats.activeSessions[0].count : 0;
        const totalRevenue = stats.revenueInfo.length > 0 ? stats.revenueInfo[0].totalRevenue : 0;

        res.status(200).json({
            success: true,
            data: {
                totalStations,
                totalBookings,
                activeSessions,
                totalRevenue: totalRevenue / 100 // assuming Razorpay stored in paise
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Analytics aggregation failed", error: err.message });
    }
}

module.exports = { createStation, updateStations, deleteStations, getStation, getAllStations, getAllBookings, getAnalytics,createAdmin }