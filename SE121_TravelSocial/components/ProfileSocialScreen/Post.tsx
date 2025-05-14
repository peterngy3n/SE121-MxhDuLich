import { StyleSheet, Dimensions, Pressable, View, Modal } from "react-native";
import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";

import RemoteImage from "./RemoteImage";
import MainPost from "../home/body/Post";

const { height, width } = Dimensions.get("window");

export default function Post ({ postData }:any) {
  console.log("Postt", postData);
  const navigation = useNavigation();
  const [showPost, setShowPost] = useState(false);
  return (
    <View>
      <Modal
        animationType="fade"
        transparent={true}
        visible={showPost}
        statusBarTranslucent
        onRequestClose={() => {
          setShowPost(false);
        }}
      >
        <Pressable
          onPress={() => setShowPost(false)}
          style={{
            flex: 1,
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <View>
            <MainPost post={postData} navigation={navigation} />
          </View>
        </Pressable>
      </Modal>

      <Pressable
        onPress={() => {
          setShowPost(true);
        }}
        style={{ margin: 5 }}
      >
        <RemoteImage imageUri={postData?.images?.[0].url || postData?.picturePath } />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({});
