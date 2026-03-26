const chargingStation = require("../../models/chargingStation");

const saveStationsToDB = async (stations) => {

  for (const station of stations) {

    const existing = await chargingStation.findOne({
      externalStationId: station.externalStationId
    });

    if (!existing) {
      await chargingStation.create(station);
    }

  }

};
module.exports={saveStationsToDB};