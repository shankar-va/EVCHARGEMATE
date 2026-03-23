const jwt=require('jsonwebtoken');

const authenticate=async(req,res,next)=>{
    try{
        const accessToken=req.cookies?.accessToken;
        if(!accessToken){
            return res.status(401).json({
                success:false,
                message:`failed at Authentication`
            })
        }
        const decode=await jwt.verify(accessToken,process.env.JWT_SECRET);
        if(!decode){
            return res.status(401).json({
                success:false,
                message:`Invalid Token`
            })
        }
        
        req.user=decode;
        next();
    }catch(error){
        res.status(401).json({
            success:false,
            message:`Authentication failed`,
            data:error.message
        })
    }
}
module.exports=authenticate;