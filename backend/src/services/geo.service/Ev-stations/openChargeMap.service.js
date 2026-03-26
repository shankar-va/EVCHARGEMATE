const axios = require("axios");
require("dotenv").config();
const { normalizeStations } = require("./helper.service");
const { saveStationsToDB } = require("../save.station.todb");
const stationModel=require('../../../models/chargingStation')
const nearByStation=require('./nearByMongoStations');

const OPEN_CHARGE_MAP_URL = process.env.OPEN_CHARGE_MAP_URL;

const fetchStationsFromOCM = async (latitude, longitude, distance = 10) => {
  try {

    const response = await axios.get(OPEN_CHARGE_MAP_URL, {
      params: {
        key: process.env.OPEN_CHARGE_MAP_API,
        latitude: latitude,
        longitude: longitude,
        distance: distance,
        distanceunit: "KM",
        maxresults: 20
      },timeout: 8000
    });

    return response.data;

  } catch (error) {
  console.error("OpenChargeMap error:", error.response?.data || error.message);
  throw new Error("Failed to fetch stations from OpenChargeMap");
}
};
const getNearbyStations = async (latitude, longitude,distance=10) => {

  const station=await nearByStation(latitude,longitude,distance);

  
  if(station.length<=10){
      const apiStations = await fetchStationsFromOCM(latitude, longitude);

      const normalizedStations = normalizeStations(apiStations);

      await saveStationsToDB(normalizedStations);
      return [...station,...normalizedStations];
  }

  return station;

  

};
module.exports = {fetchStationsFromOCM,getNearbyStations};