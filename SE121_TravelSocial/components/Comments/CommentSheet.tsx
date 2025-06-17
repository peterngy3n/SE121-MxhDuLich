import React, { useRef, useEffect, useState } from "react";
import { 
  View, 
  FlatList, 
  Text, 
  ActivityIndicator, 
  TextInput, 
  TouchableOpacity, 
  Keyboard, 
  Image, 
  Alert,
  StyleSheet 
} from "react-native";
import ActionSheet, { ActionSheetRef } from "react-native-actions-sheet";
import { GlobalStyles } from "../../constants/Styles";
import CommentCard from "./CommentCard";
import { API_BASE_URL } from "../../constants/config";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

interface CommentSheetProps {
  visible: boolean;
  setVisible: (value: boolean) => void;
  postId?: string; // Thêm prop postId để xác định bài viết cần lấy comment
}

function CommentSheet({ visible, setVisible, postId }: CommentSheetProps) {
    const actionSheetRef = useRef<ActionSheetRef>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [commentText, setCommentText] = useState<string>('');
    const [postingComment, setPostingComment] = useState<boolean>(false);
    const [image, setImage] = useState<string | null>(null);
    const [uploading, setUploading] = useState<boolean>(false);
    // New state for reply functionality
    const [replyTo, setReplyTo] = useState<{id: string, userName: string} | null>(null);
    useEffect(() => {
    if (visible) {
      actionSheetRef.current?.show();  // ✅ Dùng show() thay vì setModalVisible(true)
      fetchComments();
    } else {
      actionSheetRef.current?.hide();  // ✅ Dùng hide() thay vì setModalVisible(false)
    }
  }, [visible, postId]);

  // Organize comments into threads with parent and child comments
  const organizeComments = (comments: any[]) => {
    const parentComments: any[] = [];
    const childComments: Record<string, any[]> = {};

    // First pass: separate parents and children
    comments.forEach(comment => {
      if (!comment.parentId) {
        // This is a parent comment (top-level)
        parentComments.push({...comment, replies: []});
      } else {
        // This is a child comment (reply)
        if (!childComments[comment.parentId]) {
          childComments[comment.parentId] = [];
        }
        childComments[comment.parentId].push(comment);
      }
    });

    // Second pass: attach children to their parents
    parentComments.forEach(parent => {
      if (childComments[parent._id]) {
        parent.replies = childComments[parent._id];
      }
    });

    return parentComments;
  };
  const fetchComments = async () => {
    if (!postId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/comment/post/${postId}`, {
        method: 'GET',
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (data.isSuccess) {
        // Organize comments into threads
        const organizedComments = organizeComments(data.data || []);
        setComments(organizedComments);
      } else {
        setError(data.error || 'Không thể tải bình luận');
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Đã xảy ra lỗi khi tải bình luận');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Cần quyền truy cập', 'Bạn cần cấp quyền truy cập thư viện ảnh để đính kèm hình ảnh.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (result.canceled) {
        return;
      }

      if (result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
    }
  };

  // Get filename and type from URI
  const getFilename = (uri: string) => {
    const uriParts = uri.split('/');
    const name = uriParts[uriParts.length - 1];
    const fileType = name.split('.').pop();
    return { name, fileType };
  };

  // Set up the reply to a comment
  const handleReply = (commentId: string, userName: string) => {
    setReplyTo({ id: commentId, userName: userName });
    // Focus on the comment input
    Keyboard.dismiss();
    setTimeout(() => {
      // Small delay to ensure the keyboard appears after setting state
      setCommentText(`@${userName} `);
    }, 100);
  };

  // Cancel replying
  const cancelReply = () => {
    setReplyTo(null);
    setCommentText('');
  };
  const renderItem = ({ item }: { item: any }) => {
    return (
      <View>
        {/* Render parent comment */}
        <CommentCard 
          comment={item} 
          onReply={() => handleReply(item._id, item.userId?.userName || 'Unknown')}
        />
        
        {/* Render replies */}
        {item.replies && item.replies.length > 0 && 
          item.replies.map((reply: any) => (
            <CommentCard
              key={reply._id}
              comment={reply}
              onReply={() => handleReply(reply._id, reply.userId?.userName || 'Unknown')}
            />
          ))
        }
      </View>
    );
  };

  const postComment = async () => {
    if (!postId || !commentText.trim()) return;
    
    setPostingComment(true);
    
    try {
      let imageData = null;
      
      // Bước 1: Upload ảnh nếu có
      if (image) {
        try {
          setUploading(true);
          const formData = new FormData();
          const fileInfo = getFilename(image);
          
          formData.append("files", {
            uri: image,
            type: `image/${fileInfo.fileType}`,
            name: fileInfo.name,
          } as any);
          
          // Gọi API để upload ảnh
          const uploadResponse = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            credentials: 'include',
            body: formData,
          });

          const uploadResult = await uploadResponse.json();
          
          if (!uploadResult.isSuccess) {
            throw new Error(typeof uploadResult.error === 'string' 
              ? uploadResult.error 
              : "Không thể tải lên hình ảnh");
          }
          
          // Lấy data về ảnh đã upload thành công
          imageData = uploadResult.data;
          console.log("Upload result:", imageData);
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError);
          Alert.alert("Lỗi", "Không thể tải lên hình ảnh");
          setPostingComment(false);
          setUploading(false);
          return; // Dừng hàm tại đây nếu upload thất bại
        } finally {
          setUploading(false);
        }
      }
      
      // Bước 2: Tạo bình luận
      const commentData: any = {
        postId: postId,
        content: commentText.trim(),
      };
      
      // Add parentId if replying to a comment
      if (replyTo) {
        commentData.parentId = replyTo.id;
      }
      
      // Thêm hình ảnh vào bình luận nếu có
      if (imageData && imageData.length > 0) {
        commentData.images = imageData;
      }

      const response = await fetch(`${API_BASE_URL}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commentData),
        credentials: 'include',
      });
      
      const data = await response.json();
        if (data.isSuccess) {
        setCommentText('');
        setImage(null);
        setReplyTo(null); // Reset reply state
        
        // Refresh comments to show the new one
        fetchComments();
        
        Keyboard.dismiss();
      } else {
        console.error('Error posting comment:', data.error);
        setError(data.error || 'Không thể đăng bình luận');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      setError('Đã xảy ra lỗi khi đăng bình luận');
    } finally {
      setPostingComment(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ActionSheet
        ref={actionSheetRef}
        containerStyle={{
          backgroundColor: GlobalStyles.colors.primary,
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          height: '90%',
          //minHeight: 900, 
        }}
        indicatorStyle={{
          width: 50,
          marginVertical: 10,
          backgroundColor: "white",
        }}
        gestureEnabled={true}
        onClose={() => setVisible(false)}
      >        {loading ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={GlobalStyles.colors.primary500} />
          </View>
        ) : error ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: 'red' }}>{error}</Text>
          </View>
        ) : comments.length === 0 ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: GlobalStyles.colors.gray }}>Chưa có bình luận nào</Text>
          </View>
        ) : (
          <FlatList
            keyExtractor={(item) => item._id || Math.random().toString()}
            data={comments}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 10 }}
            inverted={false} // Make sure comments appear in chronological order
          />
        )}<View style={{ 
            
          flexDirection: "column", 
          marginHorizontal: 10,
          paddingVertical: 10,
          borderTopWidth: 1,
          borderTopColor: GlobalStyles.colors.gray,
          backgroundColor: GlobalStyles.colors.primary,
          paddingBottom: 20, // Give extra space at bottom for input field
        }}>
          {/* Reply Indicator */}
          {replyTo && (
            <View style={styles.replyIndicator}>
              <Text style={styles.replyText}>
                Đang trả lời <Text style={styles.replyName}>{replyTo.userName}</Text>
              </Text>
              <TouchableOpacity onPress={cancelReply} style={styles.cancelReply}>
                <Ionicons name="close-circle" size={20} color={GlobalStyles.colors.primary500} />
              </TouchableOpacity>
            </View>
          )}

          {/* Selected Image Preview */}
          {image && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: image }} style={styles.imagePreview} />
              <TouchableOpacity 
                style={styles.removeImageButton} 
                onPress={() => setImage(null)}
              >
                <MaterialIcons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>
          )}

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity 
              onPress={pickImage}
              style={styles.attachButton}
            >
              <Ionicons name="image-outline" size={24} color={GlobalStyles.colors.primary500} />
            </TouchableOpacity>

            <TextInput
              style={{
                flex: 1,
                borderWidth: 1,
                borderRadius: 20,
                borderColor: GlobalStyles.colors.gray,
                paddingHorizontal: 15,
                paddingVertical: 8,
                marginRight: 10,
                backgroundColor: GlobalStyles.colors.gray100,
              }}
              placeholder={replyTo ? `Trả lời ${replyTo.userName}...` : "Viết bình luận.."}
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <TouchableOpacity 
              onPress={postComment}
              disabled={postingComment || (!commentText.trim() && !image)}
              style={{
                backgroundColor: (commentText.trim() || image) 
                  ? GlobalStyles.colors.primary500 
                  : GlobalStyles.colors.gray,
                borderRadius: 25,
                padding: 10,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {postingComment || uploading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="send" size={20} color="white" />
              )}            </TouchableOpacity>
          </View>
        </View>
      </ActionSheet>

    </View>
  );
}

const styles = StyleSheet.create({
  imagePreviewContainer: {
    position: 'relative',
    width: '100%',
    height: 120,
    marginTop: 10,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: GlobalStyles.colors.gray100,
    marginBottom: 10,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachButton: {
    marginRight: 10,
    padding: 5,
  },
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: GlobalStyles.colors.gray100,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 10,
  },  replyText: {
    fontSize: 12,
    color: '#5D5D5D', // Using direct color instead of GlobalStyles.colors.gray700
  },
  replyName: {
    fontWeight: 'bold',
    color: GlobalStyles.colors.primary500,
  },
  cancelReply: {
    padding: 2,
  },
});

export default CommentSheet;
