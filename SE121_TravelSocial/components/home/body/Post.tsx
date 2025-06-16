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
  } from "react-native";
  import React, { useContext, useEffect, useState } from "react";
  import Ionicons from "@expo/vector-icons/Ionicons";
  import { useNavigation } from "@react-navigation/native";
  import { DEFAULT_DP, GlobalStyles } from "../../../constants/Styles";
  import CommentSheet from "../../Comments/CommentSheet";
  // import { timeDifference } from "../../../utils/helperFunctions";
  //import { AuthContext } from "../../../store/auth-context";
  import { Path, Svg } from "react-native-svg";
  import PressEffect from "../../UI/PressEffect";
  import { API_BASE_URL } from "@/constants/config";
  import AsyncStorage from '@react-native-async-storage/async-storage';
  const { height, width } = Dimensions.get("window");
  interface PopularSectionProps {
    categoryId: string | undefined;
    navigation: any;
  }
  function Post({ post, navigation }: { post: any, navigation: any }) {
    // const navigation = useNavigation();
    const [safeUri, setSafeUri] = useState<string>("");
    const [ratio, setRatio] = useState(1);
    //const authCtx = useContext(AuthContext);

    const getSafeImageUrl = (url: string) => {
      if (!url) return "";
      if (url.includes("/upload/")) {
        return url.replace("/upload/", "/upload/f_jpg/");
      }
      return url;
    };

    // Format date function
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
          if (post.images) {
            const fixedUrl = getSafeImageUrl(post?.images?.[0]?.url);
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

    function PostHeader() {
      const navigation = useNavigation();
      const [profilePic, setProfilePic] = React.useState(
        !!post?.authorId ? post?.authorId?.userAvatar?.url : DEFAULT_DP
      );
      return (
        <View style={{ alignSelf: "center", flexDirection: "row" }}>
          <Svg width={20} height={20} viewBox={`0 0 20 20`}>
            <Path
              d={`M0,0
                L20,0
                L20,20
                A20,20 0 0,0 0,0
                Z
          `}
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
                //   onPress={() => {
                //     navigation.navigate("UserProfileScreen", {
                //       backWhite: true,
                //       ViewUser: true,
                //     });
                //   }}
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
                      {/* {timeDifference(post.createdAt)} */}
                    </Text>
                  </View>
                </Pressable>
              </PressEffect>
            </View>
          </View>
          <Svg width={20} height={20} viewBox={`0 0 20 20`}>
            <Path
              d={`M20,0
                L0,0
                L00,20
                A0,0 0 0,1 20,0
                Z
          `}
              fill={GlobalStyles.colors.primary500}
            />
          </Svg>
        </View>
      );
    }

    
    
  
    function PostImage() {
      const [resizeModeCover, setResizeModeCover] = useState(true);
      const [ratio, setRatio] = useState(1);

      const getSafeImageUrl = (url: string) => {
        if (!url) return "";
        if (url.includes("/upload/")) {
          return url.replace("/upload/", "/upload/f_jpg/");
        }
        return url;
      };
  
      useEffect(() => {
        if (post.images) {
          const fixedUrl = getSafeImageUrl(post?.images?.[0]?.url);
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
  
      return (
        <Pressable
          onPress={() => {
            navigation.navigate('post-detail-screen', { postId: post._id });
          }}
          style={{}}
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
      );
    }
    function PostStats() {
      const [liked, setLiked] = useState(false);
  
      const [totalLikes, setTotalLikes] = useState(post?.stat?.reactCount || 0);
      const [showCaptions, setShowCaptions] = useState(false);
      const [showComments, setShowComments] = useState(false);
      const [isLoading, setIsLoading] = useState(false);
      
      // Kiểm tra trạng thái like của người dùng khi component load
      useEffect(() => {
        const checkReactionStatus = async () => {
          try {
            // Lấy userId từ AsyncStorage hoặc context
            const userId = await AsyncStorage.getItem('userId');
            if (!userId || !post?._id) return;

            const response = await fetch(`${API_BASE_URL}/react/check?postId=${post._id}&userId=${userId}`, {
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
        
        checkReactionStatus();
      }, [post?._id]);

      async function handleLike() {
        if (isLoading) return;
        setIsLoading(true);

        try {
          // Cập nhật UI trước để có trải nghiệm mượt mà
          setTotalLikes((prevData: number) => (liked ? prevData - 1 : prevData + 1));
          setLiked(!liked);

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
          } else {
            console.log('Đã tương tác với bài viết thành công:', data.data);
          }
        } catch (error) {
          // Hoàn tác thay đổi UI nếu có lỗi
          setTotalLikes((prevData: number) => (liked ? prevData + 1 : prevData - 1));
          setLiked(!liked);
          console.log('Lỗi khi gọi API:', error);
        } finally {
          setIsLoading(false);
        }
      }

      // Thêm hàm xử lý chia sẻ bài viết
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
            if (result.activityType) {
              // Đã chia sẻ qua activity type cụ thể
              console.log(`Shared via ${result.activityType}`);
            } else {
              // Đã chia sẻ nhưng không xác định được activity type
              console.log('Shared successfully');
            }
          } else if (result.action === Share.dismissedAction) {
            // Người dùng đã hủy chia sẻ
            console.log('Share dismissed');
          }
        } catch (error) {
          console.error('Error sharing post:', error);
        }
      };

      // Lấy hashtags từ nội dung bài viết hoặc sử dụng tags nếu có
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

      type FooterButtonProps = {
        icon: any;
        number?: any;
        onPress: any;
        color?: any;
      };
  
      function FooterButton({ icon, number, onPress, color = "black" } : FooterButtonProps) {
        return (
          <View>
            <Pressable style={[styles.footerIcon]} onPress={onPress}>
              <PressEffect>
                <Ionicons name={icon} size={25} color={color} />
              </PressEffect>
              <Text
                style={{
                  color: "black",
                  fontWeight: "600",
                }}
              >
                {number}
              </Text>
            </Pressable>
          </View>
        );
      }
  
      return (
        <>
          <CommentSheet visible={showComments} setVisible={setShowComments} postId={post._id}/>
  
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View style={{ position: "absolute", left: 0, flexDirection: "row" }}>
              <FooterButton
                icon={liked ? "heart" : "heart-outline"}
                number={totalLikes}
                onPress={handleLike}
                color={GlobalStyles.colors.greenLight}
              />
              <FooterButton
                icon={"chatbubble-ellipses-outline"}
                number={post?.comments?.length}
                onPress={() => {
                  setShowComments(true);
                }}
              />
            </View>
            <PostHeader />
            <View
              style={{ position: "absolute", right: 0, flexDirection: "row" }}
            >
              <FooterButton icon={"arrow-redo"} onPress={handleSharePost}/>
              <FooterButton icon={"bookmark"} onPress={() => {}} />
            </View>
          </View>
          <View style={{  marginTop: 10, justifyContent:"space-between", width: "100%", flexDirection: "row"}}>
            <TouchableOpacity onPress={() => navigation.navigate('detail-screen', { id: post?.locationId?._id })} style={{ flexDirection: "row"}}>
              <Image style={{width: 20, height: 20}} source={require("../../../assets/icons/marker.png")}></Image>
              <Text style={{color: "gray", fontSize: 14, fontWeight: "300"}}>
                {post?.locationId?.name}
              </Text>
            </TouchableOpacity>
            <View>
              <Text style={{color: "gray", fontSize: 12, fontWeight: "300"}}>
                {formatDate(post?.createdAt)}
              </Text>
            </View>
          </View>

          {/* Hashtags section */}
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
            
          {post?.content && (
            <Text
              onPress={() => setShowCaptions(!showCaptions)}
              numberOfLines={showCaptions ? undefined : 1}
              style={{
                color: "black",
                paddingHorizontal: 5,
                paddingTop: 15,
                textAlign: "center",
                width: showCaptions ? undefined : "90%",
                alignSelf: "center",
              }}
            >
              {post?.content}
              
            </Text>
          )}
        </>
      );
    }
  
    return (
      <View
        style={{
          backgroundColor: GlobalStyles.colors.primary300,
          borderRadius: 25,
          padding: 15,
          margin: 10,
          marginHorizontal: 20,
        }}
      >
        <PostImage />
  
        <PostStats />
      </View>
    );
  }
  
  export default Post;
  
  const styles = StyleSheet.create({
    story: {
      width: 35,
      height: 35,
      borderRadius: 50,
    },
    footerIcon: {
      margin: 5,
      flexDirection: "row",
      alignItems: "center",
    },
    hashtagContainer: {
      marginTop: 5,
      marginBottom: 5,
    },
    hashtagScrollContainer: {
      paddingHorizontal: 5,
    },
    hashtagItem: {
      backgroundColor: GlobalStyles.colors.primary200,
      borderRadius: 15,
      paddingHorizontal: 5,
      paddingVertical: 5,
      
    },
    hashtagText: {
      color: GlobalStyles.colors.primary700,
      fontWeight: "bold",
    },
  });
