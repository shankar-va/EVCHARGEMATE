const jwt=require('jsonwebtoken');

const accessToken=async(userId,username)=>{
    try{
        token=await jwt.sign({userId,username},process.env.JWT_SECRET,{
            expiresIn:'1d'
    })
    return token;
}
    catch(error){
        throw error;
    }

}

module.exports=accessToken