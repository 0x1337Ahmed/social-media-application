const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  removeFriend,
  getFriends
} = require('../controllers/friendController');

// All routes are protected
router.use(protect);

// Search users
router.get('/search', searchUsers);

// Friend requests
router.post('/request', sendFriendRequest);
router.post('/accept', acceptFriendRequest);
router.post('/reject', rejectFriendRequest);
router.post('/cancel', cancelFriendRequest);

// Friend management
router.post('/remove', removeFriend);
router.get('/', getFriends);

module.exports = router;
