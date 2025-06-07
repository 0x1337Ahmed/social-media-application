const { ApiError } = require('./errorMiddleware');
const sanitizeHtml = require('sanitize-html');

// HTML sanitization options
const sanitizeOptions = {
  allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
  allowedAttributes: {
    'a': ['href', 'target']
  },
  allowedSchemes: ['http', 'https', 'mailto']
};

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    for (let key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeHtml(req.body[key], sanitizeOptions);
      }
    }
  }
  next();
};

// Validation rules
const validationRules = {
  // User validation rules
  username: (value) => {
    if (!value || typeof value !== 'string') return 'Username is required';
    if (value.length < 3) return 'Username must be at least 3 characters long';
    if (value.length > 30) return 'Username must not exceed 30 characters';
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) return 'Username can only contain letters, numbers, underscores and hyphens';
    return null;
  },

  email: (value) => {
    if (!value || typeof value !== 'string') return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
    return null;
  },

  password: (value) => {
    if (!value || typeof value !== 'string') return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters long';
    if (!/(?=.*[a-z])/.test(value)) return 'Password must contain at least one lowercase letter';
    if (!/(?=.*[A-Z])/.test(value)) return 'Password must contain at least one uppercase letter';
    if (!/(?=.*\d)/.test(value)) return 'Password must contain at least one number';
    if (!/(?=.*[!@#$%^&*])/.test(value)) return 'Password must contain at least one special character';
    return null;
  },

  // Post validation rules
  postContent: (value) => {
    if (!value || typeof value !== 'string') return 'Post content is required';
    if (value.length < 1) return 'Post content cannot be empty';
    if (value.length > 5000) return 'Post content must not exceed 5000 characters';
    return null;
  },

  // Comment validation rules
  commentContent: (value) => {
    if (!value || typeof value !== 'string') return 'Comment content is required';
    if (value.length < 1) return 'Comment content cannot be empty';
    if (value.length > 1000) return 'Comment content must not exceed 1000 characters';
    return null;
  },

  // Chat message validation rules
  messageContent: (value) => {
    if (!value || typeof value !== 'string') return 'Message content is required';
    if (value.length < 1) return 'Message content cannot be empty';
    if (value.length > 2000) return 'Message content must not exceed 2000 characters';
    return null;
  }
};

// Generic validation middleware
const validate = (validations) => {
  return (req, res, next) => {
    const errors = {};

    for (let field in validations) {
      const value = req.body[field];
      const validationRule = validations[field];
      const error = validationRule(value);
      
      if (error) {
        errors[field] = error;
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new ApiError('Validation failed', 400, errors);
    }

    next();
  };
};

// Predefined validation middlewares for common operations
const validateUser = validate({
  username: validationRules.username,
  email: validationRules.email,
  password: validationRules.password
});

const validatePost = validate({
  content: validationRules.postContent
});

const validateComment = validate({
  content: validationRules.commentContent
});

const validateMessage = validate({
  content: validationRules.messageContent
});

// URL validation middleware
const validateUrl = (req, res, next) => {
  const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
  
  if (req.body.url && !urlPattern.test(req.body.url)) {
    throw new ApiError('Invalid URL format', 400);
  }
  
  next();
};

// ObjectId validation middleware
const validateObjectId = (req, res, next) => {
  const objectIdPattern = /^[0-9a-fA-F]{24}$/;
  
  const params = Object.values(req.params);
  const invalidId = params.some(param => !objectIdPattern.test(param));
  
  if (invalidId) {
    throw new ApiError('Invalid ID format', 400);
  }
  
  next();
};

module.exports = {
  sanitizeInput,
  validate,
  validateUser,
  validatePost,
  validateComment,
  validateMessage,
  validateUrl,
  validateObjectId,
  validationRules
};
