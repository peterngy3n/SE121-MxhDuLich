import { Image, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import React from "react";
import { USERS } from "../../data/users";
import { GlobalStyles } from "../../constants/Styles";
import { Ionicons } from "@expo/vector-icons";
import Button from "../Button";
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface NotificationCardProps {
  mode: "LIKE" | "COMMENT" | "FOLLOW" | "FRIEND_REQUEST";
  data?: {
    _id: string;
    sender: {
      _id: string;
      userName: string;
      userAvatar?: {
        url: string;
      };
    };
    createdAt: string;
    status?: string;
    postId?: {
    _id: string;
    title?: string;
    content?: string;
    images?: Array<{ url: string }>;
    }
    postImage?: string;
  };
  onAccept?: () => void;
  onReject?: () => void;
  onPress?: () => void; // Thêm prop onPress
}

export default function NotificationCard({ mode = "LIKE", data, onAccept, onReject, onPress }: NotificationCardProps) {
    // Format thời gian
    const formatTime = (timeString: string) => {
      try {
        const date = new Date(timeString);
        return formatDistanceToNow(date, { addSuffix: true, locale: vi });
      } catch (error) {
        return "Vừa xong";
      }
    };

    // Nếu có dữ liệu thực, hiển thị dữ liệu đó
    if (data) {
        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={onPress}
                disabled={!onPress}
                style={styles.container}
            >
                <View style={{ flexDirection: "row", width: mode === "FRIEND_REQUEST" ? "50%" : "70%" }}>
                    <Image
                        source={{ 
                            uri: data.sender?.userAvatar?.url || 
                                 'https://www.pngitem.com/pimgs/m/146-1468479_my-profile-icon-blank-profile-picture-circle-hd.png' 
                        }}
                        style={styles.avatar}
                    />
                    
                    <View style={{ marginHorizontal: 20, justifyContent: "space-between" }}>
                        <View style={{ marginBottom: 10 }}>
                            <Text style={styles.userName}>
                                {data.sender?.userName || "Người dùng"}
                            </Text>
                            <Text style={styles.actionText}>
                                {mode === "LIKE" && "đã thích ảnh của bạn"}
                                {mode === "COMMENT" && "đã bình luận về ảnh của bạn"}
                                {mode === "FOLLOW" && "đã bắt đầu theo dõi bạn"}
                                {mode === "FRIEND_REQUEST" && "đã gửi lời mời kết bạn"}
                            </Text>
                        </View>

                        <Text style={styles.timeText}>{formatTime(data.createdAt)}</Text>
                    </View>
                </View>
                
                {(mode === "LIKE" || mode === "COMMENT") && data.postImage && (
                    <View style={{ width: "20%", height: 80 }}>
                        <Image
                            source={{ uri: data.postImage }}
                            style={styles.postImage}
                        />
                        <View style={styles.iconContainer}>
                            <Ionicons
                                name={mode === "LIKE" ? "heart" : "chatbubble-ellipses"}
                                size={12}
                                color={GlobalStyles.colors.blue}
                            />
                        </View>
                    </View>
                )}

                {mode === "FRIEND_REQUEST" && (
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity 
                            style={styles.acceptButton}
                            onPress={onAccept}
                        >
                            <Text style={styles.buttonText}>Chấp nhận</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.rejectButton}
                            onPress={onReject}
                        >
                            <Text style={styles.buttonText}>Từ chối</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </TouchableOpacity>
        );
    }

    // Fallback cho các thông báo mẫu (demo)
    return (
        <View style={styles.container}>
            <View style={{ flexDirection: "row", width: "70%" }}>
                <Image
                    source={{ uri: USERS[1].image }}
                    style={styles.avatar}
                />
                
                <View style={{ marginHorizontal: 20, justifyContent: "space-between" }}>
                    <View style={{ marginBottom: 10 }}>
                        <Text style={styles.userName}>
                            John Doe
                        </Text>
                        <Text style={styles.actionText}>
                            {mode === "LIKE" && "đã thích ảnh của bạn"}
                            {mode === "COMMENT" && "đã bình luận về ảnh của bạn"}
                            {mode === "FOLLOW" && "đã bắt đầu theo dõi bạn"}
                            {mode === "FRIEND_REQUEST" && "đã gửi lời mời kết bạn"}
                        </Text>
                    </View>

                    <Text style={styles.timeText}>2 phút trước</Text>
                </View>
            </View>
            {(mode === "LIKE" || mode === "COMMENT") && (
                <View style={{ width: "20%", height: 80 }}>
                    <Image
                        source={{ uri: USERS[1].stories[0] }}
                        style={styles.postImage}
                    />
                    <View style={styles.iconContainer}>
                        <Ionicons
                            name={mode === "LIKE" ? "heart" : "chatbubble-ellipses"}
                            size={12}
                            color={GlobalStyles.colors.blue}
                        />
                    </View>
                </View>
            )}
            
            {mode === "FRIEND_REQUEST" && (
                <View style={styles.buttonContainer}>
                    <TouchableOpacity 
                        style={styles.acceptButton}
                        onPress={onAccept}
                    >
                        <Text style={styles.buttonText}>Chấp nhận</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.rejectButton}
                        onPress={onReject}
                    >
                        <Text style={styles.buttonText}>Từ chối</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        backgroundColor: "#E7E9F3",
        borderRadius: 20,
        marginHorizontal: 10,
        marginVertical: 5,
        padding: 15,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    avatar: {
        width: 50,
        height: 50,
        resizeMode: "cover",
        borderRadius: 50,
    },
    userName: {
        fontWeight: "bold", 
        fontSize: 18, 
        color: "black"
    },
    actionText: {
        fontSize: 14,
        color: GlobalStyles.colors.purple
    },
    timeText: {
        fontSize: 12,
        color: "gray"
    },
    postImage: {
        flex: 1,
        resizeMode: "cover",
        borderRadius: 10,
    },
    iconContainer: {
        backgroundColor: "white",
        borderRadius: 50,
        padding: 3,
        position: "absolute",
        right: -5,
        top: -5,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '45%'
    },
    acceptButton: {
        backgroundColor: GlobalStyles.colors.blue,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        marginRight: 5,
    },
    rejectButton: {
        backgroundColor: GlobalStyles.colors.red,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    buttonText: {
        color: 'white',
        fontWeight: '500',
    }
});
