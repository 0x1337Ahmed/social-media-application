const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
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

// All routes are protected
router.use(protect);

// Chat creation and listing
router.post('/private', accessPrivateChat);
router.post('/group', createGroupChat);
router.get('/', getChats);

// Messages
router.get('/:chatId/messages', getChatMessages);
router.post('/:chatId/messages', sendMessage);

// Group management
router.put('/:chatId', updateGroupChat);
router.post('/:chatId/participants', addToGroup);
router.delete('/:chatId/participants/:userId', removeFromGroup);

module.exports = router;
