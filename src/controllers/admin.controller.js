const chargingStation=require('../models/chargingStation')


const createStation=async(req,res)=>{
    const stationDetails=req.body;
    const newStation=await chargingStation.create(stationDetails);
    if(!newStation){
        return res.status(400).json({
            success:false,
            message:`Cannot create new Station`,
            })
    }
    res.status(201).json({
        success:true,
        message:`User created successfully`,
        data:newStation
    })
}
const updateStations=async(req,res)=>{
    const {address}=req.body;
    const update=req.body;
    const stationExist=await chargingStation.findOne({address});
    if(!stationExist){
        return res.status(400).json({
            success:false,
            message:`Cannot update a new Station`,
            })
    }
    const id=stationExist._id;
    const updateStation=await chargingStation.findByIdAndUpdate(id,update);
    if(!updateStation){
         return res.status(400).json({
            success:false,
            message:`Cannot update existing Station`,
            })
    }
    res.status(200).json({
        success:true,
        message:`User updated successfully`,
        data:updateStation
    })
}
const deleteStations=async(req,res)=>{
    const {externalStationId}=req.body;
    
    const stationExist=await chargingStation.findOne({externalStationId});
    if(!stationExist){
        return res.status(400).json({
            success:false,
            message:`Station does not exist`,
            })
    }
    const id=stationExist._id;
    const deleteStation=await chargingStation.findByIdAndDelete(id);
    if(!deleteStation){
         return res.status(400).json({
            success:false,
            message:`Cannot delete existing Station`,
            })
    }
    res.status(200).json({
        success:true,
        message:`Station deleted successfully`,
        data:deleteStation
    })
}
const getStation=async(req,res)=>{
    const id=req.query.id;
    const station=await chargingStation.findById(id);
    if(!station){
        return res.status(400).json({
            success:false,
            message:`Station not found`,
            })
    }
    res.status(200).json({
        success:true,
        message:`Station fetched successfully`,
        data:station
    })
}
module.exports={createStation,updateStations,deleteStations,getStation}