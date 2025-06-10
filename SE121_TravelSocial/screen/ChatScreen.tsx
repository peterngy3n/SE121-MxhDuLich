import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRoute } from '@react-navigation/native';
import { Text, View, StyleSheet, Image, TouchableOpacity, TextInput, ScrollView, Alert, Platform, FlatList, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import { NativeStackNavigatorProps } from 'react-native-screens/lib/typescript/native-stack/types';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { useUser } from '@/context/UserContext';
import { API_BASE_URL } from '@/constants/config';
import axios from 'axios';
import { useSocket } from '@/context/SocketContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ReservationRouteProp = RouteProp<RootStackParamList,'chat-screen'>;

interface Message {
  _id: string;
  conversationId: string;
  senderId?: string;
  message: string;
  images: string[];
  videos: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface ApiResponse {
  isSuccess: boolean;
  data: Message[];
  error: string | null;
}

export default function ChatScreen({ navigation }: {navigation: NativeStackNavigatorProps}) {
  const route = useRoute<ReservationRouteProp>();
  const { conversationId, userName } = route.params;
  const { userId } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const { socket, isConnected, joinConversationRoom, leaveConversationRoom } = useSocket();

  // Join conversation room khi vào screen
  useEffect(() => {
    const setupConversationRoom = async () => {
      if (isConnected && socket) {
        console.log('Joining conversation room:', conversationId);
        await joinConversationRoom(conversationId);
      }
    };

    setupConversationRoom();

    // Leave conversation room khi unmount
    return () => {
      if (isConnected && socket) {
        console.log('Leaving conversation room:', conversationId);
        leaveConversationRoom(conversationId);
      }
    };
  }, [isConnected, socket, conversationId]);

  // Lắng nghe tin nhắn mới real-time
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (messageData: any) => {
      console.log('Nhận tin nhắn mới trong chat:', messageData);
      
      // Chỉ cập nhật nếu tin nhắn thuộc conversation hiện tại
      if (messageData.conversationId === conversationId) {
        // Transform socket message to match Message interface
        const transformedMessage: Message = {
          _id: messageData._id || `socket-${Date.now()}-${Math.random()}`,
          conversationId: messageData.conversationId,
          senderId: messageData.from || messageData.senderId, // Map 'from' to 'senderId'
          message: messageData.message,
          images: messageData.images || [],
          videos: messageData.videos || [],
          createdAt: messageData.createdAt || new Date().toISOString(),
          updatedAt: messageData.updatedAt || new Date().toISOString(),
          __v: messageData.__v || 0
        };
  
        console.log('Transformed message:', transformedMessage);
  
        setMessages(prevMessages => {
          // Kiểm tra xem tin nhắn đã tồn tại chưa để tránh duplicate
          const messageExists = prevMessages.some(msg => 
            msg._id === transformedMessage._id || 
            (msg.message === transformedMessage.message && 
             msg.senderId === transformedMessage.senderId &&
             Math.abs(new Date(msg.createdAt).getTime() - new Date(transformedMessage.createdAt).getTime()) < 5000) // 5 giây tolerance
          );
          
          if (!messageExists) {
            console.log('Adding transformed message to UI');
            // Thêm tin nhắn mới vào cuối danh sách
            return [...prevMessages, transformedMessage];
          } else {
            console.log('Message already exists, skipping');
          }
          return prevMessages;
        });

      //   setMessages(prevMessages => {
      //   // CHỈ kiểm tra duplicate theo _id (nếu có)
      //   // Bỏ qua việc check theo nội dung + thời gian
      //   const messageExists = transformedMessage._id && 
      //     prevMessages.some(msg => msg._id === transformedMessage._id);
        
      //   if (!messageExists) {
      //     console.log('Adding transformed message to UI');
      //     return [...prevMessages, transformedMessage];
      //   } else {
      //     console.log('Message with same _id already exists, skipping');
      //   }
      //   return prevMessages;
      // });

      // // Cuộn xuống tin nhắn mới
      // setTimeout(() => {
      //   flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      // }, 100);
  
        // Cuộn xuống tin nhắn mới
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }, 100);
      }
    };

    // Lắng nghe event 'private message'
    socket.on('private message', handleNewMessage);

    // Cleanup event listener
    return () => {
      socket.off('private message', handleNewMessage);
    };
  }, [socket, conversationId]);

  // Fetch tin nhắn từ API
  const fetchMessages = useCallback(async () => {
    setLoadingMessages(true);
    try {
      // Lấy token để gửi kèm request
      const token = await AsyncStorage.getItem('token');
      const bearerToken = token ? `Bearer ${token}` : '';

      const response = await axios.get<ApiResponse>(`${API_BASE_URL}/message/${conversationId}`, {
        headers: {
          'Authorization': bearerToken
        }
      });
      
      if (response.data.isSuccess) {
        // Sắp xếp tin nhắn theo thời gian (cũ nhất -> mới nhất)
        const sortedMessages = response.data.data.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setMessages(sortedMessages);
      } else {
        console.error("Lỗi API:", response.data.error);
        Alert.alert("Lỗi", "Không thể tải tin nhắn");
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error("Lỗi fetch tin nhắn:", error);
        Alert.alert("Lỗi", "Không thể kết nối đến server");
      }
    } finally {
      setLoadingMessages(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Cuộn xuống tin nhắn mới nhất khi có tin nhắn mới
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      // Timeout nhỏ để đảm bảo FlatList đã render xong
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    }
  }, [messages]);

  // Gửi tin nhắn mới
  const handleSend = async () => {
    if (newMessage.trim() === '' || sendingMessage) return;

    const messageText = newMessage.trim();
    setSendingMessage(true);
    
    // Tạo tin nhắn tạm thời cho optimistic update
    const tempMessage: Message = {
      _id: `temp-${Date.now()}`,
      conversationId: conversationId,
      senderId: userId?.toString(),
      message: messageText,
      images: [],
      videos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      __v: 0
    };

    // Thêm tin nhắn tạm thời vào UI ngay lập tức
    setMessages(prevMessages => [...prevMessages, tempMessage]);
    setNewMessage('');

    try {
      // Lấy token để gửi kèm request
      const token = await AsyncStorage.getItem('token');
      const bearerToken = token ? `Bearer ${token}` : '';

      // Gọi API để gửi tin nhắn
      const response = await axios.post(`${API_BASE_URL}/message`, {
        conversationId: conversationId,
        senderId: userId,
        message: messageText,
        images: [],
        videos: []
      }, {
        headers: {
          'Authorization': bearerToken,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.isSuccess) {
        // Thay thế tin nhắn tạm thời bằng tin nhắn thực từ server
        const realMessage = response.data.data;
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg._id === tempMessage._id ? realMessage : msg
          )
        );
      } else {
        // Nếu gửi thất bại, xóa tin nhắn tạm thời
        setMessages(prevMessages => 
          prevMessages.filter(msg => msg._id !== tempMessage._id)
        );
        Alert.alert("Lỗi", "Không thể gửi tin nhắn");
      }
    } catch (error) {
      console.error("Lỗi gửi tin nhắn:", error);
      // Xóa tin nhắn tạm thời nếu có lỗi
      setMessages(prevMessages => 
        prevMessages.filter(msg => msg._id !== tempMessage._id)
      );
      setNewMessage(messageText); // Đặt lại text vào input
      Alert.alert("Lỗi", "Không thể gửi tin nhắn. Vui lòng thử lại.");
    } finally {
      setSendingMessage(false);
    }
  };

  // Render mỗi tin nhắn
  const renderMessageItem = ({ item }: { item: Message }) => {
    const isCurrentUser = item.senderId === userId?.toString();
    
    return (
      <View style={[
        styles.messageContainer,
        isCurrentUser ? styles.currentUserContainer : styles.otherUserContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble
        ]}>
          <Text style={[
            styles.messageText,
            isCurrentUser ? styles.currentUserText : styles.otherUserText
          ]}>
            {item.message}
          </Text>
          <Text style={styles.messageTime}>
            {new Date(item.createdAt).toLocaleTimeString('vi-VN', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
      </View>
    );
  };

  const keyExtractor = (item: Message) => item._id;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.arrowleftbutton} onPress={() => navigation.goBack()}>
          <Image source={require('../assets/icons/arrowleft.png')} style={styles.arrowlefticon} />
        </TouchableOpacity>
        <View style={styles.headerUserInfo}>
          <View style={styles.avatarContainer}>
            <Image source={require('../assets/images/avt.png')} style={styles.avatar} />
          </View>
          <Text style={styles.headerUserName}>{userName}</Text>
        </View>
      </View>

      {/* Khu vực tin nhắn */}
      <View style={styles.messagesArea}>
        {loadingMessages ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#196EEE" />
            <Text style={styles.loadingText}>Đang tải tin nhắn...</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyMessagesContainer}>
            <View style={styles.emptyMessageContent}>
              <Image source={require('../assets/images/avt.png')} style={styles.emptyAvatar} />
              <Text style={styles.emptyMessageText}>
                Hãy gửi lời chào đến {userName}
              </Text>
              <Text style={styles.emptyMessageSubText}>
                Bắt đầu cuộc trò chuyện của bạn
              </Text>
            </View>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages.slice().reverse()}
            renderItem={renderMessageItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
            inverted={true}
            onContentSizeChange={() => 
              // SỬA: Thay scrollToEnd bằng scrollToOffset
              flatListRef.current?.scrollToOffset({ offset: 0, animated: false })
            }
          />
        )}
      </View>

      {/* Khu vực nhập tin nhắn */}
      <View style={styles.textInputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Nhập tin nhắn..."
          placeholderTextColor="#999999"
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity 
          style={[styles.sendButton, sendingMessage && styles.sendButtonDisabled]} 
          onPress={handleSend}
          disabled={sendingMessage || newMessage.trim() === ''}
        >
          {sendingMessage ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Image source={require('../assets/icons/send.png')} style={styles.sendIcon} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
//     return (

//         <View style={styles.container}>
//           <View style={styles.header}>
//             <TouchableOpacity style={styles.arrowleftbutton} onPress={() => navigation.goBack()}>
//               <Image source={require('../assets/icons/arrowleft.png')} style={styles.arrowlefticon} />
//             </TouchableOpacity>
//             <View style ={{flexDirection:'row', alignItems:'center', alignContent:'center',justifyContent:'center', }}>
//                 <View style={styles.avatarContainer}>
//                     <Image source={require('../assets/images/avt.png')} style={styles.avatar} />
//                 </View>
//                 <View>
//                     <Text style={{fontSize:18,fontWeight:'bold',}}>{userName}</Text>
//                 </View>
//             </View>
//           </View>

//           <View style={styles.textInputContainer}>
//                 <TextInput
//                     style={[styles.textInput]}
//                     placeholder="Nhập tin nhắn"
//                     placeholderTextColor="#000000"
                    
//                 />
//                 <TouchableOpacity style={styles.sendButton} onPress={() => console.log('Send icon pressed')}>
//                     <Image source={require('../assets/icons/send.png')} style={styles.sendIcon} />
//                 </TouchableOpacity>
//           </View>
         
//         </View>
// );

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 5,
  },
  arrowleftbutton: {
    padding: 5,
    marginRight: 10,
  },
  arrowlefticon: {
    width: 24,
    height: 24,
    tintColor: '#333333',
  },
  headerUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: '#F3F8FE',
  },
  avatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  headerUserName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  messagesArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  messagesContainer: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  messageContainer: {
    marginVertical: 3,
  },
  currentUserContainer: {
    alignItems: 'flex-end',
  },
  otherUserContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 18,
    marginBottom: 2,
  },
  currentUserBubble: {
    backgroundColor: '#E3F2FD', // Màu xanh nhạt cho tin nhắn của mình
    borderBottomRightRadius: 5,
  },
  otherUserBubble: {
    backgroundColor: '#FFFFFF', // Màu trắng xám cho tin nhắn người khác
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  currentUserText: {
    color: '#1976D2',
  },
  otherUserText: {
    color: '#333333',
  },
  messageTime: {
    fontSize: 11,
    color: '#999999',
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#F8F8F8',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sendButton: {
    backgroundColor: '#196EEE',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  sendIcon: {
    width: 20,
    height: 20,
    tintColor: '#FFFFFF',
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyMessageContent: {
    alignItems: 'center',
    opacity: 0.7,
  },
  emptyAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 20,
    resizeMode: 'cover',
  },
  emptyMessageText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyMessageSubText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
});
