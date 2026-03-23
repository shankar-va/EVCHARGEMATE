
const userModel=require('../models/user')
const passport=require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL
  },
  async function(accessToken, refreshToken, profile, cb) {
    try{
        const username=profile.displayName;
        const email=profile.emails?.[0]?.value;
        const userExist=await userModel.findOne({$or:[{username},{email}]});
        if(userExist){
            return cb(null,userExist);

        }
        const newUser =await userModel.create({username,email,
            oauthProvider:"google"
        });
        return cb(null,newUser);
    }catch(error){
        return cb(error,`Cannot Authenticate`)
    }
  }
));

module.exports=passport;