import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { GlobalStyles } from "../../constants/Styles";

interface CommentCardProps {
  comment: {
    _id: string;
    content: string;
    createdAt: string;
    userId: {
      _id: string;
      userName: string;
      userAvatar?: {
        url: string;
      };
    };
    images?: Array<{url: string}>;
    parentId?: string | null;
  };
  onReply: () => void;
}

function CommentCard({ comment, onReply }: CommentCardProps) {
      const [safeUri, setSafeUri] = useState<string>("");
      const [ratio, setRatio] = useState(1);
  // Format thời gian tương đối
  const getTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      // Chuyển đổi thời gian thành định dạng tương đối
      if (diffInSeconds < 60) {
        return "Vừa xong";
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} phút trước`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} giờ trước`;
      } else if (diffInSeconds < 2592000) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} ngày trước`;
      } else if (diffInSeconds < 31536000) {
        const months = Math.floor(diffInSeconds / 2592000);
        return `${months} tháng trước`;
      } else {
        const years = Math.floor(diffInSeconds / 31536000);
        return `${years} năm trước`;
      }
    } catch (error) {
      return "Vừa xong";
    }
  };

  const getSafeImageUrl = (url: string) => {
    if (!url) return "";
    if (url.includes("/upload/")) {
      return url.replace("/upload/", "/upload/f_jpg/");
    }
    return url;
  };

          // useEffect(() => {
          //   if (comment.images) {
          //     const fixedUrl = getSafeImageUrl(comment.images[0].url);
          //     setSafeUri(fixedUrl);
          //     Image.getSize(fixedUrl, (width, height) => {
          //       const ratio = width / height;
          //       if (ratio < 0.7) {
          //         setRatio(0.7);
          //       } else {
          //         setRatio(ratio);
          //       }
          //     });
          //   }
          // }, [comment]);
  
  // Lấy avatar người dùng hoặc avatar mặc định
  const getAvatarUrl = () => {
    if (comment.userId?.userAvatar?.url) {
      return { uri: comment.userId.userAvatar.url };
    }
    return require('../../assets/no-photo.jpg');
  };

  // Check if this is a reply comment
  const isReply = comment.parentId != null;

  return (
    <View style={[styles.container, isReply && styles.replyContainer]}>
      <View style={{ flexDirection: "row" }}>
        <Image
          source={getAvatarUrl()}
          style={{
            width: 50,
            height: 50,
            resizeMode: "cover",
            borderRadius: 50,
          }}
        />
        <View
          style={{
            flex: 1,
            marginHorizontal: 20,
            justifyContent: "center",
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontWeight: "bold", fontSize: 14, color: "black", marginBottom: 5 }}>
              {comment.userId?.userName || "Người dùng"}
            </Text>
            <Text
              style={{
                fontSize: 10,
                color: GlobalStyles.colors.primary500,
              }}
            >
              {getTimeAgo(comment?.createdAt)}
            </Text>
          </View>
          
          <Text style={{ fontSize: 14, color: "black" }}>
            {comment.content}
          </Text>
          
          {comment.images && comment.images.length > 0 && (
            <Image 
              source={{ uri: getSafeImageUrl(comment?.images?.[0]?.url) }}
              style={{
                width: '100%',
                height: 150,
                borderRadius: 10,
                marginTop: 10,
                resizeMode: 'cover'
              }}
            />
          )}

          {/* Reply button */}
          <View style={styles.actionContainer}>
            <TouchableOpacity 
              style={styles.replyButton}
              onPress={onReply}
            >
              <Ionicons name="return-down-back-outline" size={16} color={GlobalStyles.colors.primary500} />
              <Text style={styles.replyButtonText}>Trả lời</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

export default CommentCard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: GlobalStyles.colors.primary300,
    borderRadius: 20,
    marginHorizontal: 10,
    marginVertical: 5,
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  replyContainer: {
    marginLeft: 40, // Indent replies
    backgroundColor: GlobalStyles.colors.primary200, // Different background for replies
  },
  actionContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 10,
  },
  replyButtonText: {
    fontSize: 12,
    color: GlobalStyles.colors.primary500,
    marginLeft: 5,
  },
});
