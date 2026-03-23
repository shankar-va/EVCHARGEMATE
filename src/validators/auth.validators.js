const userModel = require('../models/user');
const adminModel=require('../models/admin');
const authorize = (role) => {
    return async (req, res, next) => {
        try {
            
            const userId = req.user.userId;
            let validate;
            if(role==='admin'){
                 validate=await adminModel.findById(userId);
            }else if(role==='user'){
                 validate = await userModel.findById(userId);

            }

            if (!validate) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid credentials"
                });
            }

            if (validate.role !== role) {
                return res.status(403).json({
                    success: false,
                    message: `Only ${role}s can access this page `
                });
            }

            next();

        } catch (error) {
            return res.status(400).json({
                success: false,
                message: "Authorization failed",
                error: error.message
            });
        }
    };
};

module.exports = authorize;