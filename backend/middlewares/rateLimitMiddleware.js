const rateLimit = require('express-rate-limit');
const { ApiError } = require('./errorMiddleware');

// Create rate limiters with different configurations
const createRateLimiter = (options) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // Default: 15 minutes
    max: options.max || 100, // Default: 100 requests per windowMs
    message: {
      success: false,
      message: options.message || 'Too many requests, please try again later'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
      throw new ApiError(options.message || 'Too many requests', 429);
    }
  });
};

// Different rate limiters for different purposes
const rateLimiters = {
  // General API rate limiter
  api: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  }),

  // Auth routes rate limiter (login, register, etc.)
  auth: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 requests per hour
    message: 'Too many authentication attempts, please try again after an hour'
  }),

  // Password reset rate limiter
  passwordReset: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 requests per hour
    message: 'Too many password reset attempts, please try again after an hour'
  }),

  // Chat message rate limiter
  chatMessages: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 messages per minute
    message: 'Too many messages sent, please slow down'
  }),

  // Post creation rate limiter
  posts: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 posts per hour
    message: 'Too many posts created, please try again later'
  }),

  // Friend requests rate limiter
  friendRequests: createRateLimiter({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 50, // 50 friend requests per day
    message: 'Too many friend requests sent, please try again tomorrow'
  })
};

// Middleware to detect and block suspicious behavior
const detectSuspiciousActivity = (req, res, next) => {
  // Check for multiple failed login attempts
  if (req.session?.failedLoginAttempts >= 5) {
    throw new ApiError('Account temporarily locked due to multiple failed login attempts', 403);
  }

  // Check for rapid-fire requests
  const requestTimestamp = Date.now();
  const minRequestInterval = 100; // milliseconds

  if (req.session?.lastRequestTime && 
      (requestTimestamp - req.session.lastRequestTime) < minRequestInterval) {
    throw new ApiError('Requests are too frequent', 429);
  }

  req.session.lastRequestTime = requestTimestamp;
  next();
};

module.exports = {
  rateLimiters,
  detectSuspiciousActivity
};
