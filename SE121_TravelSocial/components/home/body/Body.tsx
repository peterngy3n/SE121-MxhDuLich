import { StyleSheet, Text, View } from "react-native";
import React, { useEffect, useState } from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import Feed from "./Feed";
import Video from "./Video";
import { GlobalStyles } from "../../../constants/Styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
//import TopTabBar from "./TopTabBar";
const TopTab = createMaterialTopTabNavigator();
const Body = ({ StoryTranslate }: any) => {
  const [userData, setUserData] = useState<any>(null);
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('userData');
        if (jsonValue !== null) {
          const user = JSON.parse(jsonValue);
          setUserData(user);
          
        }
      } catch (e) {
        
      }
    };

    fetchUserData();
  }, []);
  
  return (


      <TopTab.Navigator
      //   tabBar={(props) => <TopTabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: "black",
        tabBarLabelStyle: {
          textTransform: "none",
          fontSize: 18,
          padding: 0,
          margin: 0,
        },
        tabBarInactiveTintColor: "rgb(129, 128, 128)",
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
          borderBottomColor: "rgba(255, 255, 255, 0.1)",
        },
        tabBarPressColor: "white",
      }}
    >
      <TopTab.Screen name="Feed">
        {() => <Feed StoryTranslate={StoryTranslate} userData={userData} />}
      </TopTab.Screen>
      <TopTab.Screen name="Video">
        {() => <Video StoryTranslate={StoryTranslate} />}
      </TopTab.Screen>
    </TopTab.Navigator>
    
  );
};

export default Body;

const styles = StyleSheet.create({});
