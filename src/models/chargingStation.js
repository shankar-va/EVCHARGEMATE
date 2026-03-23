const mongoose=require('mongoose');

const chargingStationSchema=new mongoose.Schema({
    stationSource:{
        type:String,
        enum:["admin","openChargeMap"],
        required:true
    },
    externalStationId:{
        type:String,
        required:true
    },

    companyName:{
        type:String,
        required:true
    },
    operator:{
        type:String,
        required:true
    },

    
    location:{
        type: {
            type: String,
            enum:["Point"],
            required:true
            },
        coordinates:{
            type:[Number],
            required:true
        }
    },
    address:{
        type:String,
        required:true,
    },
    city:{
        type:String,
        required:true
    },
    country:{
        type:String,
        required:true
    },

    connectors:{
        type:[String],
        required:true
    },
    powerKW:{
        type:Number,
        required:true
    },

    slotsPerHour:{
        type:Number,
        
    },
    operatingHours:{
        type:Number,
        
    },
    rating:{
        type:Number,
        default:3
    },
    createdByAdmin:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'admin',
        
    },bookings:{
        type:[mongoose.Schema.Types.ObjectId],
        ref:'bookings',
        
    },

},{timestamps:true});
chargingStationSchema.index({location:"2dsphere"});
module.exports=mongoose.model("chargingStation",chargingStationSchema);