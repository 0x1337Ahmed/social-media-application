const express = require('express');
const router = express.Router();
const {
  accessPrivateChat,
  createGroupChat,
  getChats,
  getChatMessages,
  sendMessage,
  updateGroupChat,
  addToGroup,
  removeFromGroup
} = require('../controllers/chatController');

const { protect } = require('../middlewares/authMiddleware');
const { rateLimiters } = require('../middlewares/rateLimitMiddleware');
const { 
  sanitizeInput,
  validateMessage,
  validateObjectId,
  validate,
  validationRules 
} = require('../middlewares/validationMiddleware');

// All routes are protected
router.use(protect);

// Get all chats
router.get(
  '/',
  getChats
);

// Create or access private chat
router.post(
  '/private',
  sanitizeInput,
  validateObjectId,
  accessPrivateChat
);

// Create group chat
router.post(
  '/group',
  sanitizeInput,
  validate({
    name: (value) => {
      if (!value || typeof value !== 'string') return 'Group name is required';
      if (value.length < 3) return 'Group name must be at least 3 characters long';
      if (value.length > 50) return 'Group name must not exceed 50 characters';
      return null;
    },
    participants: (value) => {
      if (!Array.isArray(value)) return 'Participants must be an array';
      if (value.length === 0) return 'At least one participant is required';
      if (value.some(id => !validationRules.objectId(id))) return 'Invalid participant ID';
      return null;
    }
  }),
  createGroupChat
);

// Chat operations
router.route('/:id')
  .get(
    validateObjectId,
    getChatMessages
  )
  .put(
    validateObjectId,
    sanitizeInput,
    validate({
      name: (value) => {
        if (value && (value.length < 3 || value.length > 50)) {
          return 'Group name must be between 3 and 50 characters';
        }
        return null;
      }
    }),
    updateGroupChat
  );

// Message operations
router.post(
  '/:id/messages',
  validateObjectId,
  rateLimiters.chatMessages,
  sanitizeInput,
  validateMessage,
  sendMessage
);

// Group participant operations
router.post(
  '/:id/participants',
  validateObjectId,
  validate({
    userId: validationRules.objectId
  }),
  addToGroup
);

router.delete(
  '/:chatId/participants/:userId',
  validate({
    chatId: validationRules.objectId,
    userId: validationRules.objectId
  }),
  removeFromGroup
);

module.exports = router;
