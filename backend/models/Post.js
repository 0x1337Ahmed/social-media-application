const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Comment cannot be empty'],
    trim: true,
    maxlength: [280, 'Comment cannot exceed 280 characters']
  }
}, {
  timestamps: true
});

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Post content cannot be empty'],
    trim: true,
    maxlength: [280, 'Post cannot exceed 280 characters']
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [commentSchema],
  isEdited: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  visibility: {
    type: String,
    enum: ['public', 'friends', 'private'],
    default: 'public'
  }
}, {
  timestamps: true
});

// Virtual field for like count
postSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual field for comment count
postSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Method to check if a user has liked the post
postSchema.methods.isLikedBy = function(userId) {
  return this.likes.some(like => 
    like.toString() === userId.toString()
  );
};

// Method to format post for client
postSchema.methods.toClientJSON = function(userId) {
  const obj = this.toObject({ virtuals: true });
  obj.isLiked = this.isLikedBy(userId);
  return obj;
};

// Indexes for efficient querying
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ visibility: 1, createdAt: -1 });
postSchema.index({ tags: 1 });

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
