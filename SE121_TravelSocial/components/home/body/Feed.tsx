import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import React, { useEffect, useState, useCallback } from "react";
import { GlobalStyles } from "../../../constants/Styles";
import { FlatList } from "react-native";
import { RefreshControl } from "react-native";
import Post from "./Post";
import { POSTS } from "../../../data/posts";
import { CONTAINER_HEIGHT } from "../head/Stories";
import { useSharedValue } from "react-native-reanimated";
import PostAdvance from "./PostAdvance";
import { API_BASE_URL } from "@/constants/config";
import { useNavigation } from "@react-navigation/native";

const Feed = ({ StoryTranslate, userData } : any) => {
  const [posts, setPosts] = useState<[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const lastScrollY = useSharedValue(0);
  const navigation = useNavigation();
  
  // Fetch posts from friends (including user's own posts)
  const getFriendPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/posts/friends`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(data.data);
      } else {
        console.log('Failed to fetch friend posts:', response.statusText);
        // Fallback to user's own posts
        getUserPosts();
      }
    } catch (error) {
      console.error('Error fetching friend posts:', error);
      // Fallback to user's own posts
      getUserPosts();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch user's own posts as a fallback
  const getUserPosts = async () => {
    try {
      if (!userData?._id) return;
      
      const response = await fetch(`${API_BASE_URL}/posts/author/${userData._id}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(data.data);
      } else {
        console.log('Failed to fetch user data:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    getFriendPosts();
  };

  useEffect(() => {
    if (userData) {
      getFriendPosts();
    }
  }, [userData]);

  // Memoized renderItem to avoid unnecessary re-renders
  const renderItem = useCallback(
    ({ item }: any) => (
      <View>
        <PostAdvance post={item} navigation={navigation} />
      </View>
    ),
    [navigation]
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: GlobalStyles.colors.primary }}>
        <ActivityIndicator size="large" color={GlobalStyles.colors.primary500} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: GlobalStyles.colors.primary }}>
      <FlatList
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 10,
          paddingBottom: (GlobalStyles.styles.tabBarPadding as number),
          gap: 20,
        }}
        onMomentumScrollBegin={(event) => {
          const scrollY = event.nativeEvent.contentOffset.y;
          if (scrollY > lastScrollY.value) StoryTranslate.value = true;
          else {
            StoryTranslate.value = false;
          }
        }}
        onMomentumScrollEnd={(event) => {
          const scrollY = event.nativeEvent.contentOffset.y;
          lastScrollY.value = scrollY;
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        keyExtractor={(item: any) => item._id?.toString?.() || item.id?.toString?.() || String(item)}
        data={posts}
        renderItem={renderItem}
        ListEmptyComponent={() => (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: GlobalStyles.colors.gray }}>Không có bài viết nào từ bạn bè</Text>
          </View>
        )}
      />
    </View>
  );
};

export default Feed;

const styles = StyleSheet.create({});
