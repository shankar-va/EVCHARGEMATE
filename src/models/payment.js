const mongoose=require('mongoose');

const paymentSchema=new mongoose.Schema(
    {userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user',
        required:true
    },
    bookingId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'bookings',
        required:true,
    },
    amount:{
        type:Number,
        required:true,
    },
    paymentGateway:{
        type:String,
        required:true
    },
    transactionId:{
        type:String,
        required:true,
    }
},{timestamps:true});

module.exports=mongoose.model("payment",paymentSchema);

