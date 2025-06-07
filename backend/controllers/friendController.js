const User = require('../models/User');
const { ApiError, catchAsync } = require('../middlewares/errorMiddleware');

// @desc    Search users by username
// @route   GET /api/friends/search
// @access  Private
const searchUsers = catchAsync(async (req, res) => {
  const { query } = req.query;
  
  const searchQuery = query || '';

  // Search users by username, excluding the current user
  const users = await User.find({
    username: { $regex: searchQuery, $options: 'i' },
    _id: { $ne: req.user._id }
  })
  .select('username profilePicture bio isOnline')
  .limit(10);

  // Add friendship status for each user
  const usersWithStatus = users.map(user => {
    const isFriend = req.user.friends.includes(user._id);
    const requestSent = req.user.friendRequests.sent.includes(user._id);
    const requestReceived = req.user.friendRequests.received.includes(user._id);

    return {
      ...user.toObject(),
      friendshipStatus: isFriend ? 'friend' : 
                       requestSent ? 'request_sent' :
                       requestReceived ? 'request_received' : 'none'
    };
  });

  res.json({
    success: true,
    data: usersWithStatus
  });
});

// @desc    Send friend request
// @route   POST /api/friends/request
// @access  Private
const sendFriendRequest = catchAsync(async (req, res) => {
  const { userId } = req.body;

  // Check if user exists
  const targetUser = await User.findById(userId);
  if (!targetUser) {
    throw new ApiError('User not found', 404);
  }

  // Check if users are already friends
  if (req.user.friends.includes(userId)) {
    throw new ApiError('Users are already friends', 400);
  }

  // Check if request already sent
  if (req.user.friendRequests.sent.includes(userId)) {
    throw new ApiError('Friend request already sent', 400);
  }

  // Check if request already received
  if (req.user.friendRequests.received.includes(userId)) {
    throw new ApiError('User has already sent you a friend request', 400);
  }

  // Update both users
  await Promise.all([
    User.findByIdAndUpdate(req.user._id, {
      $addToSet: { 'friendRequests.sent': userId }
    }),
    User.findByIdAndUpdate(userId, {
      $addToSet: { 'friendRequests.received': req.user._id }
    })
  ]);

  res.json({
    success: true,
    message: 'Friend request sent successfully'
  });
});

// @desc    Accept friend request
// @route   POST /api/friends/accept
// @access  Private
const acceptFriendRequest = catchAsync(async (req, res) => {
  const { userId } = req.body;

  // Check if request exists
  if (!req.user.friendRequests.received.includes(userId)) {
    throw new ApiError('Friend request not found', 404);
  }

  // Update both users
  await Promise.all([
    User.findByIdAndUpdate(req.user._id, {
      $addToSet: { friends: userId },
      $pull: { 'friendRequests.received': userId }
    }),
    User.findByIdAndUpdate(userId, {
      $addToSet: { friends: req.user._id },
      $pull: { 'friendRequests.sent': req.user._id }
    })
  ]);

  res.json({
    success: true,
    message: 'Friend request accepted'
  });
});

// @desc    Reject friend request
// @route   POST /api/friends/reject
// @access  Private
const rejectFriendRequest = catchAsync(async (req, res) => {
  const { userId } = req.body;

  // Update both users
  await Promise.all([
    User.findByIdAndUpdate(req.user._id, {
      $pull: { 'friendRequests.received': userId }
    }),
    User.findByIdAndUpdate(userId, {
      $pull: { 'friendRequests.sent': req.user._id }
    })
  ]);

  res.json({
    success: true,
    message: 'Friend request rejected'
  });
});

// @desc    Cancel sent friend request
// @route   POST /api/friends/cancel
// @access  Private
const cancelFriendRequest = catchAsync(async (req, res) => {
  const { userId } = req.body;

  // Update both users
  await Promise.all([
    User.findByIdAndUpdate(req.user._id, {
      $pull: { 'friendRequests.sent': userId }
    }),
    User.findByIdAndUpdate(userId, {
      $pull: { 'friendRequests.received': req.user._id }
    })
  ]);

  res.json({
    success: true,
    message: 'Friend request cancelled'
  });
});

// @desc    Remove friend
// @route   POST /api/friends/remove
// @access  Private
const removeFriend = catchAsync(async (req, res) => {
  const { userId } = req.body;

  // Update both users
  await Promise.all([
    User.findByIdAndUpdate(req.user._id, {
      $pull: { friends: userId }
    }),
    User.findByIdAndUpdate(userId, {
      $pull: { friends: req.user._id }
    })
  ]);

  res.json({
    success: true,
    message: 'Friend removed successfully'
  });
});

// @desc    Get friend list
// @route   GET /api/friends
// @access  Private
const getFriends = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('friends', 'username profilePicture bio isOnline')
    .populate('friendRequests.sent', 'username profilePicture')
    .populate('friendRequests.received', 'username profilePicture');

  res.json({
    success: true,
    data: {
      friends: user.friends,
      requests: {
        sent: user.friendRequests.sent,
        received: user.friendRequests.received
      }
    }
  });
});

module.exports = {
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  removeFriend,
  getFriends
};
