import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { IoIosSend, IoMdArrowBack } from "react-icons/io";
import socketService from "../services/socketService";
import chatAPI from "../services/chatAPI";
import "../styles/ChatBusinessScreen.css";

const ConversationScreen = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Get current user from localStorage or Redux
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
  }, []);

  // Initialize conversation
  useEffect(() => {
    if (!conversationId || !currentUser?.id) return;

    const initConversation = async () => {
      try {
        setLoading(true);
        
        // Join conversation room via API
        await chatAPI.joinConversationRoom(conversationId);
        
        // Join socket room
        socketService.joinConversationRoom(conversationId);
        
        // Fetch message history
        const messagesData = await chatAPI.getConversationMessages(conversationId);
        setMessages(messagesData.messages || []);
        setConversation(messagesData.conversation || null);
        
      } catch (error) {
        console.error('Error initializing conversation:', error);
      } finally {
        setLoading(false);
      }
    };

    initConversation();

    // Cleanup: leave room when component unmounts
    return () => {
      socketService.leaveConversationRoom(conversationId);
    };
  }, [conversationId, currentUser?.id]);

  // Listen for new messages via socket
  useEffect(() => {
    const handleNewMessage = (messageData) => {
      if (messageData.conversationId === conversationId) {
        setMessages(prev => [...prev, messageData]);
      }
    };

    socketService.onNewMessage(handleNewMessage);

    return () => {
      socketService.off('private-message', handleNewMessage);
    };
  }, [conversationId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      // Optimistic update - add message to UI immediately
      const tempMessage = {
        id: Date.now(),
        content: messageText,
        senderId: currentUser.id,
        conversationId: conversationId,
        createdAt: new Date().toISOString(),
        sender: currentUser,
        isTemp: true
      };
      
      setMessages(prev => [...prev, tempMessage]);

      // Send message via API
      const messageData = {
        conversationId: conversationId,
        content: messageText,
        type: 'text'
      };

      const sentMessage = await chatAPI.sendMessage(messageData);
      
      // Replace temp message with real message
      setMessages(prev => 
        prev.map(msg => 
          msg.isTemp && msg.content === messageText 
            ? { ...sentMessage, sender: currentUser }
            : msg
        )
      );

    } catch (error) {
      console.error('Error sending message:', error);
      // Remove temp message on error
      setMessages(prev => 
        prev.filter(msg => !(msg.isTemp && msg.content === messageText))
      );
    } finally {
      setSending(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-list-chat">
      {/* Header */}
      <div className="flex items-center p-4 border-b bg-white">
        <button 
          onClick={() => navigate(-1)}
          className="mr-3 p-2 hover:bg-gray-100 rounded-full"
        >
          <IoMdArrowBack className="text-xl" />
        </button>
        
        {conversation?.participants?.map(participant => 
          participant.id !== currentUser?.id && (
            <div key={participant.id} className="flex items-center">
              <img
                alt="User avatar"
                className="w-10 h-10 rounded-full mr-3"
                src={participant.avatar || "https://storage.googleapis.com/a1aa/image/JpjvKYyvHrbHO5vhDU7Snddgv8aH8mWZ6TRjkvsMXvWcdE6E.jpg"}
              />
              <div>
                <p className="font-medium">{participant.name}</p>
                <p className="text-sm text-gray-500">
                  {participant.isOnline ? 'Đang hoạt động' : 'Không hoạt động'}
                </p>
              </div>
            </div>
          )
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => {
          const isOwnMessage = message.senderId === currentUser?.id;
          const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;
          
          return (
            <div
              key={message.id}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-end max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                {!isOwnMessage && showAvatar && (
                  <img
                    alt="User avatar"
                    className="w-8 h-8 rounded-full mx-2"
                    src={message.sender?.avatar || "https://storage.googleapis.com/a1aa/image/JpjvKYyvHrbHO5vhDU7Snddgv8aH8mWZ6TRjkvsMXvWcdE6E.jpg"}
                  />
                )}
                
                <div className={`mx-2 ${!isOwnMessage && !showAvatar ? 'ml-12' : ''}`}>
                  <div
                    className={`p-3 rounded-lg ${
                      isOwnMessage
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-800'
                    } ${message.isTemp ? 'opacity-70' : ''}`}
                  >
                    <p className="break-words">{message.content}</p>
                  </div>
                  <p className={`text-xs text-gray-400 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex items-center space-x-2">
          <input
            className="flex-1 p-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập tin nhắn..."
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sending}
          />
          <button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className={`p-3 rounded-full ${
              newMessage.trim() && !sending
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <IoIosSend className="text-xl" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversationScreen;