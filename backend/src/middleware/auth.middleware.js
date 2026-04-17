const jwt = require('jsonwebtoken');

/**
 * AUTHENTICATE USER (JWT VERIFY)
 */
const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // 1. Explicit priority to Bearer Token dynamically injected by frontend
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 2. Fallback to Legacy Cookie locally if Bearer is absent
    if (!token) {
      token = req.cookies?.accessToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please login"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Invalid token"
      });
    }

    req.user = decoded; // { userId, username, role }

    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
      error: error.message
    });
  }
};


/**
 * ROLE-BASED AUTHORIZATION (RBAC)
 */
const authorize = (requiredRole) => {
  return (req, res, next) => {
    // 1. Ensure req.user and role exist
    if (!req.user || !req.user.role) {
      console.log("❌ RBAC Failed: No role found in token");
      return res.status(403).json({ success: false, message: "Access denied: No role" });
    }

    // 2. Clean the strings (Remove hidden spaces and force lowercase)
    const currentUserRole = req.user.role.toString().trim().toLowerCase();
    const targetRole = requiredRole.toString().trim().toLowerCase();

    
    if (currentUserRole === 'admin' || currentUserRole === targetRole) {
      return next();
    }
    // 3. Compare the cleaned strings
    
      return res.status(403).json({
        success: false,
        message: "Access denied"+ `Needs ${targetRole}, but you are ${currentUserRole}` // Temporary for debugging
      });
    

  };
};

module.exports = {
  authenticate,
  authorize
};