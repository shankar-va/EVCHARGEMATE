const station = require('../../../models/chargingStation');

const mongoStations = async (latitude, longitude, distance = 5) => {

  try {
    const maxDistMeters = Math.max(1, Math.min(distance * 1000, 50000)); // clamp between 1m and 50km

    const nearByStations = await station.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number(longitude), Number(latitude)]
          },
          $maxDistance: maxDistMeters
        }
      }
    }).limit(20);

    return nearByStations;

  } catch (error) {
    console.error(error);
    throw error;
  }

};

module.exports = mongoStations;