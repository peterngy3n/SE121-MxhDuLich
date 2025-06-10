import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, Image, TouchableOpacity, TextInput, ScrollView, Alert, Platform, ActivityIndicator, FlatList } from 'react-native';
import { NativeStackNavigatorProps } from 'react-native-screens/lib/typescript/native-stack/types';
import axios from 'axios';
import { API_BASE_URL } from '@/constants/config';
import { useUser } from '@/context/UserContext';
import io, { Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSocket } from '@/context/SocketContext';

interface Conversation {
  _id: string;
  name: string;
  lastMessage: string;
  avatar?: string; // URL ảnh đại diện, có thể không có
  timestamp: string;
  unreadCount?: number;
}

export default function ChatBoardScreen({ navigation }: {navigation: NativeStackNavigatorProps}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bearerToken, setBearerToken] = useState<string>('');
  const { socket, isConnected, joinUserRoom, initializeSocket } = useSocket();
  const { userId } = useUser(); // Lấy userId từ context
  //const userId = "671a02c2c0202050e0969548"
  
  useEffect(() => {
    const setupSocket = async () => {
      // Đảm bảo socket được khởi tạo nếu chưa có
      if (!socket) {
        await initializeSocket();
      }
    };

    setupSocket();
  }, []);
  
  useEffect(() => {
    // Fetch conversations
    const fetchConversations = async () => {
      setLoading(true);
      try {
        console.log("User ID:", userId);
        const response = await axios.get(`${API_BASE_URL}/conversation/${userId}`); 
        setConversations(response.data.data || []);
        console.log("Hội thoại:", response.data.data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Đã xảy ra lỗi');
        console.error("Lỗi fetch hội thoại:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  // Join user room khi socket connect
  useEffect(() => {
    if (isConnected && socket) {
      joinUserRoom(userId ? userId : '');
    }
  }, [isConnected, socket]);

  // Lắng nghe tin nhắn mới
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (messageData: any) => {
      console.log('Nhận tin nhắn mới:', messageData);
      
      setConversations(prevConversations => {
        const updatedConversations = [...prevConversations];
        
        const conversationIndex = updatedConversations.findIndex(
          conv => conv._id === messageData.conversationId
        );
        
        if (conversationIndex !== -1) {
          const updatedConversation = {
            ...updatedConversations[conversationIndex],
            lastMessage: messageData.content || messageData.message,
            timestamp: new Date().toLocaleTimeString('vi-VN', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            unreadCount: (updatedConversations[conversationIndex].unreadCount || 0) + 1
          };
          
          updatedConversations.splice(conversationIndex, 1);
          return [updatedConversation, ...updatedConversations];
        } else {
          // Fetch lại nếu là conversation mới
          return prevConversations;
        }
      });
    };

    socket.on('new message', handleNewMessage);

    return () => {
      socket.off('new message', handleNewMessage);
    };
  }, [socket]);

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity 
        onPress={() => navigation.navigate('chat-screen', { conversationId: item._id, userName: item.name })} // Truyền ID hoặc thông tin cần thiết
        style={styles.conversationItem}
    >
      <View style={styles.avatarContainer}>
          {item.avatar ? (
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
              // Ảnh mặc định nếu không có avatarUrl
              <Image source={require('../assets/images/avt.png')} style={styles.avatar} /> 
          )}
      </View>
      <View style={styles.conversationTextContainer}>
          <Text style={styles.conversationUserName}>{item.name}</Text>
          <Text style={styles.conversationLastMessage} numberOfLines={1} ellipsizeMode='tail'>
              {item.lastMessage}
          </Text>
      </View>
      <View style={styles.conversationMetaContainer}>
          <Text style={styles.conversationTimestamp}>{item.timestamp}</Text>
          {item.unreadCount && item.unreadCount > 0 && (
              <View style={styles.numberCircle}>
                  <Text style={styles.unreadCountText}>{item.unreadCount}</Text>
              </View>
          )}
      </View>
    </TouchableOpacity>
  );

if (loading) {
    return (
        <View style={[styles.container, styles.centerContent]}>
            <ActivityIndicator size="large" color="#196EEE" />
            <Text>Đang tải danh sách hội thoại...</Text>
        </View>
    );
}

if (error) {
    return (
        <View style={[styles.container, styles.centerContent]}>
            <Text style={styles.errorText}>Lỗi: {error}</Text>
            <TouchableOpacity onPress={() => { /* Logic để thử lại */ }}>
                <Text style={styles.retryButton}>Thử lại</Text>
            </TouchableOpacity>
        </View>
    );
}

  return (
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.arrowleftbutton} onPress={() => navigation.goBack()}>
              <Image source={require('../assets/icons/exit.png')} style={styles.arrowlefticon} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Chat</Text>
          </View>

          <View style = {{alignItems:'center', width:'100%'}}>
                <View style={styles.search}>
                    <TouchableOpacity onPress={() => console.log('Search icon pressed')}>
                        <Image source={require('../assets/icons/Search.png')} style={styles.icon} />
                    </TouchableOpacity>                   
                    <TextInput
                        style={styles.input}
                        placeholder="Tìm kiếm"
                        placeholderTextColor="#000000"
                    />
                </View>
            </View>
            {conversations.length === 0 && !loading ? (
                <View style={[styles.container, styles.centerContent]}>
                    <Text>Không có hội thoại nào.</Text>
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    renderItem={renderConversationItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            )}
            
            {/* <TouchableOpacity onPress={()=>navigation.navigate('chat-screen')} style ={{flexDirection:'row', alignItems:'center', alignContent:'center',justifyContent:'center', marginTop:20,}}>

                <View style={styles.avatarContainer}>
                    <Image source={require('../assets/images/avt.png')} style={styles.avatar} />
                </View>
                <View style={{width:'60%'}}>
                    <Text style={{fontSize:18,fontWeight:'bold',}}>Ho Coc camping Vung Tau</Text>
                    <Text style={{opacity:0.8,marginTop:5,}} numberOfLines={1} ellipsizeMode='tail'>Địa điểm rất tuyệt vời, sdsdsdfsdf tôi rất thích, cảm ơn rất nhiều.</Text>
                </View>
                <View style={{marginLeft:20,}}>
                    <Text style ={{opacity:0.8,}}>26/3</Text>
                    <View style={styles.numberCircle}>
                        <Text style={{color:'white'}}>1</Text>
                    </View>
                </View>
            </TouchableOpacity> */}
        </View>
);
}

const styles = StyleSheet.create({
  // ... (các style hiện có của bạn) ...
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centerContent: { // Style để căn giữa nội dung (loading, error, no data)
      justifyContent: 'center',
      alignItems: 'center',
  },
  errorText: {
      color: 'red',
      fontSize: 16,
      marginBottom: 10,
  },
  retryButton: {
      color: '#196EEE',
      fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  //   marginBottom: 30, // Có thể điều chỉnh hoặc bỏ nếu dùng FlatList
    width:'100%',
    position: 'relative',
    backgroundColor: '#ffffff', 
    paddingHorizontal:100, // Xem xét lại padding này nếu tiêu đề không căn giữa đúng
    paddingVertical: Platform.OS === 'ios' ? 50 : 20, // Điều chỉnh padding cho header
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2, // Giảm shadow
    },
    shadowOpacity: 0.1, // Giảm shadow
    shadowRadius: 2,  // Giảm shadow
    elevation: 5,     // Giảm shadow
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  arrowleftbutton: {
      position: 'absolute',
      left: 15, // Tăng khoảng cách từ mép
      top: Platform.OS === 'ios' ? 45 : 18, // Điều chỉnh vị trí nút back
      zIndex: 1,
    },
    arrowlefticon: {
      width: 24, // Tăng kích thước icon
      height: 24, // Tăng kích thước icon
    },
  search: {
      marginTop: 15, // Thêm khoảng cách trên
      marginBottom: 15, // Thêm khoảng cách dưới
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 24,
      paddingHorizontal: 15, // Tăng padding
      paddingVertical: Platform.OS === 'ios' ? 12 : 8, // Điều chỉnh padding cho input
      backgroundColor: '#F3F8FE',
      width: '90%',
  },
  input: {
      flex: 1,
      height: 40,
      color: '#000000',
      fontSize: 16, // Tăng kích thước chữ
  },
  icon: {
      width: 20, 
      height: 20, 
      marginRight: 10,
      // color:'black', // Image không có thuộc tính color, nếu là icon font thì dùng tintColor
    },
  conversationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#EEEEEE',
  },
  avatarContainer: {
      width: 50, // Giảm kích thước avatar một chút
      height: 50,
      borderRadius: 25,
      marginRight:15,
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F3F8FE', 
  },
  avatar: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover', 
  },
  conversationTextContainer: {
      flex: 1, // Để chiếm không gian còn lại
  },
  conversationUserName: {
      fontSize: 16, // Điều chỉnh font
      fontWeight: 'bold',
  },
  conversationLastMessage: {
      fontSize: 14, // Điều chỉnh font
      color: '#666666', // Màu cho tin nhắn cuối
      marginTop: 3,
  },
  conversationMetaContainer: {
      alignItems: 'flex-end', // Căn phải các item trong này
      marginLeft: 10,
  },
  conversationTimestamp: {
      fontSize: 12,
      color: '#999999',
  },
  numberCircle: {
      minWidth: 20, // Để số lớn hơn vẫn vừa
      height: 20,
      borderRadius: 10,
      backgroundColor: '#196EEE', 
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 5, 
      paddingHorizontal: 5, // Thêm padding ngang cho số lớn
  },
  unreadCountText: {
      color: 'white',
      fontSize: 12,
      fontWeight: 'bold',
  }
});
