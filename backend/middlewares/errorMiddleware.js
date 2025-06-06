// Custom error class for API errors
class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Development error response (detailed)
  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      stack: err.stack,
      error: err
    });
  } 
  // Production error response (less detailed)
  else {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      res.status(err.statusCode).json({
        success: false,
        status: err.status,
        message: err.message
      });
    } 
    // Programming or other unknown error: don't leak error details
    else {
      console.error('ERROR 💥', err);
      res.status(500).json({
        success: false,
        status: 'error',
        message: 'Something went wrong!'
      });
    }
  }
};

// Middleware to handle async errors
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Handle MongoDB duplicate key errors
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const message = `Duplicate ${field}. Please use another value.`;
  return new ApiError(message, 400);
};

// Handle MongoDB validation errors
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new ApiError(message, 400);
};

// Handle JWT errors
const handleJWTError = () =>
  new ApiError('Invalid token. Please log in again.', 401);

const handleJWTExpiredError = () =>
  new ApiError('Your token has expired. Please log in again.', 401);

// Global error handling setup
const setupErrorHandling = (app) => {
  app.use((err, req, res, next) => {
    // MongoDB errors
    if (err.code === 11000) err = handleDuplicateKeyError(err);
    if (err.name === 'ValidationError') err = handleValidationError(err);
    
    // JWT errors
    if (err.name === 'JsonWebTokenError') err = handleJWTError();
    if (err.name === 'TokenExpiredError') err = handleJWTExpiredError();

    errorHandler(err, req, res, next);
  });
};

module.exports = {
  ApiError,
  catchAsync,
  errorHandler,
  setupErrorHandling
};
