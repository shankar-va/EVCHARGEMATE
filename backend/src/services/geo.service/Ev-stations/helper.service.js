const normalizeStations = (stations) => {

  return stations.map((station) => {

    return {

      stationSource: "openChargeMap",

      externalStationId: station.ID.toString(),

      companyName: station.AddressInfo?.Title || "Unknown Station",

      operator: station.OperatorInfo?.Title || "Unknown Operator",

      location: {
        type: "Point",
        coordinates: [
          station.AddressInfo?.Longitude,
          station.AddressInfo?.Latitude
        ]
      },

      address: station.AddressInfo?.AddressLine1 || "Unknown",

      city: station.AddressInfo?.Town || "Unknown",

      country: station.AddressInfo?.Country?.Title || "Unknown",

      connectors: station.Connections
        ? station.Connections.map((c) => c.ConnectionType?.Title)
        : [],

      powerKW: station.Connections?.[0]?.PowerKW || 0

    };

  });

};

module.exports={normalizeStations};