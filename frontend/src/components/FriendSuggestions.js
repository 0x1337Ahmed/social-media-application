import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const FriendSuggestions = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingRequests, setSendingRequests] = useState({});

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      // Search for users who aren't friends yet
      const response = await axios.get('/api/friends/search?query=');
      setSuggestions(
        response.data.data
          .filter(user => user.friendshipStatus === 'none')
          .slice(0, 5)
      );
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (userId) => {
    if (sendingRequests[userId]) return;

    setSendingRequests(prev => ({ ...prev, [userId]: true }));
    try {
      await axios.post('/api/friends/request', { userId });
      setSuggestions(prev => 
        prev.map(user => 
          user._id === userId 
            ? { ...user, friendshipStatus: 'request_sent' }
            : user
        )
      );
      toast.success('Friend request sent!');
    } catch (error) {
      toast.error('Failed to send friend request');
    } finally {
      setSendingRequests(prev => ({ ...prev, [userId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          People You May Know
        </h3>
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!suggestions.length) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        People You May Know
      </h3>
      <div className="space-y-4">
        {suggestions.map(user => (
          <div key={user._id} className="flex items-center space-x-3">
            <Link to={`/myspace/${user._id}`} className="flex-shrink-0">
              <img
                src={user.profilePicture}
                alt={user.username}
                className="w-10 h-10 rounded-full object-cover"
              />
            </Link>
            <div className="flex-1 min-w-0">
              <Link 
                to={`/myspace/${user._id}`}
                className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:underline truncate"
              >
                {user.username}
              </Link>
              {user.bio && (
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {user.bio}
                </p>
              )}
            </div>
            <button
              onClick={() => handleSendRequest(user._id)}
              disabled={user.friendshipStatus !== 'none' || sendingRequests[user._id]}
              className={`flex-shrink-0 text-sm px-3 py-1 rounded-full ${
                user.friendshipStatus === 'none'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-default'
              }`}
            >
              {sendingRequests[user._id] ? (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : user.friendshipStatus === 'none' ? (
                'Add Friend'
              ) : (
                'Requested'
              )}
            </button>
          </div>
        ))}
      </div>
      
      {suggestions.length === 5 && (
        <Link
          to="/explore"
          className="block mt-4 text-sm text-center text-blue-600 dark:text-blue-400 hover:underline"
        >
          View More
        </Link>
      )}
    </div>
  );
};

export default FriendSuggestions;
