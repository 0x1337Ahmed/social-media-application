const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword
} = require('../controllers/authController');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.use(protect); // All routes below this will be protected

router.post('/logout', logout);
router.get('/me', getMe);
router.put('/me', updateProfile);
router.put('/change-password', changePassword);

module.exports = router;
