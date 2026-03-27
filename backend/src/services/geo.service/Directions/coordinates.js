const axios = require("axios");

const getRouteCoordinates = async (source, destination) => {
  try {
    // Attempt 1: OpenRouteService
    const response = await axios.get(
      "https://api.openrouteservice.org/v2/directions/driving-car",
      {
        params: {
          start: source,
          end: destination
        },
        headers: {
          Authorization: process.env.OPEN_ROUTE_SERVICE_API,
          Accept: "application/json, application/geo+json"
        },
        timeout: 10000
      }
    );

    const data = response.data;
    if (data.features && data.features.length > 0) {
      return data.features[0].geometry.coordinates;
    }
    throw new Error("No route found in ORS");
  } catch (error) {
    console.warn("ORS Route API error (likely 404), falling back to OSRM...", error.message);
    
    // Attempt 2: OSRM Fallback (identical to frontend robust setup)
    try {
      const osrmRes = await axios.get(
        `https://router.project-osrm.org/route/v1/driving/${source};${destination}?overview=full&geometries=geojson`,
        { timeout: 10000 }
      );
      
      const osrmData = osrmRes.data;
      if (osrmData && osrmData.routes && osrmData.routes.length > 0) {
        return osrmData.routes[0].geometry.coordinates; // OSRM inherently returns [lng, lat]
      }
      throw new Error("No route found in OSRM");
    } catch (osrmError) {
      console.error("OSRM Fallback also failed:", osrmError.message);
      // Last resort: Just return a straight line spanning the gap so mapping doesn't crash
      const [lng1, lat1] = source.split(',').map(Number);
      const [lng2, lat2] = destination.split(',').map(Number);
      return [
        [lng1, lat1], 
        [lng2, lat2]
      ];
    }
  }
};

module.exports = getRouteCoordinates;