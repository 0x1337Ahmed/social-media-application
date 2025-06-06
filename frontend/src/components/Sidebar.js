import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Sidebar = ({ isOpen, onClose, currentPath, onNavigate }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch friends and recent chats
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [friendsRes, chatsRes] = await Promise.all([
          axios.get('/friends'),
          axios.get('/chats')
        ]);
        setFriends(friendsRes.data.data.friends);
        setRecentChats(chatsRes.data.data);
      } catch (error) {
        console.error('Error fetching sidebar data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleNavigation = (path) => {
    navigate(path);
    onNavigate();
  };

  const NavLink = ({ to, icon, label }) => (
    <button
      onClick={() => handleNavigation(to)}
      className={`w-full flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${
        currentPath === to ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : ''
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <>
      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 ease-in-out z-30 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Navigation Links */}
          <nav className="p-4 space-y-2">
            <NavLink
              to="/"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              }
              label="Home"
            />
            <NavLink
              to="/chat"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              }
              label="Chat"
            />
            <NavLink
              to="/myspace"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
              label="My Space"
            />
            <NavLink
              to="/explore"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
              label="Explore"
            />
          </nav>

          {/* Recent Chats */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
                Recent Chats
              </h3>
              {loading ? (
                <div className="animate-pulse space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {recentChats.map(chat => (
                    <button
                      key={chat._id}
                      onClick={() => handleNavigation(`/chat/${chat._id}`)}
                      className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <img
                        src={chat.type === 'private' 
                          ? chat.participants.find(p => p._id !== user._id)?.profilePicture 
                          : 'https://www.gravatar.com/avatar/?d=identicon'}
                        alt="Chat"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {chat.type === 'private'
                            ? chat.participants.find(p => p._id !== user._id)?.username
                            : chat.groupName}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Online Friends */}
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
                Online Friends
              </h3>
              {loading ? (
                <div className="animate-pulse space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {friends
                    .filter(friend => friend.isOnline)
                    .map(friend => (
                      <button
                        key={friend._id}
                        onClick={() => handleNavigation(`/myspace/${friend._id}`)}
                        className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <div className="relative">
                          <img
                            src={friend.profilePicture}
                            alt={friend.username}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {friend.username}
                        </span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
};

export default Sidebar;
