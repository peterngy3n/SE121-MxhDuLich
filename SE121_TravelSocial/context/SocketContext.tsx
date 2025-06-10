import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import io, { Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/constants/config';
import axios from 'axios';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  initializeSocket: () => Promise<void>;
  disconnectSocket: () => void;
  joinUserRoom: (userId: string) => Promise<void>;
  joinConversationRoom: (conversationId: string) => Promise<void>;
  leaveConversationRoom: (conversationId: string) => Promise<void>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Hàm khởi tạo socket (chỉ gọi khi đã đăng nhập)
  const initializeSocket = async () => {
    try {
      // Kiểm tra xem đã có socket connection chưa
      if (socket?.connected) {
        console.log('Socket already connected');
        return;
      }

      console.log('Khởi tạo socket connection...');
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        console.log('Không có token, không thể kết nối socket');
        return;
      }

      const bearerToken = `Bearer ${token}`;
      
      const newSocket = io(API_BASE_URL, {
        transports: ['websocket'],
        autoConnect: true,
        query: {
          token: bearerToken
        }
      });

      newSocket.on('connect', () => {
        console.log('Socket connected with ID:', newSocket.id);
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      setSocket(newSocket);
    } catch (error) {
      console.error('Error initializing socket:', error);
    }
  };

  // Hàm ngắt kết nối socket (khi logout)
  const disconnectSocket = () => {
    if (socket) {
      console.log('Disconnecting socket...');
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  };

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  const joinUserRoom = async (userId: string) => {
    if (!socket || !isConnected) {
      console.log('Socket not ready for joining user room');
      return;
    }
    
    try {
      const token = await AsyncStorage.getItem('token');
      const bearerToken = token ? `Bearer ${token}` : '';
      
      await axios.post(`${API_BASE_URL}/join/user-room`, {
        socketId: socket.id,
      }, {
        headers: {
          'Authorization': bearerToken,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`Đã join user room: user_${userId}`);
    } catch (error) {
      console.error('Lỗi khi join user room:', error);
    }
  };

  const joinConversationRoom = async (conversationId: string) => {
    if (!socket || !isConnected) {
      console.log('Socket not ready for joining conversation room');
      return;
    }
    
    try {
      const token = await AsyncStorage.getItem('token');
      const bearerToken = token ? `Bearer ${token}` : '';
      if (!socket.connected || !socket.id) {
        console.error('Socket not connected or missing ID');
        return;
      }
      
      console.log("Socket ID on client:", socket.id);
      console.log("Socket connected:", socket.connected);
      console.log("Conversation ID:", conversationId);
      
      await axios.post(`${API_BASE_URL}/join/conv-room`, {
        socketId: socket.id,
        conversationId: conversationId
      }, {
        headers: {
          'Authorization': bearerToken,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`Đã join conversation room: conv_${conversationId}`);
    } catch (error) {
      console.error('Lỗi khi join conversation room:', error);
    }
  };

  const leaveConversationRoom = async (conversationId: string) => {
    if (!socket || !isConnected) {
      console.log('Socket not ready for leaving conversation room');
      return;
    }
    
    try {
      const token = await AsyncStorage.getItem('token');
      const bearerToken = token ? `Bearer ${token}` : '';
      
      await axios.post(`${API_BASE_URL}/leave/conv-room`, {
        socketId: socket.id,
        conversationId: conversationId
      }, {
        headers: {
          'Authorization': bearerToken,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`Đã leave conversation room: conv_${conversationId}`);
    } catch (error) {
      console.error('Lỗi khi leave conversation room:', error);
    }
  };

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      initializeSocket,
      disconnectSocket,
      joinUserRoom,
      joinConversationRoom,
      leaveConversationRoom
    }}>
      {children}
    </SocketContext.Provider>
  );
};