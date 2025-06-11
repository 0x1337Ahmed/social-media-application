const Post = require('../models/Post');
const Chat = require('../models/Chat');
const User = require('../models/User');
const { ApiError, catchAsync } = require('../middlewares/errorMiddleware');

// @desc    Get trending posts
// @route   GET /api/explore/trending
// @access  Private
const getTrendingPosts = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, timeframe = '24h' } = req.query;

  // Calculate date range based on timeframe
  const dateRange = new Date();
  switch (timeframe) {
    case '24h':
      dateRange.setHours(dateRange.getHours() - 24);
      break;
    case '7d':
      dateRange.setDate(dateRange.getDate() - 7);
      break;
    case '30d':
      dateRange.setDate(dateRange.getDate() - 30);
      break;
    default:
      dateRange.setHours(dateRange.getHours() - 24);
  }

  // Get trending posts based on likes and comments count
  const trendingPosts = await Post.aggregate([
    {
      $match: {
        visibility: 'public',
        createdAt: { $gte: dateRange }
      }
    },
    {
      $addFields: {
        engagementScore: {
          $add: [
            { $size: '$likes' },
            { $multiply: [{ $size: '$comments' }, 2] } // Comments weighted more than likes
          ]
        }
      }
    },
    { $sort: { engagementScore: -1 } },
    { $skip: (page - 1) * limit },
    { $limit: parseInt(limit) }
  ]);

  // Populate necessary fields
  const populatedPosts = await Post.populate(trendingPosts, [
    { path: 'author', select: 'username profilePicture' },
    { path: 'comments.user', select: 'username profilePicture' }
  ]);

  // Transform posts to include like status
  const transformedPosts = populatedPosts.map(post => ({
    ...post,
    isLiked: post.likes.includes(req.user._id)
  }));

  res.json({
    success: true,
    data: transformedPosts
  });
});

// @desc    Get popular public groups
// @route   GET /api/explore/groups
// @access  Private
const getPopularGroups = catchAsync(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  // Get popular public groups based on participant count
  const popularGroups = await Chat.aggregate([
    {
      $match: {
        type: 'group',
        isPublic: true
      }
    },
    {
      $addFields: {
        participantCount: { $size: '$participants' }
      }
    },
    { $sort: { participantCount: -1 } },
    { $skip: (page - 1) * limit },
    { $limit: parseInt(limit) }
  ]);

  // Populate necessary fields
  const populatedGroups = await Chat.populate(popularGroups, [
    { path: 'groupAdmin', select: 'username profilePicture' }
  ]);

  // Add user's membership status
  const groupsWithStatus = populatedGroups.map(group => ({
    ...group,
    isMember: group.participants.includes(req.user._id)
  }));

  res.json({
    success: true,
    data: groupsWithStatus
  });
});

// @desc    Get random public group
// @route   GET /api/explore/surprise
// @access  Private
const getSurpriseGroup = catchAsync(async (req, res) => {
  // Get random public group that user is not part of
  const randomGroup = await Chat.aggregate([
    {
      $match: {
        type: 'group',
        isPublic: true,
        participants: { $ne: req.user._id }
      }
    },
    { $sample: { size: 1 } }
  ]);

  if (!randomGroup.length) {
    throw new ApiError('No available groups found', 404);
  }

  // Populate necessary fields
  const populatedGroup = await Chat.populate(randomGroup[0], [
    { path: 'groupAdmin', select: 'username profilePicture' },
    { path: 'participants', select: 'username profilePicture' }
  ]);

  res.json({
    success: true,
    data: populatedGroup
  });
});

// @desc    Search posts by tags
// @route   GET /api/explore/tags/:tag
// @access  Private
const getPostsByTag = catchAsync(async (req, res) => {
  const { tag } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const posts = await Post.find({
    visibility: 'public',
    tags: tag
  })
    .populate('author', 'username profilePicture')
    .populate({
      path: 'comments.user',
      select: 'username profilePicture'
    })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  // Transform posts to include like status
  const transformedPosts = posts.map(post => post.toClientJSON(req.user._id));

  res.json({
    success: true,
    data: transformedPosts
  });
});

// @desc    Get trending tags
// @route   GET /api/explore/trending-tags
// @access  Private
const getTrendingTags = catchAsync(async (req, res) => {
  const { limit = 10 } = req.query;

  // Get trending tags based on usage in posts from last 7 days
  const dateRange = new Date();
  dateRange.setDate(dateRange.getDate() - 7);

  const trendingTags = await Post.aggregate([
    {
      $match: {
        visibility: 'public',
        createdAt: { $gte: dateRange }
      }
    },
    { $unwind: '$tags' },
    {
      $group: {
        _id: '$tags',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: parseInt(limit) }
  ]);

  res.json({
    success: true,
    data: trendingTags
  });
});

// @desc    Search content (posts, users, tags)
// @route   GET /api/explore/search
// @access  Private
const searchContent = catchAsync(async (req, res) => {
  const { query, type = 'all' } = req.query;
  const results = { posts: [], users: [], tags: [] };

  if (type === 'all' || type === 'posts') {
    results.posts = await Post.find({
      $or: [
        { content: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } }
      ],
      visibility: 'public'
    })
    .populate('author', 'username profilePicture')
    .limit(10);
  }

  if (type === 'all' || type === 'users') {
    results.users = await User.find({
      username: { $regex: query, $options: 'i' }
    })
    .select('username profilePicture bio')
    .limit(10);
  }

  if (type === 'all' || type === 'tags') {
    const tagResults = await Post.aggregate([
      { $unwind: '$tags' },
      { $match: { 'tags': { $regex: query, $options: 'i' } } },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    results.tags = tagResults;
  }

  res.json({
    success: true,
    data: results
  });
});

module.exports = {
  getTrendingPosts,
  getPopularGroups,
  getSurpriseGroup,
  getPostsByTag,
  getTrendingTags,
  searchContent
};
