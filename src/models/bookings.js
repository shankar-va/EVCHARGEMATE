const mongoose=require('mongoose');

const bookingSchema=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user',
        required:true,
    },
    stationId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'chargingStation',
        required:true
    },
    status:{
        type:String,
        enum:['booked','cancelled','completed'],
        required:true,
    },
    paymentStatus:{
        type:String,
        enum:['pending','success','refunded'],
        required:true,
    },
    qrCodeUrl:{
        type:String,
        required:true,
    },
    amount:{
        type:Number,
        required:true
    },

},{timestamps:true});

module.exports=mongoose.model("bookings",bookingSchema);