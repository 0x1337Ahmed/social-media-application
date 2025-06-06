import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import io from 'socket.io-client';
import { toast } from 'react-toastify';

const Chat = () => {
  const { chatId } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef();
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  // Initialize socket connection
  useEffect(() => {
    socketRef.current = io('http://localhost:5000', {
      auth: { token }
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
    });

    socketRef.current.on('user_online', (userId) => {
      setOnlineUsers(prev => new Set([...prev, userId]));
    });

    socketRef.current.on('user_offline', (userId) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    socketRef.current.on('receive_message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [token]);

  // Fetch chats
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await axios.get('/chats');
        setChats(response.data.data);
      } catch (error) {
        toast.error('Failed to fetch chats');
      }
    };

    fetchChats();
  }, []);

  // Fetch or initialize current chat
  useEffect(() => {
    const initializeChat = async () => {
      if (chatId) {
        try {
          setLoading(true);
          const [chatResponse, messagesResponse] = await Promise.all([
            axios.get(`/chats/${chatId}`),
            axios.get(`/chats/${chatId}/messages`)
          ]);
          
          setCurrentChat(chatResponse.data.data);
          setMessages(messagesResponse.data.data);

          // Join chat room
          socketRef.current.emit('join_chat', chatId);
        } catch (error) {
          toast.error('Failed to load chat');
          navigate('/chat');
        } finally {
          setLoading(false);
        }
      } else {
        setCurrentChat(null);
        setMessages([]);
        setLoading(false);
      }
    };

    initializeChat();

    // Cleanup: leave chat room
    return () => {
      if (chatId) {
        socketRef.current.emit('leave_chat', chatId);
      }
    };
  }, [chatId, navigate]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentChat || sendingMessage) return;

    setSendingMessage(true);
    try {
      const response = await axios.post(`/chats/${currentChat._id}/messages`, {
        content: newMessage.trim()
      });

      const message = response.data.data;
      setMessages(prev => [...prev, message]);
      setNewMessage('');

      // Emit message to socket
      socketRef.current.emit('send_message', {
        chatId: currentChat._id,
        message
      });
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Chat List Sidebar */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Messages
          </h2>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {chats.map(chat => {
            const isPrivate = chat.type === 'private';
            const otherUser = isPrivate 
              ? chat.participants.find(p => p._id !== user._id)
              : null;
            
            return (
              <button
                key={chat._id}
                onClick={() => navigate(`/chat/${chat._id}`)}
                className={`w-full p-4 flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                  chat._id === currentChat?._id ? 'bg-gray-50 dark:bg-gray-800' : ''
                }`}
              >
                <div className="relative">
                  <img
                    src={isPrivate ? otherUser?.profilePicture : 'https://www.gravatar.com/avatar/?d=identicon'}
                    alt={isPrivate ? otherUser?.username : chat.groupName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {isPrivate && onlineUsers.has(otherUser?._id) && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {isPrivate ? otherUser?.username : chat.groupName}
                  </h3>
                  {chat.lastMessage && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {chat.lastMessage.content}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={
                    currentChat.type === 'private'
                      ? currentChat.participants.find(p => p._id !== user._id)?.profilePicture
                      : 'https://www.gravatar.com/avatar/?d=identicon'
                  }
                  alt="Chat"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {currentChat.type === 'private'
                      ? currentChat.participants.find(p => p._id !== user._id)?.username
                      : currentChat.groupName}
                  </h2>
                  {currentChat.type === 'group' && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {currentChat.participants.length} members
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="flex justify-center">
                  <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : (
                messages.map((message, index) => {
                  const isSender = message.sender._id === user._id;
                  const showAvatar = !isSender && 
                    (!messages[index - 1] || messages[index - 1].sender._id !== message.sender._id);

                  return (
                    <div
                      key={message._id}
                      className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-end space-x-2 max-w-[70%] ${isSender ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        {showAvatar && (
                          <img
                            src={message.sender.profilePicture}
                            alt={message.sender.username}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                        )}
                        <div>
                          {!isSender && showAvatar && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 ml-1">
                              {message.sender.username}
                            </p>
                          )}
                          <div
                            className={`rounded-2xl px-4 py-2 ${
                              isSender
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                          <p className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${
                            isSender ? 'text-right' : 'text-left'
                          }`}>
                            {formatTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 input"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sendingMessage}
                  className="btn-primary px-6"
                >
                  {sendingMessage ? (
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'Send'
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                No chat selected
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Select a chat from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
