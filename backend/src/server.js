const express=require('express');

require('dotenv').config();

const passport=require('passport');

const cookieParser=require('cookie-parser');

const cors=require('cors');

const errorHandler=require('./middleware/error.middleware')

const stationRoutes=require('./routes/station.routes')

const bookingRoutes=require('./routes/booking.routes')

const paymentRoutes=require('./routes/payment.routes')

const mongodb=require('./database/mongodb');

const authRoutes=require('./routes/user.routes');
const adminRoutes=require('./routes/admin.routes');
const { expireBookings } = require("./utils/cronJobs");


setInterval(expireBookings, 60 * 1000);

const app=express();

app.use(express.json());

app.use(cookieParser());

app.use(passport.initialize());

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

mongodb();

app.use('/api/user',authRoutes);

app.use("/api/stations", stationRoutes);

app.use("/api/booking",bookingRoutes);

app.use("/api/payment",paymentRoutes);

app.use("/api/qr", require("./routes/qr.routes"));

app.use("/api/admin", adminRoutes);

app.use(errorHandler);

const PORT=process.env.PORT;
app.listen(PORT,()=>{
    console.log(`Server is listening at ${PORT}`)
})
