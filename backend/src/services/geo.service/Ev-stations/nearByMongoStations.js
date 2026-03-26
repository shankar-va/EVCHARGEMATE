const station = require('../../../models/chargingStation');

const mongoStations = async (latitude, longitude, distance = 5) => {

  try {

    const nearByStations = await station.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [Number(longitude), Number(latitude)]
          },
          distanceField: "distance",
          maxDistance: distance * 1000,
          spherical: true,
          key: "location"
        }
      },
      {
        $limit: 20
      }
    ]);

    return nearByStations;

  } catch (error) {
    console.error(error);
    throw error;
  }

};

module.exports = mongoStations;