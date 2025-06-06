const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message content cannot be empty'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  type: {
    type: String,
    enum: ['text', 'system'],
    default: 'text'
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }
}, {
  timestamps: true
});

// Middleware to update chat's lastMessage
messageSchema.post('save', async function(doc) {
  try {
    await mongoose.model('Chat').findByIdAndUpdate(
      doc.chat,
      { lastMessage: doc._id }
    );
  } catch (error) {
    console.error('Error updating chat lastMessage:', error);
  }
});

// Method to format message for client
messageSchema.methods.toClientJSON = function() {
  const obj = this.toObject();
  return {
    ...obj,
    isRead: this.readBy.length > 0,
    readCount: this.readBy.length
  };
};

// Index for efficient querying
messageSchema.index({ chat: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
