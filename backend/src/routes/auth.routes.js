const express=require('express');
const jwt=require('jsonwebtoken');
const router=express.Router();
const passport=require('../config/passport');
const {register,login}=require('../controllers/auth.controller');
const authenticate=require('../middleware/auth.middleware');
const authorize=require('../validators/auth.validators')


router.post('/register',register('user'));

router.post('/login',login('user'));

router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile','email'],session:false }));

router.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login',session:false }),
  async function(req, res) {
    try{
        const userId=req.user._id;
        const username=req.user.username;
        const accessToken=await jwt.sign({userId,username},process.env.JWT_SECRET,{expiresIn:'1d'});
        res.cookie("accessToken",accessToken,{
            maxAge:24*1000*60*60,
            sameSite:'strict',
            httpOnly:true
        });
        res.status(200).json({
            success:true,
            message:`User Logged In successfully`,
            data:req.user
        })
    }catch(error){
        return res.status(400).json({
            success:false,
            message:`Cannot authenticate user`,
            error:error.message
        })
    }
  });

router.post('/admin/register',authenticate,authorize('admin'),register('admin'));
router.post('/admin/login',login('admin'))

module.exports=router;