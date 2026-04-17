
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
        let username=profile.displayName;
        const email=profile.emails?.[0]?.value;
        const userExist=await userModel.findOne({email});
        if(userExist){
            return cb(null,userExist);
        }

        const usernameTaken = await userModel.findOne({username});
        if(usernameTaken) {
            username = username + Math.floor(1000 + Math.random() * 9000);
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