import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';
import { FaSearch, FaPaperPlane } from 'react-icons/fa';
import '../styles/MessagingScreen.css';

const MessagingScreen = () => {
  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  
  const user = useSelector(state => state.user.currentUser);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize socket connection
  useEffect(() => {
    if (user) {
      const newSocket = io(API_BASE_URL, {
        transports: ['websocket']
      });

      newSocket.on('connect', () => {
        console.log('Connected to socket server:', newSocket.id);
        setSocket(newSocket);
        
        // Join user room
        joinUserRoom(newSocket.id);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from socket server');
      });

      // Listen for private messages
      newSocket.on('private message', (data) => {
        console.log('Received private message:', data);
        if (selectedConversation && data.conversationId === selectedConversation._id) {
          setMessages(prev => [...prev, {
            _id: Date.now(),
            senderId: data.from,
            message: data.message,
            conversationId: data.conversationId,
            images: data.images || [],
            videos: data.videos || [],
            createdAt: new Date().toISOString()
          }]);
        }
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  // Fetch conversations on component mount
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  // Join user room API call
  const joinUserRoom = async (socketId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/join/user-room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ socketId })
      });

      const result = await response.json();
      if (result.isSuccess) {
        console.log('Joined user room successfully');
        fetchConversations();
      }
    } catch (error) {
      console.error('Error joining user room:', error);
    }
  };

  // Join conversation room API call
  const joinConversationRoom = async (conversationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/join/conv-room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          socketId: socket.id, 
          conversationId 
        })
      });

      const result = await response.json();
      if (result.isSuccess) {
        console.log('Joined conversation room successfully');
      }
    } catch (error) {
      console.error('Error joining conversation room:', error);
    }
  };

  // Fetch conversations list
  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/conversation/${user._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      if (result.isSuccess) {
        setConversations(result.data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for selected conversation
  const fetchMessages = async (conversationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/message/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      if (result.isSuccess) {
        setMessages(result.data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Handle conversation selection
  const handleConversationSelect = async (conversation) => {
    setSelectedConversation(conversation);
    setMessages([]);
    
    if (socket) {
      // Join conversation room
      await joinConversationRoom(conversation._id);
      // Fetch messages
      await fetchMessages(conversation._id);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !socket) return;

    try {
      const token = localStorage.getItem('token');
      const messageData = {
        conversationId: selectedConversation._id,
        message: newMessage.trim(),
        videos: [],
        images: []
      };

      const response = await fetch(`${API_BASE_URL}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(messageData)
      });

      const result = await response.json();
      if (result.isSuccess) {
        // Add message to local state immediately
        setMessages(prev => [...prev, {
          ...result.data,
          senderId: user._id
        }]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Filter conversations based on search term
  const filteredConversations = conversations.filter(conv => {
    const otherUser = conv.member.find(member => member._id !== user._id);
    return otherUser?.userName?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="messaging-container">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="messaging-container">
      {/* Sidebar - Conversations List */}
      <div className="conversations-sidebar">
        <div className="sidebar-header">
          <h2>Tin nhắn</h2>
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm cuộc hội thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="conversations-list">
          {filteredConversations.map((conversation) => {
            const otherUser = conversation.member.find(member => member._id !== user._id);
            return (
              <div
                key={conversation._id}
                className={`conversation-item ${selectedConversation?._id === conversation._id ? 'active' : ''}`}
                onClick={() => handleConversationSelect(conversation)}
              >
                <div className="conversation-avatar">
                  <img
                    src={otherUser?.userAvatar?.url || '/default-avatar.png'}
                    alt={otherUser?.userName}
                    className="avatar-img"
                  />
                </div>
                <div className="conversation-info">
                  <div className="conversation-name">
                    {otherUser?.userName || 'Unknown User'}
                  </div>
                  <div className="last-message">
                    {conversation.lastMessage}
                  </div>
                </div>
                <div className="conversation-time">
                  {formatTime(conversation.updatedAt)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="chat-header">
              {(() => {
                const otherUser = selectedConversation.member.find(member => member._id !== user._id);
                return (
                  <>
                    <div className="chat-user-avatar">
                      <img
                        src={otherUser?.userAvatar?.url || '/default-avatar.png'}
                        alt={otherUser?.userName}
                        className="avatar-img"
                      />
                    </div>
                    <div className="chat-user-info">
                      <div className="chat-user-name">
                        {otherUser?.userName || 'Unknown User'}
                      </div>
                      <div className="chat-user-status">
                        Đang hoạt động
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Messages Area */}
            <div className="messages-container">
              {messages.map((message) => (
                <div
                  key={message._id}
                  className={`message ${message.senderId === user._id ? 'sent' : 'received'}`}
                >
                  <div className="message-content">
                    {message.message}
                  </div>
                  <div className="message-time">
                    {formatTime(message.createdAt)}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="message-input-container">
              <input
                type="text"
                placeholder="Nhập tin nhắn..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="message-input"
              />
              <button
                onClick={sendMessage}
                className="send-button"
                disabled={!newMessage.trim()}
              >
                <FaPaperPlane />
              </button>
            </div>
          </>
        ) : (
          <div className="no-conversation-selected">
            <h3>Chọn một cuộc hội thoại để bắt đầu nhắn tin</h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagingScreen;