const generateToken = require('../utils/generateToken');
const bcrypt = require('bcrypt');

const userModel = require('../models/user');
const adminModel = require('../models/admin');

/**
 * REGISTER (role-based)
 */
const register = (role) => async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const targetModel = role === 'admin' ? adminModel : userModel;

    const existing = await targetModel.findOne({
      $or: [{ username }, { email }]
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `${role} already exists`
      });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await targetModel.create({
      username,
      email,
      password: hashedPassword,
      role
    });

    const userObj = newUser.toObject();
    delete userObj.password;

    res.status(201).json({
      success: true,
      message: `${role} registered successfully`,
      data: userObj
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Registration failed`,
      error: error.message
    });
  }
};


/**
 * LOGIN (role-based)
 */
const login = (role) => async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const targetModel = role === 'admin' ? adminModel : userModel;

    const user = await targetModel.findOne({
      $or: [{ username }, { email }]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: `${role} not found`
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: `Invalid credentials`
      });
    }

    // 🔥 INCLUDE ROLE IN TOKEN
    const token = generateToken(user._id, user.username, role);

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24
    });

    const userObj = user.toObject();
    delete userObj.password;

    res.status(200).json({
      success: true,
      message: `${role} login successful`,
      data: userObj,
      role
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Login failed`,
      error: error.message
    });
  }
};


/**
 * GET SESSION (ROLE-AWARE)
 */
const getSession = async (req, res) => {
  try {
    const { userId, role } = req.user;

    let user;

    if (role === 'admin') {
      user = await adminModel.findById(userId);
    } else {
      user = await userModel.findById(userId);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Session not found"
      });
    }

    const userObj = user.toObject();
    delete userObj.password;

    res.status(200).json({
      success: true,
      data: userObj,
      role
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


module.exports = {
  register,
  login,
  getSession
};