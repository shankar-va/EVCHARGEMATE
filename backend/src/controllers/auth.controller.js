const generateToken = require('../utils/generateToken')
const bcrypt = require('bcrypt');

const userModel = require('../models/user')
const adminModel = require('../models/admin')

const register = (role) => async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const targetModel = (role !== 'admin' ? userModel : adminModel)
        const userExist = await targetModel.findOne({ $or: [{ username }, { email }] });
        if (userExist) {
            return res.status(401).json({
                success: false,
                message: `${role} Already Exists with same credentials`,
                data: userExist
            })
        }

        const salt = await bcrypt.genSalt(12);

        req.body.password = await bcrypt.hash(password, salt);

        const newUser = await targetModel.create(req.body);
        res.status(201).json({
            success: true,
            message: `${role} created successfully`,
            data: newUser
        })

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: `Cannot register ${role}`,
            data: error.message
        })
    }
}

const login = (role) => async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const targetModel = (role !== 'admin' ? userModel : adminModel)
        const userExist = await targetModel.findOne({ $or: [{ username }, { email }] });
        if (!userExist) {
            return res.status(401).json({
                success: false,
                message: `${role} does not exist`
            })
        }
        const userId = userExist._id;
        const isMatch = await bcrypt.compare(password, userExist.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: `Invalid credentials`,
            })
        }
        const accessToken = await generateToken(userExist._id, userExist.username);

        res.cookie("accessToken", accessToken, {
            maxAge: 1000 * 24 * 60 * 60,
            sameSite: 'strict',
            httpOnly: true
        })

        // Strip out the password
        const userObj = userExist.toObject();
        delete userObj.password;

        res.status(200).json({
            success: true,
            message: `${role} Logged In successfully`,
            data: userObj
        })
    } catch (error) {

        return res.status(400).json({
            success: false,
            message: `Cannot login ${role}`,
            data: error.message
        })
    }
}

const getSession = async (req, res) => {
    try {
        const user = await userModel.findById(req.user.userId).select("-password -__v -createdAt -updatedAt");
        if (!user) {
            return res.status(400).json({ success: false, message: "No active user session" });
        }
        return res.status(200).json({ success: true, data: user });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = {
    register,
    login,
    getSession
}
