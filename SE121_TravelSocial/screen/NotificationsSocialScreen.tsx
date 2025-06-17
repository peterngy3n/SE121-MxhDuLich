import { StyleSheet, Text, View, FlatList, RefreshControl, ActivityIndicator, Alert } from "react-native";
import { useEffect, useState, useCallback } from "react";
import NotificationCard from "../components/NotificationsSocialScreen/NotificationCard";
import { Ionicons } from "@expo/vector-icons";
import SettingsIcon from "../components/AnimatedUi/SettingsIcon";
import { GlobalStyles } from "../constants/Styles";
import { StatusBar } from "expo-status-bar";
import React from "react";
import Header2 from "@/components/Header2";
import { API_BASE_URL } from "@/constants/config";
import { useUser } from '@/context/UserContext';
import { useSocket } from '@/context/SocketContext';

// Định nghĩa kiểu dữ liệu cho thông báo
interface Notification {
  _id: string;
  type: "LIKE" | "COMMENT" | "FOLLOW" | "FRIEND_REQUEST";
  sender: {
    _id: string;
    userName: string;
    userAvatar?: {
      url: string;
    }
  };
  recipient: string;
  createdAt: string;
  read: boolean;
  status?: string;
  postId?: string;
  postImage?: string;
}

export default function NotificationsScreen({ navigation, route }: any) {
  const { userId } = useUser();
  const { onNotification } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Lấy thông báo từ API
  const fetchNotifications = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/notifications`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Không thể lấy thông báo');
      }

      const data = await response.json();
      console.log('Notifications data:', data);
      
      if (data.isSuccess) {
        setNotifications(data.data);
      } else {
        console.error('API error:', data.error);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Xử lý khi người dùng chấp nhận lời mời kết bạn
  const handleAcceptFriendRequest = async (notificationId: string, senderId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/respond-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationId,
          requestId: senderId,
          accept: true
        }),
        credentials: 'include',
      });

      const data = await response.json();
      
      if (response.ok) {
        Alert.alert('Thành công', 'Đã chấp nhận lời mời kết bạn');
        // Cập nhật lại danh sách thông báo
        fetchNotifications();
      } else {
        Alert.alert('Lỗi', data.error || 'Không thể chấp nhận lời mời kết bạn');
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi xử lý yêu cầu');
    }
  };

  // Xử lý khi người dùng từ chối lời mời kết bạn
  const handleRejectFriendRequest = async (notificationId: string, senderId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/respond-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationId,
          requestId: senderId,
          accept: false
        }),
        credentials: 'include',
      });

      const data = await response.json();
      
      if (response.ok) {
        Alert.alert('Thành công', 'Đã từ chối lời mời kết bạn');
        // Cập nhật lại danh sách thông báo
        fetchNotifications();
      } else {
        Alert.alert('Lỗi', data.error || 'Không thể từ chối lời mời kết bạn');
      }
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi xử lý yêu cầu');
    }
  };

  // Hàm refresh khi kéo xuống để làm mới
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [userId]);

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
      title: "Thông báo",
      headerRight: () => {
        return (
          <View style={{ marginRight: 20 }}>
            <SettingsIcon onPress={() => {}} />
          </View>
        );
      },
    });
  }, []);

  // Lắng nghe notification realtime
  useEffect(() => {
    if (!onNotification) return;
    const handleRealtimeNotification = (data: any) => {
      if (data && data.notification) {
        setNotifications(prev => [data.notification, ...prev]);
      }
    };
    onNotification(handleRealtimeNotification);
    // Không cần cleanup vì context đã xử lý
  }, [onNotification]);

  // Render từng thông báo tùy theo loại
  const renderItem = ({ item }: { item: Notification }) => (
    <NotificationCard 
      mode={item.type}
      data={item}
      onAccept={() => handleAcceptFriendRequest(item._id, item.sender._id)}
      onReject={() => handleRejectFriendRequest(item._id, item.sender._id)}
    />
  );

  return (
    <View style={styles.container}>
      <Header2 title="Thông báo" />
      <StatusBar backgroundColor={GlobalStyles.colors.primary} />

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={GlobalStyles.colors.primary500} />
        </View>
      ) : notifications.length > 0 ? (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color="gray" />
          <Text style={styles.emptyText}>Không có thông báo nào</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: GlobalStyles.colors.primary 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    marginTop: 10,
    color: 'gray',
    fontSize: 16,
  }
});
