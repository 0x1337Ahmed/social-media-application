const express = require('express');
const router = express.Router();
const {
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  removeFriend,
  getFriends
} = require('../controllers/friendController');

const { protect } = require('../middlewares/authMiddleware');
const { rateLimiters } = require('../middlewares/rateLimitMiddleware');
const { 
  sanitizeInput,
  validateObjectId
} = require('../middlewares/validationMiddleware');

// All routes are protected
router.use(protect);

// Apply rate limiting to friend requests
router.use(['/request', '/accept', '/reject', '/cancel', '/remove'], rateLimiters.friendRequests);

// Search users with sanitization
router.get(
  '/search',
  sanitizeInput,
  searchUsers
);

// Friend request operations with ID validation
router.post(
  '/request',
  validateObjectId,
  sendFriendRequest
);

router.post(
  '/accept',
  validateObjectId,
  acceptFriendRequest
);

router.post(
  '/reject',
  validateObjectId,
  rejectFriendRequest
);

router.post(
  '/cancel',
  validateObjectId,
  cancelFriendRequest
);

// Friend management with ID validation
router.post(
  '/remove',
  validateObjectId,
  removeFriend
);

// Get friends list
router.get(
  '/',
  getFriends
);

module.exports = router;
