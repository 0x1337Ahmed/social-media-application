const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const { ApiError, catchAsync } = require('../middlewares/errorMiddleware');

// @desc    Create or get one-to-one chat
// @route   POST /api/chats/private
// @access  Private
const accessPrivateChat = catchAsync(async (req, res) => {
  const { userId } = req.body;

  if (userId === req.user._id.toString()) {
    throw new ApiError('Cannot create chat with yourself', 400);
  }

  // Find existing chat
  let chat = await Chat.findOne({
    type: 'private',
    participants: { 
      $all: [req.user._id, userId],
      $size: 2
    }
  }).populate('participants', 'username profilePicture isOnline');

  if (chat) {
    return res.json({
      success: true,
      data: chat
    });
  }

  // Create new chat if doesn't exist
  chat = await Chat.create({
    type: 'private',
    participants: [req.user._id, userId]
  });

  chat = await chat.populate('participants', 'username profilePicture isOnline');

  res.status(201).json({
    success: true,
    data: chat
  });
});

// @desc    Create group chat
// @route   POST /api/chats/group
// @access  Private
const createGroupChat = catchAsync(async (req, res) => {
  const { name, description, participants, isPublic = false } = req.body;

  if (!name) {
    throw new ApiError('Please provide a group name', 400);
  }

  // Create group chat
  const chat = await Chat.create({
    type: 'group',
    groupName: name,
    groupDescription: description,
    participants: [...participants, req.user._id],
    groupAdmin: req.user._id,
    isPublic
  });

  const populatedChat = await chat.populate([
    { path: 'participants', select: 'username profilePicture isOnline' },
    { path: 'groupAdmin', select: 'username profilePicture' }
  ]);

  // Create system message for group creation
  await Message.create({
    chat: chat._id,
    sender: req.user._id,
    content: `${req.user.username} created the group`,
    type: 'system'
  });

  res.status(201).json({
    success: true,
    data: populatedChat
  });
});

// @desc    Get user's chats
// @route   GET /api/chats
// @access  Private
const getChats = catchAsync(async (req, res) => {
  const chats = await Chat.find({
    participants: req.user._id
  })
  .populate('participants', 'username profilePicture isOnline')
  .populate('groupAdmin', 'username profilePicture')
  .populate('lastMessage')
  .sort({ updatedAt: -1 });

  res.json({
    success: true,
    data: chats
  });
});

// @desc    Get chat messages
// @route   GET /api/chats/:chatId/messages
// @access  Private
const getChatMessages = catchAsync(async (req, res) => {
  const { chatId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new ApiError('Chat not found', 404);
  }

  // Check if user is participant
  if (!chat.isParticipant(req.user._id)) {
    throw new ApiError('Not authorized to access this chat', 403);
  }

  const messages = await Message.find({ chat: chatId })
    .populate('sender', 'username profilePicture')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  // Mark messages as read
  await Message.updateMany(
    {
      chat: chatId,
      sender: { $ne: req.user._id },
      readBy: { $ne: req.user._id }
    },
    { $addToSet: { readBy: req.user._id } }
  );

  res.json({
    success: true,
    data: messages.reverse()
  });
});

// @desc    Send message
// @route   POST /api/chats/:chatId/messages
// @access  Private
const sendMessage = catchAsync(async (req, res) => {
  const { chatId } = req.params;
  const { content, replyTo } = req.body;

  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new ApiError('Chat not found', 404);
  }

  // Check if user is participant
  if (!chat.isParticipant(req.user._id)) {
    throw new ApiError('Not authorized to send message in this chat', 403);
  }

  const message = await Message.create({
    chat: chatId,
    sender: req.user._id,
    content,
    replyTo,
    readBy: [req.user._id]
  });

  const populatedMessage = await message.populate('sender', 'username profilePicture');

  res.status(201).json({
    success: true,
    data: populatedMessage
  });
});

// @desc    Update group chat
// @route   PUT /api/chats/:chatId
// @access  Private
const updateGroupChat = catchAsync(async (req, res) => {
  const { chatId } = req.params;
  const { name, description, isPublic } = req.body;

  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new ApiError('Chat not found', 404);
  }

  if (chat.type !== 'group') {
    throw new ApiError('This operation is only allowed for group chats', 400);
  }

  // Check if user is admin
  if (!chat.isAdmin(req.user._id)) {
    throw new ApiError('Only admin can update group settings', 403);
  }

  chat.groupName = name || chat.groupName;
  chat.groupDescription = description || chat.groupDescription;
  chat.isPublic = isPublic !== undefined ? isPublic : chat.isPublic;

  await chat.save();

  const updatedChat = await chat.populate([
    { path: 'participants', select: 'username profilePicture isOnline' },
    { path: 'groupAdmin', select: 'username profilePicture' }
  ]);

  res.json({
    success: true,
    data: updatedChat
  });
});

// @desc    Add user to group
// @route   POST /api/chats/:chatId/participants
// @access  Private
const addToGroup = catchAsync(async (req, res) => {
  const { chatId } = req.params;
  const { userId } = req.body;

  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new ApiError('Chat not found', 404);
  }

  if (chat.type !== 'group') {
    throw new ApiError('This operation is only allowed for group chats', 400);
  }

  // Check if user is admin
  if (!chat.isAdmin(req.user._id)) {
    throw new ApiError('Only admin can add participants', 403);
  }

  // Add participant
  chat.participants.addToSet(userId);
  await chat.save();

  // Create system message
  const user = await User.findById(userId).select('username');
  await Message.create({
    chat: chatId,
    sender: req.user._id,
    content: `${user.username} was added to the group`,
    type: 'system'
  });

  const updatedChat = await chat.populate([
    { path: 'participants', select: 'username profilePicture isOnline' },
    { path: 'groupAdmin', select: 'username profilePicture' }
  ]);

  res.json({
    success: true,
    data: updatedChat
  });
});

// @desc    Remove user from group
// @route   DELETE /api/chats/:chatId/participants/:userId
// @access  Private
const removeFromGroup = catchAsync(async (req, res) => {
  const { chatId, userId } = req.params;

  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new ApiError('Chat not found', 404);
  }

  if (chat.type !== 'group') {
    throw new ApiError('This operation is only allowed for group chats', 400);
  }

  // Check if user is admin or removing self
  if (!chat.isAdmin(req.user._id) && req.user._id.toString() !== userId) {
    throw new ApiError('Not authorized to remove participants', 403);
  }

  // Cannot remove admin
  if (chat.groupAdmin.toString() === userId) {
    throw new ApiError('Cannot remove group admin', 400);
  }

  // Remove participant
  chat.participants.pull(userId);
  await chat.save();

  // Create system message
  const user = await User.findById(userId).select('username');
  await Message.create({
    chat: chatId,
    sender: req.user._id,
    content: `${user.username} left the group`,
    type: 'system'
  });

  const updatedChat = await chat.populate([
    { path: 'participants', select: 'username profilePicture isOnline' },
    { path: 'groupAdmin', select: 'username profilePicture' }
  ]);

  res.json({
    success: true,
    data: updatedChat
  });
});

module.exports = {
  accessPrivateChat,
  createGroupChat,
  getChats,
  getChatMessages,
  sendMessage,
  updateGroupChat,
  addToGroup,
  removeFromGroup
};
