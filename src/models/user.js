    const mongoose=require('mongoose');
    const userSchema=new mongoose.Schema({
        username:{
            type:String,
            unique:true,
            require:true
        },email:{
            type:String,
            unique:true,
            require:true
        },
        password:{
            type:String
        },
        oauthProvider:{
            type:String,
        },vehicleType:{
            type:String,
            enum:['Two-Wheler','Four-wheeler'],
            default:'Four-wheeler'
        },
        walletBalance:{
            type:Number,
            default:0,
        },
        role:{
            type:String,
            enum:['user'],
            default:'user'
        },
        bookings:{
            type:[mongoose.Schema.Types.ObjectId],
            ref:'bookings',
        }
    },{timestamps:true});

    const userModel=mongoose.model("user",userSchema);
    module.exports=userModel;