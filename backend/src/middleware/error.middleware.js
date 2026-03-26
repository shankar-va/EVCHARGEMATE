const errorHandler=(err,req,res,next)=>{
    return res.status(401).json({
        success:false,
        message:err.message
    })
}
module.exports=errorHandler;