const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  guestLogin
} = require('../controllers/authController');

const { protect } = require('../middlewares/authMiddleware');
const { rateLimiters } = require('../middlewares/rateLimitMiddleware');
const { 
  validateUser, 
  sanitizeInput,
  validate,
  validationRules 
} = require('../middlewares/validationMiddleware');

// Public routes with rate limiting and validation
router.post(
  '/register',
  rateLimiters.auth,
  sanitizeInput,
  validateUser,
  register
);

router.post(
  '/login',
  rateLimiters.auth,
  sanitizeInput,
  validate({
    email: validationRules.email,
    password: validationRules.password
  }),
  login
);

router.post(
  '/guest-login',
  rateLimiters.auth,
  guestLogin
);

// Protected routes
router.use(protect); // Apply protection to all routes below

router.post('/logout', logout);

router.get('/me', getMe);

router.put(
  '/me',
  sanitizeInput,
  validate({
    username: validationRules.username,
    email: validationRules.email
  }),
  updateProfile
);

router.put(
  '/change-password',
  rateLimiters.passwordReset,
  sanitizeInput,
  validate({
    currentPassword: validationRules.password,
    newPassword: validationRules.password
  }),
  changePassword
);

module.exports = router;
