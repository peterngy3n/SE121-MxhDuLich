import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  Pressable,
  ScrollView,
  TouchableOpacity,
  Share,
  FlatList,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import React, { useEffect, useState } from "react";
import { NativeStackNavigatorProps } from "react-native-screens/lib/typescript/native-stack/types";
import { useRoute, RouteProp } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { DEFAULT_DP, GlobalStyles } from "../constants/Styles";
import CommentCard from "../components/Comments/CommentCard";
import { Path, Svg } from "react-native-svg";
import PressEffect from "../components/UI/PressEffect";
import { API_BASE_URL } from "../constants/config";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from "@/components/home/head/Header";
import Header2 from "@/components/Header2";

const { height, width } = Dimensions.get("window");

type RootStackParamList = {
  'post-detail-screen': { postId: string };
};

type PostDetailScreenRouteProp = RouteProp<RootStackParamList, 'post-detail-screen'>;

export default function PostDetailScreen({ navigation }: { navigation: NativeStackNavigatorProps }) {
  const route = useRoute<PostDetailScreenRouteProp>();
  const { postId } = route.params;
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [safeUri, setSafeUri] = useState<string>("");
  const [ratio, setRatio] = useState(1);
  const [resizeModeCover, setResizeModeCover] = useState(true);
  const [liked, setLiked] = useState(false);
  const [totalLikes, setTotalLikes] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState<boolean>(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: "Chi tiết bài viết",
      headerShown: false,
    });
    fetchPostDetail();
  }, []);

  const fetchPostDetail = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/posts/p/${postId}`);
      const result = await response.json();
      
      if (response.ok && result.isSuccess) {
        setPost(result.data);
        setTotalLikes(result.data?.stat?.reactCount || 0);
        
        // Kiểm tra trạng thái like của người dùng
        checkReactionStatus(result.data._id);
        
        // Load comments
        fetchComments(result.data._id);
      } else {
        Alert.alert("Lỗi", "Không thể tải bài viết");
      }
    } catch (error) {
      console.error('Error fetching post detail:', error);
      Alert.alert("Lỗi", "Đã có lỗi xảy ra, vui lòng thử lại sau");
    } finally {
      setLoading(false);
    }
  };

  const checkReactionStatus = async (postId: string) => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId || !postId) return;

      const response = await fetch(`${API_BASE_URL}/react/check?postId=${postId}&userId=${userId}`, {
        method: 'GET',
        credentials: 'include',
      });
      
      const data = await response.json();
      if (data.isSuccess && data.data.hasReacted) {
        setLiked(true);
      }
    } catch (error) {
      console.error('Error checking reaction status:', error);
    }
  };

  const fetchComments = async (postId: string) => {
    setLoadingComments(true);
    try {
      const response = await fetch(`${API_BASE_URL}/comment/post/${postId}`, {
        method: 'GET',
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (data.isSuccess) {
        setComments(data.data || []);
      } else {
        console.log('Không thể tải bình luận:', data.error);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const getSafeImageUrl = (url: string) => {
    if (!url) return "";
    if (url.includes("/upload/")) {
      return url.replace("/upload/", "/upload/f_jpg/");
    }
    return url;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // Return original if invalid date
      
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      return `${hours}:${minutes} ${day}/${month}/${year}`;
    } catch (error) {
      console.log("Date format error:", error);
      return dateString;
    }
  };

  useEffect(() => {
    if (post?.images) {
      const fixedUrl = getSafeImageUrl(post.images[0].url);
      setSafeUri(fixedUrl);
      Image.getSize(fixedUrl, (width, height) => {
        const ratio = width / height;
        if (ratio < 0.7) {
          setRatio(0.7);
        } else {
          setRatio(ratio);
        }
      });
    }
  }, [post]);

  const handleLike = async () => {
    // Cập nhật UI trước để có trải nghiệm mượt mà
    setTotalLikes((prevData: number) => (liked ? prevData - 1 : prevData + 1));
    setLiked(!liked);

    try {
      // Gọi API để tương tác với bài đăng
      const response = await fetch(`${API_BASE_URL}/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          postId: post?._id,
          type: "love"
        })
      });

      const data = await response.json();
      
      if (!data.isSuccess) {
        // Nếu API thất bại, hoàn tác thay đổi UI
        setTotalLikes((prevData: number) => (liked ? prevData + 1 : prevData - 1));
        setLiked(!liked);
        console.log('Lỗi khi tương tác với bài viết:', data.error);
      }
    } catch (error) {
      // Hoàn tác thay đổi UI nếu có lỗi
      setTotalLikes((prevData: number) => (liked ? prevData + 1 : prevData - 1));
      setLiked(!liked);
      console.log('Lỗi khi gọi API:', error);
    }
  };

  const handleSharePost = async () => {
    try {
      const postUrl = `${API_BASE_URL.replace('/api/v1', '')}/post/${post._id}`;
      const shareOptions = {
        title: 'Chia sẻ bài viết',
        message: `${post?.content?.substring(0, 100)}${post?.content?.length > 100 ? '...' : ''}\n\nXem bài viết tại: ${postUrl}`,
        url: post?.images?.[0]?.url,
      };

      const result = await Share.share(shareOptions);

      if (result.action === Share.sharedAction) {
        console.log('Shared successfully');
      }
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;
    
    setSubmittingComment(true);
    try {
      const response = await fetch(`${API_BASE_URL}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          postId: post?._id,
          content: commentText,
        })
      });

      const data = await response.json();
      
      if (data.isSuccess) {
        setCommentText("");
        // Refresh comments list
        fetchComments(post._id);
      } else {
        Alert.alert("Lỗi", data.error || "Không thể gửi bình luận");
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      Alert.alert("Lỗi", "Đã có lỗi xảy ra khi gửi bình luận");
    } finally {
      setSubmittingComment(false);
    }
  };

  // Lấy hashtags từ nội dung bài viết
  const getHashtags = () => {
    const hashtags = post?.hashTags || [];
    
    // Nếu bài viết không có hashtags, thử trích xuất từ nội dung
    if (hashtags.length === 0 && post?.content) {
      const regex = /#(\w+)/g;
      const matches = post.content.match(regex);
      if (matches) {
        return matches;
      }
    }
    
    return hashtags;
  };

  function PostHeader() {
    const [profilePic, setProfilePic] = useState(
      !!post?.authorId ? post?.authorId?.userAvatar?.url : DEFAULT_DP
    );
    
    return (
      <View style={{ alignSelf: "center", flexDirection: "row" }}>
        <Svg width={20} height={20} viewBox={`0 0 20 20`}>
          <Path
            d={`M0,0 L20,0 L20,20 A20,20 0 0,0 0,0 Z`}
            fill={GlobalStyles.colors.primary500}
          />
        </Svg>

        <View
          style={{
            backgroundColor: GlobalStyles.colors.primary500,
            padding: 5,
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <PressEffect>
              <Pressable
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Image
                  source={
                    profilePic
                      ? { uri: profilePic }
                      : {
                          uri: "https://t4.ftcdn.net/jpg/02/15/84/43/360_F_215844325_ttX9YiIIyeaR7Ne6EaLLjMAmy4GvPC69.jpg",
                        }
                  }
                  style={styles.story}
                />
                <View
                  style={{
                    marginLeft: 10,
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      fontWeight: "bold",
                      fontSize: 15,
                    }}
                  >
                  {post?.authorId?.userName ? post?.authorId?.userName : "User Name"}
                  </Text>
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.3)",
                      fontSize: 10,
                      fontWeight: "bold",
                    }}
                  >
                  </Text>
                </View>
              </Pressable>
            </PressEffect>
          </View>
        </View>
        <Svg width={20} height={20} viewBox={`0 0 20 20`}>
          <Path
            d={`M20,0 L0,0 L00,20 A0,0 0 0,1 20,0 Z`}
            fill={GlobalStyles.colors.primary500}
          />
        </Svg>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={GlobalStyles.colors.primary500} />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Không thể tải bài viết</Text>
        <TouchableOpacity style={styles.reloadButton} onPress={fetchPostDetail}>
          <Text style={styles.reloadText}>Tải lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <Header2 title="Chi tiết bài viết"/>
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.postContainer}>
          {/* Post Image */}
          <Pressable
            onPress={() => setResizeModeCover(!resizeModeCover)}
            style={styles.imageContainer}
          >
            <Image
              source={{ uri: getSafeImageUrl(post?.images?.[0]?.url) || post?.picturePath }}
              style={{
                width: "100%",
                aspectRatio: ratio,
                borderRadius: 15,
                resizeMode: resizeModeCover ? "cover" : "contain",
                backgroundColor: GlobalStyles.colors.primary500,
                borderWidth: 1,
                borderColor: GlobalStyles.colors.primary500,
              }}
            />
          </Pressable>

          {/* Post Stats & Actions */}
          <View style={styles.actionsContainer}>
            <View style={{ position: "absolute", left: 0, flexDirection: "row" }}>
              <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
                <Ionicons
                  name={liked ? "heart" : "heart-outline"}
                  size={25}
                  color={liked ? GlobalStyles.colors.greenLight : "black"}
                />
                <Text style={styles.actionText}>{totalLikes}</Text>
              </TouchableOpacity>
              <View style={styles.actionButton}>
                <Ionicons name="chatbubble-ellipses-outline" size={25} color="black" />
                <Text style={styles.actionText}>{comments?.length || 0}</Text>
              </View>
            </View>

            <PostHeader />

            <View style={{ position: "absolute", right: 0, flexDirection: "row" }}>
              <TouchableOpacity style={styles.actionButton} onPress={handleSharePost}>
                <Ionicons name="arrow-redo" size={25} color="black" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="bookmark-outline" size={25} color="black" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Location & Time */}
          <View style={styles.infoContainer}>
            <TouchableOpacity 
              onPress={() => post?.locationId?._id && navigation.navigate('detail-screen', { id: post.locationId._id })} 
              style={{ flexDirection: "row" }}
            >
              <Image style={{width: 20, height: 20}} source={require("../assets/icons/marker.png")} />
              <Text style={styles.locationText}>
                {post?.locationId?.name || "Không có địa điểm"}
              </Text>
            </TouchableOpacity>
            <Text style={styles.timeText}>
              {formatDate(post?.createdAt)}
            </Text>
          </View>

          {/* Hashtags */}
          <View style={styles.hashtagContainer}>
            {getHashtags().length > 0 && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hashtagScrollContainer}
              >
                {getHashtags().map((tag: string, index: number) => (
                  <View key={index} style={styles.hashtagItem}>
                    <Text style={styles.hashtagText}>
                      {tag.startsWith('#') ? tag : `#${tag}`}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Post Content */}
          {post?.content && (
            <Text style={styles.contentText}>
              {post.content}
            </Text>
          )}

          {/* Comments Section */}
          <View style={styles.commentsContainer}>
            <Text style={styles.commentsHeader}>Bình luận ({comments.length})</Text>
            <View style={styles.divider} />

            {loadingComments ? (
              <ActivityIndicator size="small" color={GlobalStyles.colors.primary500} />
            ) : comments.length === 0 ? (
              <Text style={styles.noCommentsText}>Chưa có bình luận nào</Text>
            ) : (
              comments.map((comment) => (
                <CommentCard key={comment._id} comment={comment} onReply={function (): void {
                  throw new Error("Function not implemented.");
                } } />
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Comment Input */}
      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="Viết bình luận..."
          value={commentText}
          onChangeText={setCommentText}
          multiline
        />
        <TouchableOpacity 
          style={[
            styles.sendButton, 
            { opacity: commentText.trim() ? 1 : 0.5 }
          ]} 
          onPress={submitComment}
          disabled={!commentText.trim() || submittingComment}
        >
          <Ionicons 
            name={submittingComment ? "hourglass-outline" : "send"} 
            size={24} 
            color="white" 
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "red",
    marginBottom: 16,
  },
  reloadButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: GlobalStyles.colors.primary500,
    borderRadius: 5,
  },
  reloadText: {
    color: "white",
    fontSize: 16,
  },
  scrollContainer: {
    flex: 1,
  },
  postContainer: {
    backgroundColor: GlobalStyles.colors.primary300,
    margin: 10,
    borderRadius: 25,
    padding: 15,
  },
  imageContainer: {
    width: "100%",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },
  actionButton: {
    margin: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  actionText: {
    color: "black",
    fontWeight: "600",
    marginLeft: 3,
  },
  infoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    paddingHorizontal: 5,
  },
  locationText: {
    color: "gray",
    fontSize: 14,
    fontWeight: "300",
    marginLeft: 5,
  },
  timeText: {
    color: "gray",
    fontSize: 12,
    fontWeight: "300",
  },
  hashtagContainer: {
    marginTop: 15,
  },
  hashtagScrollContainer: {
    paddingHorizontal: 5,
  },
  hashtagItem: {
    backgroundColor: GlobalStyles.colors.primary200,
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 5,
  },
  hashtagText: {
    color: GlobalStyles.colors.primary700,
    fontWeight: "500",
  },
  contentText: {
    color: "black",
    paddingHorizontal: 5,
    paddingTop: 15,
    lineHeight: 22,
  },
  commentsContainer: {
    marginTop: 20,
  },
  commentsHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: GlobalStyles.colors.primary200,
    marginBottom: 15,
  },
  noCommentsText: {
    color: "gray",
    textAlign: "center",
    padding: 20,
  },
  commentInputContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    alignItems: "center",
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: GlobalStyles.colors.primary500,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  story: {
    width: 35,
    height: 35,
    borderRadius: 50,
  },
});