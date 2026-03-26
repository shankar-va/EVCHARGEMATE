const mongoose = require("mongoose");
const Slot = require("../../models/slot");
const Booking = require("../../models/bookings");
const ChargingStation = require("../../models/chargingStation");
const generateTimeSlots = require("../../utils/slotGenerator");

const createBooking = async ({
  userId,
  stationId,
  date,
  startTime,
  endTime,
  units // 🔥 NEW (kWh user wants)
}) => {

  const session = await mongoose.startSession();
  session.startTransaction();

  try {

    const station = await ChargingStation.findById(stationId).session(session);
    if (!station) throw new Error("Station not found");

    const timeSlots = generateTimeSlots(startTime, endTime);

    // 🔥 SLOT LOCKING
    for (const slot of timeSlots) {

      const updatedSlot = await Slot.findOneAndUpdate(
        {
          stationId,
          date,
          timeSlot: slot,
          bookedCount: { $lt: station.slotsPerHour }
        },
        {
          $inc: { bookedCount: 1 }
        },
        {
          new: true,
          upsert: true,
          session
        }
      );

      if (!updatedSlot) {
        throw new Error(`Slot ${slot} is full`);
      }
    }

    // 🔥 DUPLICATE CHECK
    const existing = await Booking.findOne({
      userId,
      stationId,
      date,
      timeSlots: { $in: timeSlots },
      status: { $ne: "cancelled" }
    }).session(session);

    if (existing) {
      throw new Error("You already booked these slots");
    }

    // 🔥 REAL PRICE CALCULATION
    const amount = units * station.pricePerUnit;

    const booking = await Booking.create([{
      userId,
      stationId,
      date,
      timeSlots,
      status: "booked",
      paymentStatus: "pending",
      amount,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    }], { session });

    await session.commitTransaction();
    session.endSession();

    return booking[0];

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};


const cancelBooking = async (bookingId) => {

  const session = await mongoose.startSession();
  session.startTransaction();

  try {

    const booking = await Booking.findById(bookingId).session(session);

    if (!booking) throw new Error("Booking not found");

    for (const slot of booking.timeSlots) {
      await Slot.findOneAndUpdate(
        {
          stationId: booking.stationId,
          date: booking.date,
          timeSlot: slot
        },
        {
          $inc: { bookedCount: -1 }
        },
        { session }
      );
    }

    booking.status = "cancelled";
    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

module.exports = { createBooking,cancelBooking };