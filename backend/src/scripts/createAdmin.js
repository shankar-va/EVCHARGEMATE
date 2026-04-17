const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("../models/admin");

require("dotenv").config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existing = await Admin.findOne({ email: "admin@ev.com" });

    if (existing) {
      console.log("Admin already exists");
      process.exit();
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);

    const admin = await Admin.create({
      username: "Admin",
      email: "admin@ev.com",
      password: hashedPassword,
      role: "admin"
    });

    console.log("✅ Admin created:", admin.email);
    process.exit();

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

createAdmin();