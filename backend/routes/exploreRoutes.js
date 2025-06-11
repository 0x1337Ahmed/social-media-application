const express = require('express');
const router = express.Router();
const {
  getTrendingPosts,
  getPopularGroups,
  getSurpriseGroup,
  getPostsByTag,
  getTrendingTags,
  searchContent
} = require('../controllers/exploreController');

const { protect } = require('../middlewares/authMiddleware');
const { rateLimiters } = require('../middlewares/rateLimitMiddleware');
const { 
  sanitizeInput,
  validate,
  validationRules 
} = require('../middlewares/validationMiddleware');

// All routes are protected
router.use(protect);

// Get trending posts
router.get('/trending', getTrendingPosts);

// Get popular public groups
router.get('/groups', getPopularGroups);

// Get random public group (Surprise Me feature)
router.get('/random-group', getSurpriseGroup);

// Get posts by tag
router.get('/tags/:tag', getPostsByTag);

// Get trending tags
router.get('/trending-tags', getTrendingTags);

// Search content with validation and rate limiting
router.get(
  '/search',
  rateLimiters.api,
  sanitizeInput,
  validate({
    query: (value) => {
      if (!value || typeof value !== 'string') return 'Search query is required';
      if (value.length < 2) return 'Search query must be at least 2 characters long';
      if (value.length > 50) return 'Search query must not exceed 50 characters';
      // Allow alphanumeric, spaces, and common special characters
      if (!/^[a-zA-Z0-9\s\-_.,!?@#$%&*()]+$/.test(value)) {
        return 'Search query contains invalid characters';
      }
      return null;
    },
    type: (value) => {
      const validTypes = ['all', 'posts', 'users', 'tags'];
      if (!validTypes.includes(value)) {
        return 'Invalid search type. Must be one of: ' + validTypes.join(', ');
      }
      return null;
    }
  }),
  searchContent
);

module.exports = router;
