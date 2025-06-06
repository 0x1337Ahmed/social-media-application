const Post = require('../models/Post');
const User = require('../models/User');
const { ApiError, catchAsync } = require('../middlewares/errorMiddleware');

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
const createPost = catchAsync(async (req, res) => {
  const { content, visibility = 'public', tags = [] } = req.body;

  if (!content) {
    throw new ApiError('Post content is required', 400);
  }

  if (content.length > 280) {
    throw new ApiError('Post content cannot exceed 280 characters', 400);
  }

  const post = await Post.create({
    author: req.user._id,
    content,
    visibility,
    tags: tags.slice(0, 5) // Limit to 5 tags
  });

  const populatedPost = await post.populate('author', 'username profilePicture');

  res.status(201).json({
    success: true,
    data: populatedPost
  });
});

// @desc    Get feed posts (posts from user and friends)
// @route   GET /api/posts/feed
// @access  Private
const getFeedPosts = catchAsync(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  // Get user's friends
  const user = await User.findById(req.user._id);
  const friendIds = user.friends;

  // Get posts from user and friends
  const posts = await Post.find({
    $or: [
      { author: { $in: [...friendIds, req.user._id] } },
      { visibility: 'public' }
    ]
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

// @desc    Get user's posts
// @route   GET /api/posts/user/:userId
// @access  Private
const getUserPosts = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  // Check if user exists
  const targetUser = await User.findById(userId);
  if (!targetUser) {
    throw new ApiError('User not found', 404);
  }

  // Get posts based on visibility and friendship status
  const isFriend = req.user.friends.includes(userId);
  const isOwn = req.user._id.toString() === userId;

  const visibilityFilter = isOwn ? {} :
    isFriend ? { visibility: { $in: ['public', 'friends'] } } :
    { visibility: 'public' };

  const posts = await Post.find({
    author: userId,
    ...visibilityFilter
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

// @desc    Like/Unlike a post
// @route   POST /api/posts/:postId/like
// @access  Private
const toggleLike = catchAsync(async (req, res) => {
  const { postId } = req.params;

  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError('Post not found', 404);
  }

  // Check visibility permissions
  if (post.visibility === 'private' && post.author.toString() !== req.user._id.toString()) {
    throw new ApiError('Not authorized to access this post', 403);
  }
  if (post.visibility === 'friends') {
    const author = await User.findById(post.author);
    if (!author.friends.includes(req.user._id)) {
      throw new ApiError('Not authorized to access this post', 403);
    }
  }

  const isLiked = post.likes.includes(req.user._id);
  if (isLiked) {
    post.likes.pull(req.user._id);
  } else {
    post.likes.addToSet(req.user._id);
  }

  await post.save();

  res.json({
    success: true,
    data: {
      liked: !isLiked,
      likeCount: post.likes.length
    }
  });
});

// @desc    Comment on a post
// @route   POST /api/posts/:postId/comments
// @access  Private
const addComment = catchAsync(async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;

  if (!content) {
    throw new ApiError('Comment content is required', 400);
  }

  if (content.length > 280) {
    throw new ApiError('Comment cannot exceed 280 characters', 400);
  }

  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError('Post not found', 404);
  }

  // Check visibility permissions
  if (post.visibility === 'private' && post.author.toString() !== req.user._id.toString()) {
    throw new ApiError('Not authorized to access this post', 403);
  }
  if (post.visibility === 'friends') {
    const author = await User.findById(post.author);
    if (!author.friends.includes(req.user._id)) {
      throw new ApiError('Not authorized to access this post', 403);
    }
  }

  post.comments.push({
    user: req.user._id,
    content
  });

  await post.save();

  const updatedPost = await Post.findById(postId)
    .populate('author', 'username profilePicture')
    .populate({
      path: 'comments.user',
      select: 'username profilePicture'
    });

  res.status(201).json({
    success: true,
    data: updatedPost.toClientJSON(req.user._id)
  });
});

// @desc    Delete a post
// @route   DELETE /api/posts/:postId
// @access  Private
const deletePost = catchAsync(async (req, res) => {
  const { postId } = req.params;

  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError('Post not found', 404);
  }

  // Check ownership
  if (post.author.toString() !== req.user._id.toString()) {
    throw new ApiError('Not authorized to delete this post', 403);
  }

  await post.remove();

  res.json({
    success: true,
    message: 'Post deleted successfully'
  });
});

// @desc    Update a post
// @route   PUT /api/posts/:postId
// @access  Private
const updatePost = catchAsync(async (req, res) => {
  const { postId } = req.params;
  const { content, visibility, tags } = req.body;

  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError('Post not found', 404);
  }

  // Check ownership
  if (post.author.toString() !== req.user._id.toString()) {
    throw new ApiError('Not authorized to update this post', 403);
  }

  if (content) {
    if (content.length > 280) {
      throw new ApiError('Post content cannot exceed 280 characters', 400);
    }
    post.content = content;
  }

  if (visibility) {
    post.visibility = visibility;
  }

  if (tags) {
    post.tags = tags.slice(0, 5);
  }

  post.isEdited = true;
  await post.save();

  const updatedPost = await Post.findById(postId)
    .populate('author', 'username profilePicture')
    .populate({
      path: 'comments.user',
      select: 'username profilePicture'
    });

  res.json({
    success: true,
    data: updatedPost.toClientJSON(req.user._id)
  });
});

module.exports = {
  createPost,
  getFeedPosts,
  getUserPosts,
  toggleLike,
  addComment,
  deletePost,
  updatePost
};
