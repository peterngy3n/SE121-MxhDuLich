import React, { useEffect, useState } from "react";
import { Text, View, StyleSheet, Image, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GlobalStyles } from "../../../constants/Styles";
import PressEffect from "../../UI/PressEffect";
import { useUser } from '@/context/UserContext';
import { NativeStackNavigatorProps } from 'react-native-screens/lib/typescript/native-stack/types';
import AsyncStorage from "@react-native-async-storage/async-storage";


export default function Header({ navigation }: {navigation: NativeStackNavigatorProps}) {
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
    <View style={[styles.container]}>
    <Pressable
      onPress={() => navigation.navigate("profile-social-screen")}
      style={{ position: "absolute", left: 0 }}
    >
      <PressEffect>
        <Image
          style={{ width: 30, height: 30, borderRadius: 50, zIndex:200 }}
          source={{
            uri: userData?.userAvatar?.url ||"https://res.cloudinary.com/dzy4gcw1k/image/upload/v1744723748/download_1_hzncwm.jpg",
          }}
        />
        
      </PressEffect>
    </Pressable>

    <View style={{ alignItems: "center" }}>
      <Text style={{ color: "rgb(0, 0, 0)", fontSize: 30, fontWeight: "bold" }}>
        Social
      </Text>
      <Text style={{ color: "rgb(0, 0, 0)", fontSize: 15 }}>
        Chào mừng bạn đến với Travel Social
      </Text>
    </View>

    <View style={styles.iconsContainer}>
      <PressEffect>
        <Pressable
          style={styles.icon}
          onPress={() => {
            navigation.navigate("search-friend-screen");
          }}
        >
          <Ionicons name="search" size={25} color={"black"} />
        </Pressable>
      </PressEffect>
      <PressEffect>
        <Pressable
          style={styles.icon}
          onPress={() => {
            navigation.navigate("notifications-social-screen");
          }}
        >
          <Ionicons name="notifications" size={25} color={"black"} />
          <View style={styles.unreadBadge} />
          {/* <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>6</Text>
          </View> */}
        </Pressable>
      </PressEffect>
    </View>
  </View>
  )

};


const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 5,
    marginHorizontal: 20,
  },
  iconsContainer: {
    position: "absolute",
    right: 0,
    flexDirection: "row",
  },
  logo: {
    width: 100,
    height: 50,
    resizeMode: "contain",
    tintColor: "white",
  },
  icon: {
    marginLeft: 10,
  },
  unreadBadge: {
    backgroundColor: GlobalStyles.colors.red,
    position: "absolute",
    right: 2,
    top: 2,
    width: 8,
    height: 8,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadBadgeText: {
    fontSize: 10,
    color: "white",
    fontWeight: "bold",
  },
});
