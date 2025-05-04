import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Pressable,
    ImageBackground,
  } from "react-native";
  import React, { useContext, useEffect, useState } from "react";
  import Ionicons from "@expo/vector-icons/Ionicons";
  import { useNavigation } from "@react-navigation/native";
  import { DEFAULT_DP, GlobalStyles } from "../../../constants/Styles";
  import CommentSheet from "../../Comments/CommentSheet";
  //import { timeDifference } from "../../../utils/helperFunctions";
  //import { AuthContext } from "../../../store/auth-context";
  import PressEffect from "../../UI/PressEffect";
  import { LinearGradient } from "expo-linear-gradient";
  import AsyncStorage from '@react-native-async-storage/async-storage';
  import { API_BASE_URL } from "@/constants/config";
  const { height, width } = Dimensions.get("window");
  
  function PostAdvance({ post } : any) {
    //const authCtx = useContext(AuthContext);
  
    function Avatar() {
      const navigation = useNavigation();
      const [profilePic, setProfilePic] = React.useState(
        !!post.userPicturePath ? post.userPicturePath : DEFAULT_DP
      );
      return (
        <View style={{ flexDirection: "row" }}>
          <PressEffect>
            <Pressable
              style={{
                flexDirection: "row",
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
                  username
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
      );
    }
    function PostFotter() {
      const [showCaptions, setShowCaptions] = useState(false);
  
      return (
        <View style={{ marginHorizontal: 20 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 10,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="location"
                size={15}
                color={GlobalStyles.colors.gray}
              />
              <Text
                style={{ color: 'black', paddingHorizontal: 5 }}
              >
                Lahore, Pakistan
              </Text>
            </View>
            <Text
              style={{ color: 'black', paddingHorizontal: 5 }}
            >
              25 July, 2024
            </Text>
          </View>
          <Text
            onPress={() => setShowCaptions(!showCaptions)}
            numberOfLines={showCaptions ? undefined : 1}
            style={{
              color: "black",
              padding: 5,
              paddingBottom: 10,
              width: showCaptions ? undefined : "90%",
            }}
          >
            <Text
              style={{
                fontWeight: "bold",
                fontSize: 18,
                color: GlobalStyles.colors.purple,
              }}
            >
              Post Title:{" "}
            </Text>
            {post.description}
          </Text>
        </View>
      );
    }
    function PostImage({ children } : any) {
      const [resizeModeCover, setResizeModeCover] = useState(true);
      const [ratio, setRatio] = useState(1);
  
      useEffect(() => {
        Image.getSize(post.picturePath, (width, height) => {
          const imageRatio = width / height;
          if (imageRatio < 0.9) {
            setRatio(1);
          } else {
            setRatio(imageRatio);
          }
        });
      }, [post]);
  
      return (
        <Pressable
          style={{
            borderRadius: 30,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: GlobalStyles.colors.primary600,
          }}
          onPress={() => {
            setResizeModeCover(!resizeModeCover);
            console.log("object");
          }}
        >
          <ImageBackground
            source={{ uri: post.picturePath }}
            style={{
              width: "100%",
              aspectRatio: ratio,
              backgroundColor: GlobalStyles.colors.primary500,
            }}
            imageStyle={{
              resizeMode: resizeModeCover ? "cover" : "contain",
            }}
          >
            <LinearGradient
              colors={["rgba(0,0,0,.5)", "transparent"]}
              start={{ x: 0, y: 1 }}
              end={{ x: 0, y: 0 }}
              style={{
                bottom: 0,
                height: 40 + 50,
                width: "100%",
                position: "absolute",
              }}
            />
            {children}
          </ImageBackground>
        </Pressable>
      );
    }
    function PostStats() {
      const [liked, setLiked] = useState(false);
  
      const [totalLikes, setTotalLikes] = useState(post.likes.length);
      const [showComments, setShowComments] = useState(false);
      const [isLoading, setIsLoading] = useState(false);
      
      // Kiểm tra trạng thái like của người dùng khi component load
      useEffect(() => {
        const checkReactionStatus = async () => {
          try {
            // Lấy userId từ AsyncStorage
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
  

      type FooterButtonProps = {
        icon: any;
        number?: any;
        onPress: any;
        color?: any;
      };

      function FooterButton({ icon, number, onPress, color = "white" } : FooterButtonProps) {
        return (
          <View style={{ zIndex: 10 }}>
            <Pressable style={[styles.footerIcon]} onPress={onPress}>
              <PressEffect>
                <View
                  style={{
                    backgroundColor: 'GlobalStyles.colors.primary',
                    padding: 10,
                    borderRadius: 50,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Ionicons
                    style={{
                      paddingHorizontal: 5,
                    }}
                    name={icon}
                    size={20}
                    color={color}
                  />
  
                  {/* <Text
                    style={{
                      color: "white",
                      fontWeight: "600",
                    }}
                  >
                    {number}
                  </Text> */}
                </View>
              </PressEffect>
            </Pressable>
          </View>
        );
      }
  
      return (
        <>
          <CommentSheet visible={showComments} setVisible={setShowComments} />
  
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              margin: 10,
            }}
          >
            <Avatar />
            <View
              style={{
                alignItems: "center",
                flexDirection: "row",
                gap: 5,
              }}
            >
              <FooterButton
                icon={liked ? "heart" : "heart-outline"}
                number={totalLikes}
                onPress={handleLike}
                color={GlobalStyles.colors.greenLight}
              />
              <FooterButton
                icon={"chatbubble-ellipses"}
                number={post.comments.length}
                onPress={() => {
                  setShowComments(true);
                }}
              />
  
              <FooterButton icon={"arrow-redo"} onPress={() => {}}/>
            </View>
          </View>
        </>
      );
    }
  
    return (
      <View
        style={{
          backgroundColor: GlobalStyles.colors.primary300,
          borderRadius: 30,
          marginHorizontal: 10,
        }}
      >
        <PostImage>
          <PostStats />
        </PostImage>
        <PostFotter />
      </View>
    );
  }
  
  export default PostAdvance;
  
  const styles = StyleSheet.create({
    story: {
      width: 35,
      height: 35,
      borderRadius: 50,
    },
    footerIcon: {

    }
  });
