import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';

const MySpace = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    bio: '',
    profilePicture: ''
  });

  const isOwnProfile = !userId || userId === user._id;
  const profileId = userId || user._id;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [profileRes, postsRes] = await Promise.all([
          axios.get(`/friends/search?query=${profileId}`),
          axios.get(`/posts/user/${profileId}`)
        ]);

        const profileData = profileRes.data.data.find(u => u._id === profileId);
        if (!profileData) {
          toast.error('User not found');
          navigate('/');
          return;
        }

        setProfile(profileData);
        setPosts(postsRes.data.data);
        setEditForm({
          bio: profileData.bio || '',
          profilePicture: profileData.profilePicture
        });
      } catch (error) {
        toast.error('Failed to load profile');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profileId, navigate]);

  const handleFriendRequest = async () => {
    if (sendingRequest) return;

    setSendingRequest(true);
    try {
      if (profile.friendshipStatus === 'none') {
        await axios.post('/friends/request', { userId: profile._id });
        setProfile(prev => ({ ...prev, friendshipStatus: 'request_sent' }));
        toast.success('Friend request sent!');
      } else if (profile.friendshipStatus === 'request_sent') {
        await axios.post('/friends/cancel', { userId: profile._id });
        setProfile(prev => ({ ...prev, friendshipStatus: 'none' }));
        toast.success('Friend request cancelled');
      } else if (profile.friendshipStatus === 'request_received') {
        await axios.post('/friends/accept', { userId: profile._id });
        setProfile(prev => ({ ...prev, friendshipStatus: 'friend' }));
        toast.success('Friend request accepted!');
      } else if (profile.friendshipStatus === 'friend') {
        await axios.post('/friends/remove', { userId: profile._id });
        setProfile(prev => ({ ...prev, friendshipStatus: 'none' }));
        toast.success('Friend removed');
      }
    } catch (error) {
      toast.error('Failed to process friend request');
    } finally {
      setSendingRequest(false);
    }
  };

  const handleEditProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put('/auth/me', editForm);
      setProfile(prev => ({
        ...prev,
        ...response.data.data
      }));
      setShowEditProfile(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleStartChat = async () => {
    try {
      const response = await axios.post('/chats/private', {
        userId: profile._id
      });
      navigate(`/chat/${response.data.data._id}`);
    } catch (error) {
      toast.error('Failed to start chat');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        <div className="p-6">
          <div className="flex items-start space-x-6">
            <img
              src={profile.profilePicture}
              alt={profile.username}
              className="w-32 h-32 rounded-full object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {profile.username}
                </h1>
                <div className="flex space-x-3">
                  {isOwnProfile ? (
                    <button
                      onClick={() => setShowEditProfile(true)}
                      className="btn-secondary"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleFriendRequest}
                        disabled={sendingRequest}
                        className={`btn ${
                          profile.friendshipStatus === 'friend'
                            ? 'btn-secondary'
                            : profile.friendshipStatus === 'request_received'
                            ? 'btn-primary'
                            : 'btn-primary'
                        }`}
                      >
                        {sendingRequest ? (
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : profile.friendshipStatus === 'friend' ? (
                          'Friends'
                        ) : profile.friendshipStatus === 'request_sent' ? (
                          'Cancel Request'
                        ) : profile.friendshipStatus === 'request_received' ? (
                          'Accept Request'
                        ) : (
                          'Add Friend'
                        )}
                      </button>
                      {profile.friendshipStatus === 'friend' && (
                        <button
                          onClick={handleStartChat}
                          className="btn-primary"
                        >
                          Message
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                {profile.bio || 'No bio yet'}
              </p>

              <div className="mt-4 flex space-x-6">
                <div>
                  <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {posts.length}
                  </span>
                  <span className="ml-1 text-gray-500 dark:text-gray-400">
                    Posts
                  </span>
                </div>
                <div>
                  <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {profile.friends?.length || 0}
                  </span>
                  <span className="ml-1 text-gray-500 dark:text-gray-400">
                    Friends
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Edit Profile
            </h2>
            <form onSubmit={handleEditProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Profile Picture URL
                </label>
                <input
                  type="url"
                  value={editForm.profilePicture}
                  onChange={(e) => setEditForm(prev => ({ ...prev, profilePicture: e.target.value }))}
                  className="input"
                  placeholder="Enter image URL"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bio
                </label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  className="input"
                  rows="3"
                  placeholder="Write something about yourself"
                  maxLength="160"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditProfile(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Posts Section */}
      <div className="space-y-6">
        {isOwnProfile && <CreatePost onPostCreated={post => setPosts(prev => [post, ...prev])} />}
        
        {posts.map(post => (
          <PostCard
            key={post._id}
            post={post}
            onPostUpdated={updatedPost => {
              setPosts(prev => prev.map(p => 
                p._id === updatedPost._id ? updatedPost : p
              ));
            }}
            onPostDeleted={postId => {
              setPosts(prev => prev.filter(p => p._id !== postId));
            }}
          />
        ))}

        {posts.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No posts yet</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {isOwnProfile ? 'Start sharing by creating your first post!' : 'This user hasn\'t posted anything yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MySpace;
