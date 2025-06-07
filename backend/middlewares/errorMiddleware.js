class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error classification helper
const classifyError = (err) => {
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(e => e.message).join(', ');
    return new ApiError(message, 400);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    return new ApiError(message, 400);
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new ApiError(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return new ApiError('Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return new ApiError('Token has expired', 401);
  }

  // Return original error if unclassified
  return err;
};

// Async handler wrapper
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Error logging function
const logError = (err) => {
  console.error('\x1b[31m%s\x1b[0m', '🔥 ERROR 🔥');
  console.error('Timestamp:', new Date().toISOString());
  console.error('Error Name:', err.name);
  console.error('Error Message:', err.message);
  console.error('Error Stack:', err.stack);
  if (err.code) console.error('Error Code:', err.code);
  console.error('-----------------------------------');
};

// Global error handler
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error
  logError(err);

  // Classify and transform error
  const error = classifyError(err);

  // Development error response
  if (process.env.NODE_ENV === 'development') {
    return res.status(error.statusCode).json({
      success: false,
      status: error.status,
      message: error.message,
      stack: error.stack,
      error: error
    });
  }

  // Production error response
  return res.status(error.statusCode).json({
    success: false,
    status: error.status,
    message: error.isOperational ? error.message : 'Something went wrong'
  });
};

// 404 handler
const notFound = (req, res, next) => {
  const error = new ApiError(`Not found - ${req.originalUrl}`, 404);
  next(error);
};

module.exports = {
  ApiError,
  catchAsync,
  errorHandler,
  notFound
};
