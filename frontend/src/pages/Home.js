import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import PostCard from '../components/PostCard';
import FriendSuggestions from '../components/FriendSuggestions';
import CreatePost from '../components/CreatePost';

const Home = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Fetch feed posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get(`/posts/feed?page=${page}`);
        const newPosts = response.data.data;
        
        if (page === 1) {
          setPosts(newPosts);
        } else {
          setPosts(prev => [...prev, ...newPosts]);
        }
        
        setHasMore(newPosts.length === 20); // Assuming 20 is the page limit
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [page]);

  // Handle post creation
  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  // Handle infinite scroll
  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target;
    if (scrollHeight - scrollTop === clientHeight && hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Feed */}
        <div className="md:col-span-2 space-y-6">
          {/* Create Post */}
          <CreatePost onPostCreated={handlePostCreated} />

          {/* Posts Feed */}
          <div 
            className="space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]"
            onScroll={handleScroll}
          >
            {loading && page === 1 ? (
              // Loading skeleton
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/6 mt-2" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              posts.map(post => (
                <PostCard 
                  key={post._id} 
                  post={post}
                  onPostUpdated={(updatedPost) => {
                    setPosts(prev => prev.map(p => 
                      p._id === updatedPost._id ? updatedPost : p
                    ));
                  }}
                  onPostDeleted={(postId) => {
                    setPosts(prev => prev.filter(p => p._id !== postId));
                  }}
                />
              ))
            )}
            
            {loading && page > 1 && (
              <div className="flex justify-center p-4">
                <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}

            {!loading && !hasMore && posts.length > 0 && (
              <div className="text-center py-6 text-gray-600 dark:text-gray-400">
                No more posts to show
              </div>
            )}

            {!loading && posts.length === 0 && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No posts yet</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Get started by creating a post or following some friends.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="hidden md:block space-y-6">
          {/* Friend Suggestions */}
          <FriendSuggestions />

          {/* Quick Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Your Activity
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Posts</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  {posts.filter(post => post.author._id === user._id).length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Friends</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  {user.friends?.length || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          <div className="text-sm text-gray-500 dark:text-gray-400 space-x-2">
            <a href="#" className="hover:underline">About</a>
            <span>•</span>
            <a href="#" className="hover:underline">Privacy</a>
            <span>•</span>
            <a href="#" className="hover:underline">Terms</a>
            <p className="mt-2">© 2024 SocialApp. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
