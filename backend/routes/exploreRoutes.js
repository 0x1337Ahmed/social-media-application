const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  getTrendingPosts,
  getPopularGroups,
  getSurpriseGroup,
  getPostsByTag,
  getTrendingTags
} = require('../controllers/exploreController');

// All routes are protected
router.use(protect);

// Trending content
router.get('/trending', getTrendingPosts);
router.get('/trending-tags', getTrendingTags);

// Groups discovery
router.get('/groups', getPopularGroups);
router.get('/surprise', getSurpriseGroup);

// Tag-based exploration
router.get('/tags/:tag', getPostsByTag);

module.exports = router;
