const chargingStation = require("../../models/chargingStation");
const crypto = require("crypto");

const saveStationsToDB = async (stations) => {

  for (const station of stations) {

    const existing = await chargingStation.findOne({
      externalStationId: station.externalStationId
    });

    if (!existing) {
      if (!station.stationSecret) {
        // 🔥 UNIVERSAL MOCK SECRET FOR PORTFOLIO TESTING
        // Allows the developer to test external stations universally without manual DB intervention
        const dummyPlainSecret = "EV_MOCK_SECRET";
        station.stationSecret = crypto.createHash('sha256').update(dummyPlainSecret).digest('hex');
      }
      await chargingStation.create(station);
    }

  }

};
module.exports={saveStationsToDB};