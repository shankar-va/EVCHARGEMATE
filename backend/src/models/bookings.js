const mongoose=require('mongoose');

const bookingSchema=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user',
        required:true,
    },
    stationId:{
        type:String,
        required:true
    },
    status:{
        type:String,
        enum:['booked','confirmed','active','cancelled','completed'],
        required:true,
    },
    paymentStatus:{
        type:String,
        enum:['pending','success','refunded'],
        required:true,
    },
    razorpayOrderId:{
        type:String,
        
    },
    razorpayPaymentId:{
        type:String
    },
    qrCode:{
        type:String,
        default:null
    },
    amount:{
        type:Number,
        required:true
    },
    date: {
        type: String,
        required: true
        },
        timeSlots: {
        type: [String],
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    }

},{timestamps:true});

module.exports=mongoose.model("bookings",bookingSchema);