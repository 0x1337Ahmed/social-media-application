const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ApiError } = require('./errorMiddleware');

// Token blacklist for logged out tokens
const tokenBlacklist = new Set();

// Clean up expired tokens from blacklist every hour
setInterval(() => {
  for (const token of tokenBlacklist) {
    try {
      jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        tokenBlacklist.delete(token);
      }
    }
  }
}, 3600000);

const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies
    else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    // Check if token is blacklisted
    if (tokenBlacklist.has(token)) {
      return res.status(401).json({
        success: false,
        message: 'Token has been invalidated'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check token expiration
      if (Date.now() >= decoded.exp * 1000) {
        return res.status(401).json({
          success: false,
          message: 'Token has expired'
        });
      }

      // Get user from token with essential fields
      const user = await User.findById(decoded.id)
        .select('-password -resetPasswordToken -resetPasswordExpire')
        .lean(); // Use lean() for better performance
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if user is active
      if (user.status === 'inactive') {
        return res.status(403).json({
          success: false,
          message: 'Account has been deactivated'
        });
      }

      // Attach user and token to request object
      req.user = user;
      req.token = token;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: error.name === 'JsonWebTokenError' ? 'Invalid token' : 'Authentication error'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Enhanced socket authentication with token validation
const socketAuth = (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    if (tokenBlacklist.has(token)) {
      return next(new Error('Token has been invalidated'));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check token expiration
    if (Date.now() >= decoded.exp * 1000) {
      return next(new Error('Token has expired'));
    }

    socket.userId = decoded.id;
    next();
  } catch (error) {
    next(new Error(error.name === 'JsonWebTokenError' ? 'Invalid token' : 'Authentication error'));
  }
};

// Role-based access control middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Add token to blacklist (used during logout)
const addToBlacklist = (token) => {
  tokenBlacklist.add(token);
};

module.exports = {
  protect,
  socketAuth,
  authorize,
  addToBlacklist
};
