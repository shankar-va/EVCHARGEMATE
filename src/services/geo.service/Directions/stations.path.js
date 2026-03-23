const { getNearbyStations } = require('../Ev-stations/openChargeMap.service');
const getRouteCoordinates = require('./coordinates');

const pathStation = async (source, destination, distance = 25) => {
  try {
    // 1. Get full route coordinates

    const routeCoords = await getRouteCoordinates(source, destination);



    if (!routeCoords || routeCoords.length === 0) {
      throw new Error("No route coordinates found");
    }

    const length = routeCoords.length;

    // 2. Sample coordinates (reduce API calls)
    const sampledPoints = [];

    const step = Math.max(1, Math.floor(length / 15)); // max ~8 points
    for (let i = 0; i < length; i += step) {
      sampledPoints.push(routeCoords[i]);
    }

    // Always include destination
    sampledPoints.push(routeCoords[length - 1]);

    // 3. Fetch stations in parallel
   const batchSize = 5; 
let stationResults = [];



for (let i = 0; i < sampledPoints.length; i += batchSize) {
  const batch = sampledPoints.slice(i, i + batchSize);

  const results = await Promise.all(
    batch.map(([lng, lat]) =>
      getNearbyStations(lat, lng, distance)
        .catch(err => {
          console.log("Failed:", err.message);
          return [];
        })
    )
  );

  stationResults.push(...results);
}
console.log("Total station groups fetched:", stationResults.length);

    // 4. Flatten stations
    let allStations = stationResults.flat();

    // 5. Remove duplicates (using station id OR lat+lng)
    const uniqueMap = new Map();

   for (let station of allStations) {
  const key =
    station.externalStationId ||
    `${station.location.coordinates[0]}-${station.location.coordinates[1]}`;

  if (!uniqueMap.has(key)) {
    uniqueMap.set(key, station);
  }
}

    const uniqueStations = Array.from(uniqueMap.values());

    // 6. Sort stations along route
    const getNearestIndex = (station) => {
      let minDist = Infinity;
      let index = 0;

      for (let i = 0; i < routeCoords.length; i++) {
        const [lng, lat] = routeCoords[i];

        const dist =
          Math.pow(lat - station.latitude, 2) +
          Math.pow(lng - station.longitude, 2);

        if (dist < minDist) {
          minDist = dist;
          index = i;
        }
      }

      return index;
    };

    uniqueStations.forEach((station) => {
      station.routeIndex = getNearestIndex(station);
    });

    uniqueStations.sort((a, b) => a.routeIndex - b.routeIndex);

    // 7. Return final result
    return uniqueStations;

  } catch (error) {
    console.error("pathStation error:", error.message);
    throw error;
  }
};

module.exports = pathStation;