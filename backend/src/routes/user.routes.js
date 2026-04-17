const express=require('express');
const jwt=require('jsonwebtoken');
const router=express.Router();
const passport=require('../config/passport');
const {register,login,getSession}=require('../controllers/auth.controller');
const {authenticate,authorize}=require('../middleware/auth.middleware');
const generateToken=require('../utils/generateToken');


router.get('/session', authenticate, getSession);

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
        const accessToken=generateToken(userId, username, 'user');
        res.cookie("accessToken",accessToken,{
            maxAge:24*1000*60*60,
            sameSite:'strict',
            httpOnly:true
        });
        // Success: Redirect straight into the beautiful new client dashboard
        res.redirect('http://localhost:5173/dashboard');
    }catch(error){
        return res.status(400).json({
            success:false,
            message:`Cannot authenticate user`,
            error:error.message
        })
    }
  });



module.exports=router;