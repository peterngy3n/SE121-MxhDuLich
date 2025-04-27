import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import InputField from "../components/InputField";
import ListCard from "../components/SearchScreen/ListCard";
import PostsList from "../components/SearchScreen/PostsList";
import EmojisList from "../components/SearchScreen/EmojisList";

import { GlobalStyles } from "../constants/Styles";
import Animated, {
  FadeInDown,
  FadeInLeft,
  FadeOutRight,
} from "react-native-reanimated";
import { USER_DATA } from "../data/USER";
import React from "react";
import Header2 from "@/components/Header2";

export default function SearchScreen ({ navigation }: any) {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<typeof USER_DATA>([]);
  const [inputFocused, setInputFocused] = useState(false);
  async function searchUser(text: string) {
    setSearch(text);
    if (text.length > 0) {
      try {
        setUsers(USER_DATA);
      } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
      }
    } else {
      setUsers([]);
    }
  }
  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
      title: "Tìm kiếm bạn bè",
    });
  }, []);
  return (
    <KeyboardAvoidingView
      keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
      style={styles.container}
    >
      <StatusBar backgroundColor={GlobalStyles.colors.primary} />
      <Header2 title="Thông báo"/>

      <View
        style={{
          margin: 10,
        }}
      >
        <InputField
          onChangeText={searchUser}
          onBlur={() => {
            setInputFocused(false);
          }}
          onFocus={() => {
            setInputFocused(true);
          }}
          value={search}
          placeholder="Tìm kiếm bạn bè"
          keyboardType="default"
          inValid={true}
          search={true}
        />
      </View>
      {users.length > 0 ? (
        <ScrollView
          contentContainerStyle={{
            flex: 1,
          }}
        >
          {users.map((item, index) => (
            <ListCard key={index} userData={item} />
          ))}
        </ScrollView>
      ) : (
        <>
          {!inputFocused && (
            <>
              <Animated.View
                entering={FadeInLeft}
                exiting={FadeOutRight}
                style={{
                  marginVertical: 50,
                }}
              >
                {/* <PostsList /> */}
              </Animated.View>
              {/* <Animated.View entering={FadeInDown} style={{ flex: 1 }}>
                <EmojisList />
              </Animated.View> */}
            </>
          )}
        </>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.primary,
  },
});
