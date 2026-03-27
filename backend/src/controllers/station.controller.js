const { fetchStationsFromOCM, getNearbyStations } = require("../services/geo.service/Ev-stations/openChargeMap.service");
const pagination = require('../utils/pagination');
const pathStation = require('../services/geo.service/Directions/stations.path')
const searchStations = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: `Please provide valid Location details`
      });
    }

    const stations = await getNearbyStations(latitude, longitude);
    const p = pagination(req, stations);
    const resultStations = stations.slice(p.skip, p.skip + p.limit);

    return res.status(200).json({
      success: true,
      page: p.page,
      totalPages: p.totalPages,
      totalStations: p.totalStations,
      data: resultStations
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const searchStationById = async (req, res) => {
  try {
    const externalStationId = req.query.externalStationId;
    const station = await chargingStation.find({ externalStationId });
    if (!station) {
      return res.status(400).json({
        success: false,
        message: `No charging found`
      })
    }
    res.status(200).json({
      success: true,
      message: `Charging station fetched`,
      data: station
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

const getStationRoutes = (radius) => async (req, res) => {
  try {
    const { srclatitude, srclongitude, destlatitude, destlongitude } = req.query;

    // ✅ Check missing values
    if (!srclatitude || !srclongitude || !destlatitude || !destlongitude) {
      console.log("❌ Empty request received");
      return res.status(400).json({
        success: false,
        message: "Missing coordinates",
        data: [srclatitude, srclongitude, destlatitude, destlongitude]
      });
    }

    // ✅ Convert to numbers
    const srclat = parseFloat(srclatitude);
    const srclng = parseFloat(srclongitude);
    const destlat = parseFloat(destlatitude);
    const destlng = parseFloat(destlongitude);

    // ✅ Validate
    if (
      isNaN(srclat) || isNaN(srclng) ||
      isNaN(destlat) || isNaN(destlng) ||
      srclat < -90 || srclat > 90 ||
      srclng < -180 || srclng > 180 ||
      destlat < -90 || destlat > 90 ||
      destlng < -180 || destlng > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates"
      });
    }

    // ✅ Correct format (lng,lat)
    const source = `${srclng},${srclat}`;
    const destination = `${destlng},${destlat}`;
    const searchRadius = req.query.radius ? parseFloat(req.query.radius) : radius;

    const stations = await pathStation(source, destination, searchRadius);

    if (!stations || stations.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No charging stations found"
      });
    }
    const p = pagination(req, stations);
    const resultStations = stations.slice(p.skip, p.skip + p.limit);

    return res.status(200).json({
      success: true,
      message: "Charging stations fetched",
      page: p.page,
      totalPages: p.totalPages,
      totalStations: p.totalStations,
      data: resultStations
    });

  } catch (error) {
    console.error("Controller error:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = { searchStations, searchStationById, getStationRoutes };