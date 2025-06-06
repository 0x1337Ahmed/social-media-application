import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import TimeAgo from 'react-timeago';

const PostCard = ({ post, onPostUpdated, onPostDeleted }) => {
  const { user } = useAuth();
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);

  const handleLike = async () => {
    if (isLiking) return;
    
    setIsLiking(true);
    try {
      const response = await axios.post(`/posts/${post._id}/like`);
      onPostUpdated({
        ...post,
        likes: post.isLiked 
          ? post.likes.filter(id => id !== user._id)
          : [...post.likes, user._id],
        isLiked: !post.isLiked
      });
    } catch (error) {
      toast.error('Failed to like post');
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const response = await axios.post(`/posts/${post._id}/comments`, {
        content: comment
      });
      onPostUpdated({
        ...post,
        comments: [...post.comments, {
          _id: response.data.data._id,
          content: comment,
          user: {
            _id: user._id,
            username: user.username,
            profilePicture: user.profilePicture
          },
          createdAt: new Date().toISOString()
        }]
      });
      setComment('');
    } catch (error) {
      toast.error('Failed to post comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleEdit = async () => {
    try {
      const response = await axios.put(`/posts/${post._id}`, {
        content: editedContent
      });
      onPostUpdated({
        ...post,
        content: editedContent,
        isEdited: true
      });
      setIsEditing(false);
      toast.success('Post updated successfully');
    } catch (error) {
      toast.error('Failed to update post');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      await axios.delete(`/posts/${post._id}`);
      onPostDeleted(post._id);
      toast.success('Post deleted successfully');
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between">
        <Link 
          to={`/myspace/${post.author._id}`}
          className="flex items-center space-x-3"
        >
          <img
            src={post.author.profilePicture}
            alt={post.author.username}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              {post.author.username}
            </h3>
            <TimeAgo
              date={post.createdAt}
              className="text-sm text-gray-500 dark:text-gray-400"
            />
          </div>
        </Link>

        {/* Post Options */}
        {post.author._id === user._id && (
          <div className="relative">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>

            {showOptions && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setShowOptions(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Edit Post
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Delete Post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Content */}
      <div className="px-4 pb-4">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              rows="3"
              maxLength="280"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
            {post.content}
          </p>
        )}
      </div>

      {/* Post Actions */}
      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center space-x-1 text-sm ${
                post.isLiked
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <svg className="w-5 h-5" fill={post.isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{post.likes.length}</span>
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{post.comments.length}</span>
            </button>
          </div>

          {post.isEdited && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Edited
            </span>
          )}
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          {/* Comment Form */}
          <form onSubmit={handleComment} className="mb-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 input text-sm"
                maxLength="280"
              />
              <button
                type="submit"
                disabled={!comment.trim() || isSubmittingComment}
                className="btn-primary px-4 py-2 text-sm"
              >
                Post
              </button>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-4">
            {post.comments.map((comment) => (
              <div key={comment._id} className="flex space-x-3">
                <img
                  src={comment.user.profilePicture}
                  alt={comment.user.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                    <Link
                      to={`/myspace/${comment.user._id}`}
                      className="font-medium text-gray-900 dark:text-gray-100 hover:underline"
                    >
                      {comment.user.username}
                    </Link>
                    <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">
                      {comment.content}
                    </p>
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <TimeAgo date={comment.createdAt} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;
