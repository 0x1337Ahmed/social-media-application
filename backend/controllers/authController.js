const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ApiError, catchAsync } = require('../middlewares/errorMiddleware');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = catchAsync(async (req, res) => {
  const { username, email, password } = req.body;
  
  // Special case for admin account creation
  if (username === 'admin') {
    const adminExists = await User.findOne({ username: 'admin' });
    if (adminExists) {
      throw new ApiError('Admin account already exists', 400);
    }
    // Hash the admin password before saving
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@squidexsocial.com',
      password: hashedPassword,
      role: 'admin'
    });
    return res.status(201).json({
      success: true,
      data: {
        _id: adminUser._id,
        username: adminUser.username,
        email: adminUser.email,
        role: adminUser.role,
        profilePicture: adminUser.profilePicture,
        token: generateToken(adminUser._id)
      }
    });
  }

  // Check if user already exists
  const userExists = await User.findOne({ 
    $or: [{ email }, { username }] 
  });

  if (userExists) {
    throw new ApiError('User already exists', 400);
  }

  // Create user
  const user = await User.create({
    username,
    email,
    password
  });

  if (user) {
    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        token: generateToken(user._id)
      }
    });
  } else {
    throw new ApiError('Invalid user data', 400);
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  // Check for user email
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new ApiError('Invalid credentials', 401);
  }

  // Check password
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    throw new ApiError('Invalid credentials', 401);
  }

  // Update online status
  user.isOnline = true;
  await user.save();

  res.json({
    success: true,
    data: {
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      token: generateToken(user._id)
    }
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = catchAsync(async (req, res) => {
  // Update online status
  const user = await User.findById(req.user._id);
  user.isOnline = false;
  await user.save();

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select('-password')
    .populate('friends', 'username profilePicture isOnline');

  res.json({
    success: true,
    data: user
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/me
// @access  Private
const updateProfile = catchAsync(async (req, res) => {
  const { username, email, bio, profilePicture } = req.body;

  const user = await User.findById(req.user._id);

  if (username) user.username = username;
  if (email) user.email = email;
  if (bio) user.bio = bio;
  if (profilePicture) user.profilePicture = profilePicture;

  const updatedUser = await user.save();

  res.json({
    success: true,
    data: {
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      bio: updatedUser.bio,
      profilePicture: updatedUser.profilePicture
    }
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  // Check current password
  const isMatch = await user.matchPassword(currentPassword);

  if (!isMatch) {
    throw new ApiError('Current password is incorrect', 401);
  }

  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password updated successfully'
  });
});

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword
};
