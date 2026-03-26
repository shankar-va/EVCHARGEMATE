const axios = require("axios");

const getRouteCoordinates = async (source, destination) => {
  try {
    
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
        }
      },{timeout: 10000} 
    );

    const data = response.data;

    if (!data.features || data.features.length === 0) {
      throw new Error("No route found");
    }

    return data.features[0].geometry.coordinates;

  } catch (error) {
    console.error("Route API error:", error.message);
    throw error;
  }
};

module.exports = getRouteCoordinates;