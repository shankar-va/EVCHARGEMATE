const express=require('express');

require('dotenv').config();

const passport=require('passport');

const cookieParser=require('cookie-parser');

const errorHandler=require('./middleware/error.middleware')

const stationRoutes=require('./routes/station.routes')


const mongodb=require('./database/mongodb');

const authRoutes=require('./routes/auth.routes');

const app=express();

app.use(express.json());

app.use(cookieParser());

app.use(passport.initialize());

mongodb();

app.use('/api/user',authRoutes);

app.use("/api/stations", stationRoutes);


app.use(errorHandler);

const PORT=process.env.PORT;
app.listen(PORT,()=>{
    console.log(`Server is listening at ${PORT}`)
})
