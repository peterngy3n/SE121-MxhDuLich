import {
    View,
    Text,
    StyleSheet,
    Image,
    Dimensions,
    Pressable,
    ImageBackground,
  } from "react-native";
  import React, { useEffect, useState } from "react";
  
  import { useNavigation, NavigationProp } from "@react-navigation/native";
  import { RootStackParamList } from "../../types/navigation"; // Adjust the path to your navigation types
  import { GlobalStyles, DEFAULT_DP } from "../../constants/Styles.js";
  import PressEffect from "../UI/PressEffect";
import AsyncStorage from "@react-native-async-storage/async-storage";
  
  function ProfileHead ({ userData, viewMode }: any) {
    const [profilePic, setProfilePic] = React.useState(
      !!userData.picturePath ? userData.picturePath : DEFAULT_DP
    );
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const [userrData, setUserData] = useState<any>(null);
    const [postCount, setPostCount] = useState<number>(0);
    const [followersCount, setFollowersCount] = useState<number>(0);
    const [followingCount, setFollowingCount] = useState<number>(0);

    useEffect(() => {
      const fetchUserData = async () => {
        try {
          const jsonValue = await AsyncStorage.getItem('userData');
          if (jsonValue !== null) {
            const user = JSON.parse(jsonValue);
            setUserData(user);
            // Fetch posts count
            fetchUserPosts(user._id);
            // Fetch followers/following
            fetchFollowers(user._id);
            fetchFollowing(user._id);
          }
        } catch (e) {}
      };
      fetchUserData();
    }, []);

    // Fetch user's posts count
    const fetchUserPosts = async (userId: string) => {
      try {
        const response = await fetch(`${require('../../constants/config').API_BASE_URL}/posts/author/${userId}`, {
          method: 'GET',
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setPostCount(Array.isArray(data.data) ? data.data.length : 0);
        }
      } catch (e) {}
    };
    // Fetch followers count
    const fetchFollowers = async (userId: string) => {
      try {
        const response = await fetch(`${require('../../constants/config').API_BASE_URL}/friends?type=accept&userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setFollowersCount(Array.isArray(data.data) ? data.data.length : 0);
        }
      } catch (e) {}
    };
    // Fetch following count
    const fetchFollowing = async (userId: string) => {
      try {
        const response = await fetch(`${require('../../constants/config').API_BASE_URL}/friends?type=follow&userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setFollowingCount(Array.isArray(data.data) ? data.data.length : 0);
        }
      } catch (e) {}
    };

    function ProfileStat({ text, subText, onPress }: any) {
      return (
        <Pressable style={{ alignItems: "center" }} onPress={onPress}>
          <Text style={{ fontWeight: "400", fontSize: 25, color: "white" }}>
            {text}
          </Text>
          <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
            {subText}
          </Text>
        </Pressable>
      );
    }
  
    return (
      <View>
        <View
          style={{
            alignItems: "center",
            margin: 10,
          }}
        >
          <ImageBackground
            style={{
              width: 150,
              height: 150,
  
              marginHorizontal: 10,
            }}
            imageStyle={{
              borderRadius: 100,
            }}
            source={{ uri: userrData?.userAvatar?.url || profilePic }}
          >
            <View
              style={{
                position: "absolute",
                right: 0,
                bottom: 5,
              }}
            >
              <PressEffect
                style={{
                  backgroundColor: "rgb(47, 145, 250)",
                  padding: 10,
                  borderRadius: 50,
                }}
              >
                <Pressable
                //   onPress={() => {
                //     if (!viewMode) navigation.navigate("EditProfileScreen");
                //   }}
                >
                  <Image
                    source={
                      viewMode
                        ? require("../../assets/icons/add-friend.png")
                        : require("../../assets/icons/edit.png")
                    }
                    style={{ width: 25, height: 25, tintColor: "white" }}
                  />
                </Pressable>
              </PressEffect>
            </View>
            {viewMode && (
              <View
                style={{
                  position: "absolute",
                  left: 0,
                  top: 5,
                  transform: [{ rotateY: "180deg" }],
                }}
              >
                <PressEffect>
                  <Pressable
                    onPress={() => {
                      // navigation.navigate("chat-screen");
                    }}
                  >
                    <Image
                      source={require("../../assets/icons/chat-focused.png")}
                      style={{ width: 30, height: 30, tintColor: "white" }}
                    />
                  </Pressable>
                </PressEffect>
              </View>
            )}
          </ImageBackground>
          <Text
            style={{
              fontWeight: "bold",
              fontSize: 25,
              color: "black",
            }}
          >
            {userrData?.userName}
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: "rgba(6, 6, 6, 0.6)",
            }}
          >
            {userrData?.userEmail}
          </Text>
        </View>
  
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-around",
            alignItems: "center",
            marginBottom: 20,
            backgroundColor: 'rgb(47, 145, 250)',
            borderRadius: 20,
            marginHorizontal: 10,
            paddingVertical: 10,
          }}
        >
          <ProfileStat text={postCount} subText={"Bài đăng"} />
          <ProfileStat
            text={followersCount}
            subText={"Bạn bè"}
            onPress={() => {
              if (userrData?._id) {
                navigation.navigate('friends-list-screen', { userId: userrData._id });
              }
            }}
          />
          {/* <ProfileStat text={followingCount} subText={"Đang theo dõi"} /> */}
        </View>
      </View>
    );
  };
  
  export default ProfileHead;
  
  const styles = StyleSheet.create({});
