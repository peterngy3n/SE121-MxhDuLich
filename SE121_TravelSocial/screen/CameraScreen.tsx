import {
    CameraView,
    useCameraPermissions,
    useMicrophonePermissions,
    CameraType } from "expo-camera";
//   import { Video } from "expo-av";
  import * as ImagePicker from "expo-image-picker";
  import { useState, useEffect, useRef, useContext } from "react";
  import { Pressable, StyleSheet, Text, View, Modal } from "react-native";
  import { SafeAreaView } from "react-native-safe-area-context";
  
  import { Ionicons } from "@expo/vector-icons";
  import { GlobalStyles } from "../constants/Styles";
  // import { formatTime } from "../util/functions";
//   import { AppContext } from "../store/app-context";
import React from "react";
  
  function CameraScreen({ showCamera, setShowCamera, getPost, mode, setExit }:any) {
    // const appCtx = useContext(AppContext);
  
    const [facing, setFacing] = useState<CameraType>(ImagePicker.CameraType.back);
    const [camera, setCamera] = useState<CameraView | null>(null);
    const [permission, requestPermission] = useCameraPermissions();
    const [audioPermission, requestAudioPermission] = useMicrophonePermissions();
    const [image, setImage] = useState<string | null>(null);
  
    const [recording, setRecording] = useState(false);
    const [videoUri, setVideoUri] = useState<string | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
    useEffect(() => {
  
      return () => {
        if (timerIntervalRef.current !== null) {
          clearInterval(timerIntervalRef.current);
        }
      };
    }, [videoUri]);
  
    useEffect(() => {
      if (image) {
        // navigation.navigate({
        //   name: screenName.current,
        //   params: { image: image },
        //   merge: true,
        // });
        getPost(image);
        setShowCamera(false);
      }
    }, [image]);
  
    if (!permission || !audioPermission) {
      // Camera permissions are still loading
      return <View />;
    }
  
    if (!permission.granted || !audioPermission.granted) {
      // Camera permissions are not granted yet
      return (
        <Modal
          animationType="slide"
          transparent={true}
          visible={showCamera}
          statusBarTranslucent={true}
          onRequestClose={() => {
            if (setExit) {
              setExit(true);
            }
            setShowCamera(false);
          }}
        >
          <View style={styles.container}>
          </View>
            <View style={styles.permission}>
            <View style={styles.permissionContainer}>
              <Text style={styles.permissionText}>
                We need your Permission to use Camera
              </Text>
              <Pressable
                onPress={() => {
                  requestPermission();
                  requestAudioPermission();
                }}
              >
                <Text style={styles.permissionBtn}>{"Grant Permission"}</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      );
    }
  
    function toggleCameraFace() {
      setFacing((current) => (current === ImagePicker.CameraType.back ? ImagePicker.CameraType.front : ImagePicker.CameraType.back));
    }
    const startRecording = async () => {
      if (camera) {
        setRecording(true);
        setElapsedTime(0);
        timerIntervalRef.current = setInterval(() => {
          setElapsedTime((prevTime) => prevTime + 1);
        }, 1000);
  
        const videoRecordOptions = {
          maxDuration: 30, // Set the maximum duration for the video (in seconds)
          mute: false, // Example of another valid property
        };

        camera.recordAsync(videoRecordOptions).then((recordedVideo) => {
          if (recordedVideo?.uri) {
            setVideoUri(recordedVideo.uri);
          }
        });
      }
    };
  
    const stopRecording = async () => {
      if (camera) {
        setRecording(false);
        //clearInterval(timerIntervalRef.current);
  
        camera.stopRecording();
      }
    };
    const takeVideoHandler = async () => {
      if (recording) {
        stopRecording();
      } else {
        startRecording();
      }
    };
    async function takePickerHandler() {
      if (camera) {
        const cameraOptions = {
          quality: 1,
          ratio: mode === "story" ? "9:16" : undefined,
        };
        const data = await camera.takePictureAsync(cameraOptions);
        if (data?.uri) {
          setImage(data.uri);
        }
      }
    }
  
    async function pickImage() {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes:
          mode === "video"
            ? ImagePicker.MediaTypeOptions.Videos
            : ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect:
          mode === "story" ? [9, 16] : mode === "profilePic" ? [1, 1] : undefined,
        quality: 1,
      });
  
      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    }
  
    return (
      <>
        {showCamera && (
          <Modal
            animationType="slide"
            transparent={true}
            visible={showCamera}
            statusBarTranslucent={true}
            onRequestClose={() => {
              if (setExit) {
                setExit(true);
              }
              setShowCamera(false);
            }}
          >
            <View style={styles.container}>
              <CameraView
              ref={(ref) => setCamera(ref)}
              style={styles.camera}
              facing={facing}
            >
              <View style={styles.buttonContainer}>
                {recording && (
                  <View style={styles.timerContainer}>
                    <Text
                      style={{
                        fontSize: 15,
                        color: GlobalStyles.colors.red,
                      }}
                    >
                      {"\u2B24"}
                    </Text>
                    <Text style={styles.timerText}>
                      {/* {formatTime(elapsedTime)} */}
                    </Text>
                  </View>
                )}
                <View style={styles.buttonSubContainer}>
                  {!recording && (
                    <Pressable onPress={pickImage}>
                      <Ionicons name="images" size={40} color={"white"} />
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => {
                      if (mode === "video") {
                        // takeVideoHandler();
                      } else {
                        takePickerHandler();
                      }
                    }}
                  >
                    <Ionicons
                      name={recording ? "ellipse" : "ellipse-outline"}
                      size={100}
                      color={recording ? GlobalStyles.colors.red : "white"}
                    />
                  </Pressable>
                  {!recording && (
                    <Pressable onPress={toggleCameraFace}>
                      <Ionicons name="camera-reverse" size={40} color={"white"} />
                    </Pressable>
                  )}
                </View>
              </View>
            </CameraView>
            </View>
          </Modal>
        )}
      </>
    );
  }
  
  export default CameraScreen;
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      flexDirection: "row",
      backgroundColor: "white",
    },
    camera: {
      flex: 1,
    },
    buttonContainer: {
      flex: 1,
      justifyContent: "flex-end",
      marginBottom: 50,
      marginHorizontal: 10,
    },
    buttonSubContainer: {
      backgroundColor: "rgba(0,0,0,0.2)",
      borderRadius: 30,
      flexDirection: "row",
      justifyContent: "space-evenly",
      alignItems: "center",
    },
    text: {
      fontSize: 24,
      fontWeight: "bold",
      color: "white",
    },
    permission: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: GlobalStyles.colors.primary,
    },
    permissionContainer: {
      alignItems: "center",
      paddingVertical: 20,
      backgroundColor: GlobalStyles.colors.primary500,
      borderRadius: 30,
    },
    permissionText: {
      textAlign: "center",
      marginVertical: 10,
      fontSize: 18,
      marginHorizontal: 20,
      color: "white",
    },
    permissionBtn: {
      backgroundColor: GlobalStyles.colors.blue,
      padding: 20,
      paddingVertical: 15,
      borderRadius: 50,
      color: "white",
      fontWeight: "bold",
      fontSize: 18,
    },
    videoPreviewContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      margin: 20,
    },
    videoPreviewBtn: {
      borderRadius: 15,
      padding: 5,
      borderWidth: 1,
      borderColor: "white",
    },
    timerContainer: {
      flexDirection: "row",
      alignSelf: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.3)",
      marginBottom: 10,
      padding: 5,
      borderRadius: 15,
      paddingHorizontal: 10,
    },
    timerText: {
      color: "white",
      fontSize: 18,
      fontWeight: "bold",
    },
  });
  