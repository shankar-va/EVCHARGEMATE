const mongoose=require('mongoose');
require('dotenv').config();
const mongodb=async ()=>{
    try{
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`Database connected successfully`);
    }catch(error){
        console.log(`Error connecting database ${error.message}`);
        process.exit(1);
    }
}
module.exports=mongodb;