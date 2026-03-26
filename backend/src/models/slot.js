const mongoose=require('mongoose');

const slotSchema=new mongoose.Schema({
    stationId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'chargingStation',
        required:true
    },
    date:{
        type:String,
        required:true
    },
    timeslot:{
        type:String,
        required:true
    },
    bookedCount:{
        type:Number,
        default:0
    }
},{timestamps:true})
slotSchema.index({stationId:1,date:1,timeslot:1},{unique:true})
module.exports=mongoose.model('slot',slotSchema)