const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  createPost,
  getFeedPosts,
  getUserPosts,
  toggleLike,
  addComment,
  deletePost,
  updatePost
} = require('../controllers/postController');

// All routes are protected
router.use(protect);

// Post CRUD operations
router.post('/', createPost);
router.get('/feed', getFeedPosts);
router.get('/user/:userId', getUserPosts);
router.delete('/:postId', deletePost);
router.put('/:postId', updatePost);

// Post interactions
router.post('/:postId/like', toggleLike);
router.post('/:postId/comments', addComment);

module.exports = router;
