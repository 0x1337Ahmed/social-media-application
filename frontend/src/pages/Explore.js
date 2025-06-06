import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import PostCard from '../components/PostCard';

const Explore = () => {
  const [activeTab, setActiveTab] = useState('trending');
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [popularGroups, setPopularGroups] = useState([]);
  const [trendingTags, setTrendingTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [joiningGroup, setJoiningGroup] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'trending') {
        const [postsRes, tagsRes] = await Promise.all([
          axios.get('/explore/trending'),
          axios.get('/explore/trending-tags')
        ]);
        setTrendingPosts(postsRes.data.data);
        setTrendingTags(tagsRes.data.data);
      } else if (activeTab === 'groups') {
        const response = await axios.get('/explore/groups');
        setPopularGroups(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch explore data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await axios.get(`/friends/search?query=${searchQuery}`);
      setSearchResults(response.data.data);
      setActiveTab('search');
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleJoinGroup = async (groupId) => {
    setJoiningGroup(groupId);
    try {
      await axios.post(`/chats/${groupId}/participants`);
      setPopularGroups(prev =>
        prev.map(group =>
          group._id === groupId ? { ...group, isMember: true } : group
        )
      );
      toast.success('Joined group successfully!');
    } catch (error) {
      toast.error('Failed to join group');
    } finally {
      setJoiningGroup(null);
    }
  };

  const TabButton = ({ id, label, icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
        activeTab === id
          ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="flex space-x-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search users..."
            className="input flex-1"
          />
          <button
            onClick={handleSearch}
            disabled={searching || !searchQuery.trim()}
            className="btn-primary px-6"
          >
            {searching ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Search'
            )}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        <div className="p-2 flex space-x-2">
          <TabButton
            id="trending"
            label="Trending"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
          />
          <TabButton
            id="groups"
            label="Groups"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : activeTab === 'search' ? (
        <div className="space-y-4">
          {searchResults.map(user => (
            <div key={user._id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <Link to={`/myspace/${user._id}`} className="flex items-center space-x-3">
                  <img
                    src={user.profilePicture}
                    alt={user.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {user.username}
                    </h3>
                    {user.bio && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {user.bio}
                      </p>
                    )}
                  </div>
                </Link>
              </div>
            </div>
          ))}
          {searchResults.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">
                No users found matching "{searchQuery}"
              </p>
            </div>
          )}
        </div>
      ) : activeTab === 'trending' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {trendingPosts.map(post => (
              <PostCard
                key={post._id}
                post={post}
                onPostUpdated={updatedPost => {
                  setTrendingPosts(prev =>
                    prev.map(p => (p._id === updatedPost._id ? updatedPost : p))
                  );
                }}
                onPostDeleted={postId => {
                  setTrendingPosts(prev =>
                    prev.filter(p => p._id !== postId)
                  );
                }}
              />
            ))}
          </div>
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Trending Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {trendingTags.map(tag => (
                  <Link
                    key={tag._id}
                    to={`/explore/tags/${tag._id}`}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    #{tag._id}
                    <span className="ml-1 text-gray-500 dark:text-gray-400">
                      {tag.count}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {popularGroups.map(group => (
            <div key={group._id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src="https://www.gravatar.com/avatar/?d=identicon"
                    alt={group.groupName}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {group.groupName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {group.participantCount} members
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleJoinGroup(group._id)}
                  disabled={group.isMember || joiningGroup === group._id}
                  className={`btn ${
                    group.isMember
                      ? 'btn-secondary'
                      : 'btn-primary'
                  }`}
                >
                  {joiningGroup === group._id ? (
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : group.isMember ? (
                    'Joined'
                  ) : (
                    'Join'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Explore;
