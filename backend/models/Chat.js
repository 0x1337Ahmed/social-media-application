const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['private', 'group']
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  groupName: {
    type: String,
    required: function() {
      return this.type === 'group';
    },
    trim: true
  },
  groupDescription: {
    type: String,
    maxlength: [500, 'Group description cannot exceed 500 characters']
  },
  groupAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.type === 'group';
    }
  },
  isPublic: {
    type: Boolean,
    default: false,
    required: function() {
      return this.type === 'group';
    }
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  }
}, {
  timestamps: true
});

// Middleware to ensure private chats have exactly 2 participants
chatSchema.pre('save', function(next) {
  if (this.type === 'private' && this.participants.length !== 2) {
    next(new Error('Private chats must have exactly 2 participants'));
  } else {
    next();
  }
});

// Method to check if a user is a participant
chatSchema.methods.isParticipant = function(userId) {
  return this.participants.some(participant => 
    participant.toString() === userId.toString()
  );
};

// Method to check if a user is an admin (for group chats)
chatSchema.methods.isAdmin = function(userId) {
  return this.type === 'group' && 
    this.groupAdmin.toString() === userId.toString();
};

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
