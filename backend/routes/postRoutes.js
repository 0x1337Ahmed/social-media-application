const express = require('express');
const router = express.Router();
const {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  addComment,
  deleteComment,
  getUserPosts
} = require('../controllers/postController');

const { protect } = require('../middlewares/authMiddleware');
const { rateLimiters } = require('../middlewares/rateLimitMiddleware');
const { 
  sanitizeInput,
  validatePost,
  validateComment,
  validateObjectId,
  validate,
  validationRules 
} = require('../middlewares/validationMiddleware');

// All routes are protected
router.use(protect);

// Create post with rate limiting and validation
router.post(
  '/',
  rateLimiters.posts,
  sanitizeInput,
  validatePost,
  createPost
);

// Get all posts (feed)
router.get(
  '/',
  getPosts
);

// Get user's posts
router.get(
  '/user/:userId',
  validateObjectId,
  getUserPosts
);

// Single post operations
router.route('/:id')
  .get(
    validateObjectId,
    getPost
  )
  .put(
    validateObjectId,
    sanitizeInput,
    validatePost,
    updatePost
  )
  .delete(
    validateObjectId,
    deletePost
  );

// Like/Unlike operations
router.post(
  '/:id/like',
  validateObjectId,
  likePost
);

router.post(
  '/:id/unlike',
  validateObjectId,
  unlikePost
);

// Comment operations with rate limiting
router.post(
  '/:id/comments',
  validateObjectId,
  rateLimiters.posts,
  sanitizeInput,
  validateComment,
  addComment
);

router.delete(
  '/:postId/comments/:commentId',
  validate({
    postId: validationRules.objectId,
    commentId: validationRules.objectId
  }),
  deleteComment
);

module.exports = router;
