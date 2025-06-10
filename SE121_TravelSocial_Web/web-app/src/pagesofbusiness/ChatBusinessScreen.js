import React from "react";
import "../styles/ChatBusinessScreen.css";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/DetailLocationScreen.css";
import { FaSearch } from "react-icons/fa";
import { IoIosSend } from "react-icons/io";
import io from 'socket.io-client';

const ChatBusinessScreen = () => {
  const [isFocused, setIsFocused] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [socket, setSocket] = useState(null);
  const [messageInput, setMessageInput] = useState(''); // Thêm state cho input
  const [sendingMessage, setSendingMessage] = useState(false); // Thêm state loading
  const navigate = useNavigate();
  const token = localStorage.getItem('token');


  // Ref cho messages container
  const messagesContainerRef = useRef(null);
  const lastMessageRef = useRef(null);

  const joinUserRoom = async (socketId) => {
    try {
      console.log('🚪 Joining user room with socketId:', socketId);
      
      const response = await fetch('http://localhost:3000/join/user-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          socketId: socketId
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Successfully joined user room:', data);
        return data;
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to join user room:', response.status, errorData);
        throw new Error(`Failed to join room: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error joining user room:', error);
      throw error;
    }
  };

  // Function để join conversation room
  const joinConversationRoom = async (socketId, conversationId) => {
    try {
      console.log('🏠 Joining conversation room:', { socketId, conversationId });
      
      const response = await fetch('http://localhost:3000/join/conv-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          socketId: socketId,
          conversationId: conversationId
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Successfully joined conversation room:', data);
        return data;
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to join conversation room:', response.status, errorData);
        throw new Error(`Failed to join conversation room: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error joining conversation room:', error);
      throw error;
    }
  };

  // Scroll xuống cuối khi load messages lần đầu hoặc gửi tin nhắn
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Chỉ scroll xuống khi load messages lần đầu
  useEffect(() => {
    if (!loadingMessages && messages.length > 0) {
      // Timeout nhỏ để đảm bảo DOM đã render
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [loadingMessages]); // Chỉ trigger khi loadingMessages thay đổi

  const sendMessage = async (messageContent, conversationId) => {
    try {
      setSendingMessage(true);
      console.log('Sending message:', { messageContent, conversationId });

      const response = await fetch('http://localhost:3000/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          conversationId: conversationId,
          message: messageContent,
          senderId: '671a02c2c0202050e0969548', // Business ID
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Message sent successfully:', data);
        
        // Thêm tin nhắn vào UI ngay lập tức
        const newMessage = {
          _id: data._id || data.id || Date.now().toString(),
          content: messageContent,
          senderId: '671a02c2c0202050e0969548',
          conversationId: conversationId,
          timestamp: data.timestamp || new Date().toISOString()
        };
        
        setMessages(prevMessages => [...prevMessages, newMessage]);
        
        // Cập nhật last message trong conversation list
        setConversations(prevConversations => 
          prevConversations.map(conv => 
            (conv._id || conv.id) === conversationId 
              ? { 
                  ...conv, 
                  lastMessage: messageContent, 
                  timestamp: newMessage.timestamp
                }
              : conv
          )
        );

        return data;
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to send message:', response.status, errorData);
        throw new Error(`Failed to send message: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw error;
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSendMessage = async () => {
    const content = messageInput.trim();
    
    if (!content || !selectedConversation || sendingMessage) {
      return;
    }

    const conversationId = selectedConversation._id || selectedConversation.id;
    
    try {
      // Clear input ngay lập tức để UX tốt hơn
      setMessageInput('');
      
      await sendMessage(content, conversationId);
      
    } catch (error) {
      // Nếu có lỗi, restore lại input
      setMessageInput(content);
      alert('Không thể gửi tin nhắn. Vui lòng thử lại.');
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  useEffect(() => {
    //console.log('TOken::', token)
    const newSocket = io('http://localhost:3000', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      query: {
        token: `Bearer ${token}`
      }
    });

    console.log('connecting to socket server...', newSocket.id);

    newSocket.on('connect', async () => {
      console.log('Connected to socket server:', newSocket.id);
      try {
        await joinUserRoom(newSocket.id);
      } catch (error) {
        console.error('Failed to join user room on connect:', error);
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    newSocket.on('private message', (messageData) => {
      console.log('📨 Private message received:', messageData);
      
      try {
        // Kiểm tra xem tin nhắn có thuộc conversation đang được chọn không
        if (selectedConversation && 
            messageData.conversationId === (selectedConversation._id || selectedConversation.id)) {
          
          console.log('✅ Message belongs to current conversation');
          
          // Chỉ thêm tin nhắn nếu không phải từ chính mình gửi
          if (messageData.senderId !== '671a02c2c0202050e0969548') {
            console.log('✅ Message is from another user, adding to messages');
            
            setMessages(prevMessages => {
              console.log('🔍 Current messages count:', prevMessages.length);
              
              // Bật lại duplicate check
              const messageExists = false
              // prevMessages.some(msg => 
              //   (msg._id === messageData._id || msg.id === messageData.id) || 
              //   (msg.content === messageData.content && 
              //    Math.abs(new Date(msg.timestamp) - new Date(messageData.timestamp)) < 1000)
              // );
              
              if (!messageExists) {
                console.log('✅ Adding new private-message to current conversation');
                const newMessages = [...prevMessages, {
                  _id: messageData._id || messageData.id || Date.now().toString(),
                  content: messageData.content || messageData.message,
                  senderId: messageData.senderId,
                  conversationId: messageData.conversationId,
                  timestamp: messageData.timestamp || new Date().toISOString()
                }];
                console.log('🔍 New messages count:', newMessages.length);
                return newMessages;
              } else {
                console.log('⚠️ Message already exists, skipping');
                return prevMessages;
              }
            });
          } else {
            console.log('⚠️ Ignoring message from self');
          }
        } else {
          console.log('❌ Message does not belong to current conversation');
          console.log('Selected conversation ID:', selectedConversation?._id || selectedConversation?.id);
          console.log('Message conversation ID:', messageData.conversationId);
        }
        
        // Cập nhật last message trong conversation list (cho tất cả tin nhắn)
        setConversations(prevConversations => 
          prevConversations.map(conv => {
            const convId = conv._id || conv.id;
            if (convId === messageData.conversationId) {
              console.log('✅ Updating last message for conversation:', convId);
              return { 
                ...conv, 
                lastMessage: messageData.content || messageData.message, 
                timestamp: messageData.timestamp || new Date().toISOString()
              };
            }
            return conv;
          })
        );
        
      } catch (error) {
        console.error('❌ Error processing private message:', error);
      }
    });

    setSocket(newSocket);

    // Cleanup when component unmounts
    return () => {
        newSocket.disconnect();
        console.log('Socket disconnected');
    };
  }, [selectedConversation]);

  // // Fetch conversations từ API
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3000/conversation/671a02c2c0202050e0969548', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Thêm authorization header nếu cần
            // 'Authorization': `Bearer ${token}`
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('API Response:', data); // Debug để xem cấu trúc dữ liệu
          
          // Kiểm tra và set conversations
          if (data.data && Array.isArray(data.data)) {
            setConversations(data.data);
            // Tự động chọn conversation đầu tiên nếu có
            if (data.data.length > 0) {
              setSelectedConversation(data.data[0]);
            }
          } else {
            setConversations([]);
          }
        } else {
          console.error('Failed to fetch conversations');
          setConversations([]);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  const fetchMessages = async (conversationId) => {
    try {
      console.log('Fetching messages for conversationId:', conversationId);
      setLoadingMessages(true);
      const response = await fetch(`http://localhost:3000/message/${conversationId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Thêm authorization header nếu cần
          'Authorization': `Bearer ${token}`
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Messages Response:', data);
        
        if (data.data && Array.isArray(data.data)) {
          // Sắp xếp tin nhắn theo thời gian (cũ nhất trước, mới nhất sau)
          const sortedMessages = data.data.sort((a, b) => 
            new Date(a.timestamp || a.createdAt) - new Date(b.timestamp || b.createdAt)
          );
          setMessages(sortedMessages);
        } else if (Array.isArray(data)) {
          const sortedMessages = data.sort((a, b) => 
            new Date(a.timestamp || a.createdAt) - new Date(b.timestamp || b.createdAt)
          );
          setMessages(sortedMessages);
        } else {
          setMessages([]);
        }
      } else {
        console.error('Failed to fetch messages');
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Handle click conversation
  const handleConversationClick = async (conversation) => {
    setSelectedConversation(conversation);
    const conversationId = conversation._id || conversation.id;
    if (conversationId) {
      fetchMessages(conversationId);
      if (socket && socket.id) {
        try {
          await joinConversationRoom(socket.id, conversationId);
        } catch (error) {
          console.error('Failed to join conversation room:', error);
        }
      }
    }
  };

  // Format thời gian cho tin nhắn
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  // Format thời gian
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div class="container">
      <div class="containerformobile">
        <div class="containerlistbusiness widthlistbusiness anti-bg">
          <div class="flex h-100">
            <div class="w-1/4 bg-list-chat p-4">
              <h1 class="text-2xl font-bold mb-4">Chat</h1>
              <div class="relative mb-4">
                <input
                  className="w-full p-2 pl-10 border br-22 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={isFocused ? "" : "     Tìm kiếm"}
                  type="text"
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />
                {!isFocused && (
                  <FaSearch className="absolute left-3 top-2.5 text-gray-400" />
                )}
              </div>
              
              {/* Danh sách conversations */}
              {loading ? (
                <div class="text-center text-gray-500">Đang tải...</div>
              ) : conversations.length === 0 ? (
                <div class="text-center text-gray-500">Chưa có cuộc trò chuyện nào</div>
              ) : (
                conversations.map((conversation, index) => (
                  <div 
                    key={conversation._id || conversation.id || index}
                    class={`flex items-center p-2 rounded-lg mb-2 cursor-pointer hover:bg-gray-100 ${
                      selectedConversation?._id === conversation._id || selectedConversation?.id === conversation.id ? 'bg-blue-100' : 'bg-white'
                    }`}
                    onClick={() => handleConversationClick(conversation)}
                  >
                    <img
                      alt="User avatar"
                      class="w-10 h-10 rounded-full mr-2 flex-shrink-0"
                      height="40"
                      src={conversation.avatar || "https://storage.googleapis.com/a1aa/image/JpjvKYyvHrbHO5vhDU7Snddgv8aH8mWZ6TRjkvsMXvWcdE6E.jpg"}
                      width="40"
                    />
                    <div class="flex-1 min-w-0">
                      <div class="flex justify-between items-center mb-1">
                        <p class="font-medium truncate">{conversation.name || 'Unknown User'}</p>
                        <span class="text-xs text-gray-400 flex-shrink-0 ml-2">
                          {conversation.timestamp 
                            ? formatTime(conversation.timestamp)
                            : ''
                          }
                        </span>
                      </div>
                      <p class="text-sm text-gray-500 truncate">
                        {conversation.lastMessage || 'Chưa có tin nhắn'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div class="w-3/4 bg-list-chat p-4 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Header */}
                  <div class="flex items-center mb-4 border-b pb-4">
                    <img
                      alt="User avatar"
                      class="w-10 h-10 rounded-full mr-2"
                      height="40"
                      src={selectedConversation.avatar || "https://storage.googleapis.com/a1aa/image/JpjvKYyvHrbHO5vhDU7Snddgv8aH8mWZ6TRjkvsMXvWcdE6E.jpg"}
                      width="40"
                    />
                    <p class="font-medium">{selectedConversation.name || 'Unknown User'}</p>
                  </div>

                  {/* Messages */}
                  <div 
                    ref={messagesContainerRef}
                    className="flex-1 overflow-y-auto mb-4"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%'
                    }}
                  >
                    {loadingMessages ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center text-gray-500">Đang tải tin nhắn...</div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center text-gray-500">Chưa có tin nhắn nào</div>
                      </div>
                    ) : (
                      <div className="space-y-2 p-2">
                        {messages.map((message, index) => (
                          <div key={message._id || message.id || index}>
                            {/* Tin nhắn của mình (business) - bên phải, nền xanh */}
                            {message.senderId === '671a02c2c0202050e0969548' ? (
                              <div className="flex justify-end mb-2">
                                <div className="max-w-xs lg:max-w-md">
                                  <div className="bg-blue-500 text-white p-3 rounded-lg rounded-br-none shadow-sm">
                                    <p className="text-sm leading-relaxed">{message.content || message.message}</p>
                                  </div>
                                  <div className="text-right mt-1">
                                    <span className="text-xs text-gray-400">
                                      {message.timestamp ? formatMessageTime(message.timestamp) : ''}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              /* Tin nhắn của người khác - bên trái, nền trắng */
                              <div className="flex justify-start mb-2">
                                <img
                                  alt="User avatar"
                                  className="w-8 h-8 rounded-full mr-2 mt-1 flex-shrink-0"
                                  height="32"
                                  src={selectedConversation.avatar || "https://storage.googleapis.com/a1aa/image/JpjvKYyvHrbHO5vhDU7Snddgv8aH8mWZ6TRjkvsMXvWcdE6E.jpg"}
                                  width="32"
                                />
                                <div className="max-w-xs lg:max-w-md">
                                  <div className="bg-white border border-gray-200 p-3 rounded-lg rounded-bl-none shadow-sm">
                                    <p className="text-sm leading-relaxed text-gray-800">{message.content || message.message}</p>
                                  </div>
                                  <div className="text-left mt-1">
                                    <span className="text-xs text-gray-400">
                                      {message.timestamp ? formatMessageTime(message.timestamp) : ''}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        {/* Ref cho tin nhắn cuối để scroll khi cần */}
                        <div ref={lastMessageRef} />
                      </div>
                    )}
                  </div>

                  {/* Input */}
                  <div className="flex items-center border-t pt-4">
                    <input
                      className="flex-1 p-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Type your message..."
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={sendingMessage}
                    />
                    <button 
                      className={`ml-3 p-2 rounded-full transition-colors ${
                        sendingMessage || !messageInput.trim()
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-500 hover:bg-blue-600 cursor-pointer'
                      } text-white`}
                      onClick={handleSendMessage}
                      disabled={sendingMessage || !messageInput.trim()}
                    >
                      {sendingMessage ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <IoIosSend className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div class="flex-1 flex items-center justify-center text-gray-500">
                  Chọn một cuộc trò chuyện để bắt đầu
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBusinessScreen;