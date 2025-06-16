import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    ActivityIndicator,
    Pressable,
    Image,
} from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { GlobalStyles } from "../../constants/Styles.js";
import { FlatList } from "react-native-gesture-handler";
import CollectionCard from "./CollectionCard";

import React, { useState, useEffect, useContext } from "react";
import Post from "../../components/ProfileSocialScreen/Post";
// import { AuthContext } from "../../store/auth-context";
import { Ionicons } from "@expo/vector-icons";
import { POSTS } from "../../data/posts";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { API_BASE_URL } from "@/constants/config.js";


const TopTab = createMaterialTopTabNavigator();

function Posts({userId, navigation, route, refreshing }: any) {
    //const authCtx = useContext(AuthContext);
    const [fetching, setFetching] = useState(true);
    const [errorFetching, setErrorFetching] = useState(false);
    const [userPosts, setUserPosts] = useState<[]>([]);
    const [posts, setPosts] = useState<
        {
            __v: number;
            _id: string;
            comments: never[];
            createdAt: string;
            description: string;
            fileType: string;
            likes: never[];
            picturePath: string;
            updatedAt: string;
            userId: string;
            userPicturePath: string;
        }[]
    >([]);
    const getPosts = async () => {
        try {
            setFetching(true);

            setErrorFetching(false);
            setPosts(POSTS);
        } catch (error) {
            setErrorFetching(true);
            console.log(error);
        }
        setFetching(false);
    };

    const getUserPosts = async () => {
                try {
                    const response = await fetch(`${API_BASE_URL}/posts/author/${userId}`, {
                        method: 'GET',
                        credentials: 'include',
                    });
    
                    if (response) {
                        const data = await response.json();
                        setUserPosts(data.data); 
                        //setImage(data.data?.userAvatar.url);
                    } else {
                        console.error('Failed to fetch user data:', response);
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
    };

    useEffect(() => {
        getPosts();
        getUserPosts();

    }, [userId]);
    useEffect(() => {
        if (refreshing) {
            console.log("refreshing");
            getPosts();
        }
    }, [refreshing]);
    return (
        <View style={{ flex: 1, backgroundColor: GlobalStyles.colors.primary }}>
            {fetching ? (
                <View
                    style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
                >
                    <ActivityIndicator size={50} color={GlobalStyles.colors.purple} />
                </View>
            ) : errorFetching ? (
                <View
                    style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
                >
                    <Pressable onPress={getPosts}>
                        <Ionicons
                            name="reload-circle"
                            color={GlobalStyles.colors.purple}
                            size={50}
                        />
                        <Text
                            style={{ color: GlobalStyles.colors.purple, fontWeight: "bold" }}
                        >
                            Reload
                        </Text>
                    </Pressable>
                </View>
            ) : posts.length > 0 ? (
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View
                        style={{
                            flexDirection: "row",
                            margin: 5,
                            marginBottom: typeof GlobalStyles.styles.tabBarPadding === "number" ? GlobalStyles.styles.tabBarPadding : 0,
                        }}
                    >
                        <View style={{ flex: 1 }}>
                            {userPosts?.map((item, index) => (
                                <View key={index}>
                                    {index % 2 === 0 && <Post postData={userPosts[index]} />}
                                </View>
                            ))}
                        </View>
                        <View style={{ flex: 1 }}>
                            {userPosts?.map((item, index) => (
                                <View key={index}>
                                    {index % 2 !== 0 && <Post postData={userPosts[index]} />}
                                </View>
                            ))}
                        </View>
                    </View>
                </ScrollView>
            ) : (
                <View
                    style={{
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <Image
                        source={require("../../assets/no-photo.jpg")}
                        style={{
                            width: 300,
                            height: 300,
                            resizeMode: "contain",
                        }}
                    />
                </View>
            )}
        </View>
    );
}

function Videos({ navigation, route, refreshing }: any) {
    return (
        <View style={{ backgroundColor: GlobalStyles.colors.primary }}>
            <FlatList
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    justifyContent: "center",
                    alignItems: "center",
                    paddingBottom: typeof GlobalStyles.styles.tabBarPadding === "number" ? GlobalStyles.styles.tabBarPadding : 0,
                }}
                keyExtractor={(data, index) => index.toString()}
                data={[1, 2, 3, 4, 5, 6]}
                numColumns={2}
                renderItem={({ item, index }) => {
                    return (
                        <View>
                            <CollectionCard />
                        </View>
                    );
                }}
            />
        </View>
    );
}
export default function ProfileBody({ userId, refreshing }: any) {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <TopTab.Navigator
                screenOptions={{
                    tabBarActiveTintColor: GlobalStyles.colors.purple,
                    tabBarLabelStyle: {
                        textTransform: "none",
                        fontSize: 18,
                        padding: 0,
                        margin: 0,
                    },
                    tabBarInactiveTintColor: "rgba(0, 0, 0, 0.7)",
                    tabBarIndicatorStyle: {
                        height: 3,
                        width: "10%",
                        left: "20%",
                        borderRadius: 30,
                        backgroundColor: GlobalStyles.colors.purple,
                    },
                    tabBarStyle: {
                        padding: 0,
                        margin: 0,
                        justifyContent: "center",
                        width: "100%",
                        elevation: 0,
                        backgroundColor: "transparent",
                        borderBottomWidth: 1,
                        borderBottomColor: "rgba(255,255,255,0.1)",
                    },
                    tabBarPressColor: "white",
                }}
            >
                <TopTab.Screen
                    name="Posts"
                    options={{
                        title: "Images",
                    }}
                >
                    {({ navigation, route }) => (
                        <Posts
                            userId={userId}
                            navigation={navigation}
                            route={route}
                            refreshing={refreshing}
                        />
                    )}
                </TopTab.Screen>
                <TopTab.Screen
                    name="Videos"
                    options={{
                        title: "VIDS",
                    }}
                >
                    {({ navigation, route }) => (
                        <Videos
                            navigation={navigation}
                            route={route}
                            refreshing={refreshing}
                        />
                    )}
                </TopTab.Screen>
            </TopTab.Navigator>
        </GestureHandlerRootView>

    );
};


const styles = StyleSheet.create({});
