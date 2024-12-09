import React, { useState } from 'react';
import {Button, Text, View,  StyleSheet, Image, TouchableOpacity, TextInput, NativeSyntheticEvent, TextInputChangeEventData, Alert} from 'react-native';
//import CheckBox from '@react-native-community/checkbox';
import Checkbox from 'expo-checkbox';
import { NativeStackNavigatorProps } from 'react-native-screens/lib/typescript/native-stack/types';
import { Ionicons, FontAwesome6 } from '@expo/vector-icons';
import { useUser } from '@/context/UserContext';


export default function LoginScreen ({navigation}: {navigation: NativeStackNavigatorProps}) {

    const [email, setEmail] = useState('');
    const [emailVerify, setEmailVerify] = useState(false);
    const [password, setPassword] = useState('');
    const [toggleCheckBox, setToggleCheckBox] = useState(false);
    const [secureTextEntry, setSecureTextEntry] = useState(true);

    const { setUserId } = useUser();

    const handleSignUp = () => {
        console.log('Email:', email);
        console.log('Password:', password);
        navigation.navigate('login');
    };

    const handleLogin = async () => {
        
        try {
            const response = await fetch('http://192.168.1.6:3000/signin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: email, userPassword: password }),
            });
            
            console.log('Response status:', response.status);
            console.log('a', password)
            const data = await response.json(); 
            console.log(data);
            if (response.ok) {
                const userId = data.data;  // Giả sử API trả về userId trong đối tượng data
                setUserId(userId);  // Cập nhật userId vào state hoặc context
                console.log('User ID:', userId);
                navigation.navigate('main-screen');
            } else {
                
                Alert.alert('Login Failed', data.error || 'Please try again.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('An error occurred', 'Please check your connection and try again.');
        }
    };

    const handleCheckBox = () => {
        setToggleCheckBox(!toggleCheckBox);
    };

    const isValidEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleEmail = (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
        setEmailVerify(false);
        const emailVar = e.nativeEvent.text;
        setEmail(emailVar);
        if(isValidEmail(emailVar))
            setEmailVerify(true);
    }

    return (
        <View style={styles.container}>
            <Text style={styles.textsignup}>Đăng nhập ngay</Text>
            <Text style={styles.text1}>Đăng nhập để sử dụng app của chúng tôi</Text>
            <Text style={styles.text2}>Đăng nhập với</Text>

            <View style={styles.buttonRow}>
                <TouchableOpacity
                    style={styles.circleButtonGoogle}
                    onPress={() => navigation.navigate('main-screen')}
                >
                    <Image source={require('../../assets/icons/icongoogle.png')} style={styles.buttonIcon} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.circleButtonFacebook}
                    onPress={() => navigation.navigate('main-screen')}
                >
                    <Image source={require('../../assets/icons/iconfacebook.png')} style={styles.buttonIcon} />
                </TouchableOpacity>
            </View>
            <View style ={styles.backgroundinput}>
                <TextInput
                    style={styles.input}
                    placeholder="Nhập email"
                    value={email}
                    onChange={e => handleEmail(e)}
                />
            </View>
            
            <View style ={styles.backgroundinput}>
                <TextInput
                    style={styles.input2}
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={secureTextEntry}
                />

                <TouchableOpacity
                style={styles.icon}
                onPress={() => setSecureTextEntry(!secureTextEntry)}
                >
                <Ionicons size={18} style={{ color: 'blue',right:0}} name = {secureTextEntry? 'eye-off' :'eye' }></Ionicons>
                </TouchableOpacity>
            </View>

            <View style={styles.checkboxContainer}>
                <TouchableOpacity onPress={handleCheckBox}>
                    <Text style={styles.checkboxText}>quên mật khẩu?</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={styles.signupButton}
                onPress={handleLogin}
                //onPress={() => navigation.navigate('main-screen')}
            >
                <Text style={styles.signupButtonText}>Đăng nhập</Text>
            </TouchableOpacity>
            <View style={styles.buttonRow}>
            <Text style={styles.text3}>Chưa có tài khoản? </Text>
            <TouchableOpacity
                style={styles.text4}
                onPress={() => navigation.navigate('register2')}
            >
                <Text style = {{fontSize:18,fontWeight:'bold',color:'#196EEE'}}> Đăng ký</Text>
            </TouchableOpacity>
            
            </View>

        </View>
    )
}

const styles = StyleSheet.create({

    container: {
        
        flex: 1,
        
        alignItems: 'center',
        backgroundColor: 'white',
    },

    textsignup: {
        fontSize:40,
        color: '#196EEE',
        fontWeight:'bold',
        textAlign:'left',
        width: '100%', 
        left: 30,
        marginTop:115, 
    },

    text1:{
        marginTop:5,
        textAlign:'left',
        width: '100%', 
        fontSize:18,
        left: 30,
        
        fontWeight:'bold'
    },

    text2: {
        marginTop: 25,
        marginBottom: 20,
        fontSize:18,
    },

    text3: {
        fontSize:18,
        marginTop:20,
        textAlign:'left',
        width: '45%', 
        left: 30,
    },
    text4: {
        fontSize:18,
        marginTop:20,
        color: '#196EEE',
        fontWeight:'bold',
        textAlign:'left',
        width: '55%',
    },

    image: {
        width: 283,
        height: 186,
        marginBottom: 20,
        bottom: 40,
    },

    buttonRow: {
        flexDirection: 'row', 
        marginTop: 20,
        marginBottom: 30,
    },

    circleButtonGoogle: {
        width: 60,  
        height: 60,  
        borderRadius: 30,  
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white', 
        marginTop: 20,  
        left: 100,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.8,
        shadowRadius: 2,
        elevation: 5,
    },

    circleButtonFacebook: {
        width: 60,  
        height: 60,  
        borderRadius: 30,  
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white', 
        marginTop: 20,  
        right: 100,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.8,
        shadowRadius: 2,
        elevation: 5,
    },

    buttonIcon: {
        width: 40, 
        height: 40,  
        
    },

    signupButton: {
        marginTop: 40,
        paddingVertical: 20,
        width:'90%',
        alignItems:'center',
        backgroundColor: '#196EEE',
        borderRadius: 16,
    },
    signupButtonText: {
        color: 'white',
        fontSize: 25,
        fontWeight: 'bold',
    },

    backgroundinput:{
        flexDirection:'row',
        marginTop:20,
        width: '80%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff', 
        borderRadius:8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.8,
        shadowRadius: 2,
        elevation: 5,
    },
    input: {
        width: '100%',
        height: 50,
        borderRadius: 8,
        paddingHorizontal: 10,
        
    },
    input2: {
        width: '95%',
        height: 50,
        borderRadius: 8,
        paddingHorizontal: 10,
        
    },

    icon:{
        width:'5%',
        right: 15,
    },

    checkboxContainer: {
        justifyContent:'flex-end',
        flexDirection: 'row',
        marginTop: 20,
        width:'100%',
        marginRight: 60,
        
    },
    checkbox: {
        
        alignSelf: 'center',
        color:'red',
    },
    checkboxText: {
        marginLeft: 10,
        fontSize: 15,
        paddingHorizontal:10,
    },
    
});