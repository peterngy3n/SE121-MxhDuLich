import React, { useEffect, useState, useRef } from 'react';
import { Text, View, StyleSheet, Image, TouchableOpacity, TextInput, ScrollView, Alert, Platform, Linking, ActivityIndicator } from 'react-native';
import { NativeStackNavigatorProps } from 'react-native-screens/lib/typescript/native-stack/types';
import { RootStackParamList } from '@/types/navigation';
import { RouteProp, useRoute } from '@react-navigation/native';
import {API_BASE_URL} from '../constants/config';
import { useUser } from '@/context/UserContext';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Icon, IconButton } from 'react-native-paper';
import { trackEvents } from '../constants/recommendation';
import { WebView } from 'react-native-webview';


type ReservationRouteProp = RouteProp<RootStackParamList, 'payment-method-screen'>;
interface Bank {
    
    appId: string;
    appLogo: string;
    appName: string;
    bankName: string;
    deeplink: string;
}



export default function PaymentMethodScreen({ navigation }: {navigation: NativeStackNavigatorProps}) {
    const route = useRoute<ReservationRouteProp>();
    const {locationId, totalPrice, selectedRoomsData, bookingId } = route.params; // nhận bookingId từ params
    // totalPrice is now the backend-calculated price
    console.log('bookingId in payment: ', bookingId);
    console.log('roomdata in payment: ', selectedRoomsData);
    const {userId} = useUser(); 
    const [selectedButton, setSelectedButton] = useState<string | null>(null);
    const [locationDetails, setLocationDetails] = useState<any>(null);
    const [banks, setBanks] = useState<Bank[]>([]);
    const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
    const [loading, setLoading] = useState(true);
    const [qrImage, setQrImage] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
    const [showWebView, setShowWebView] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const webviewRef = useRef<WebView>(null);

    // Gọi API tạo link thanh toán VNPay khi vào trang
    const fetchPaymentUrl = async () => {
        if (!bookingId) return;
        try {
            const res = await fetch(`${API_BASE_URL}/create_payment_url`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId}), // clientIp có thể lấy từ backend nếu cần
            });
            const data = await res.json();
            console.log('Payment URL data:', data);
            if (data.isSuccess && data.data) {
                setPaymentUrl(data.data);
                console.log('Payment URL:', data.data);
            } else {
                setPaymentUrl(null);
            }
        } catch (e) {
            setPaymentUrl(null);
        }
    };

    useEffect(() => {
        fetchPaymentUrl();
    }, [bookingId]);

    const handlePress = (button: string) => {
        setSelectedButton(button);
        if (button === 'bank') {
            fetchBanks();
        }
        handleMomoPayment();
    };

    const handleMomoPayment = async () => {
        // const partnerCode = "MOMOXXXX"; 
        // const totalPrice = 50000; 
        // const orderId = "order12345"; 
        // const description = "Thanh toán TravelSocial";
    
        // const deeplink = `momo://?action=payWithApp&amount=${totalPrice}&orderId=${orderId}&description=${description}`;
        // try {
        //     await Linking.openURL(deeplink);
        // } catch (error) {
        //     Alert.alert('Lỗi', 'Không thể mở ứng dụng MoMo.');
        // }
    };


const generateVietQR = async () => {
    try {
        const response = await axios.post(
            'https://api.vietqr.io/v2/generate',
            {
                accountNo: "9386441295",
                accountName: "TO HOANG HUY",
                acqId: "970436",
                addInfo: "chuyen tien dat cho",
                amount: "2000",
                template: "compact",
            },
            {
                headers: {
                    'x-client-id': 'f905c745-0625-48e1-8468-e9d47ebb861c',
                    'x-api-key': '527eee5f-326f-4dd4-91ab-df80ba43329e',
                    'Content-Type': 'application/json',
                },
            }
        );

        setQrImage(response.data.qrDataURL);
        return response.data;
    } catch (error:any) {
        console.error('Error generating VietQR:', error.response?.data || error.message);
    }
};

useEffect(() => {
    if (qrImage) {
    }
}, [qrImage]); 

useEffect(()=>{
    handleGenerateQR();
},[])


const handleGenerateQR = async () => {
    const qrData = await generateVietQR();
    setQrImage(qrData.data.qrDataURL); 
};

const saveQRImageToGallery = async () => {
    try {
        if (!qrImage) {
            Alert.alert('QR Code không có dữ liệu!');
            return;
        }
        const base64Data = qrImage.split(',')[1];
        const fileUri = FileSystem.documentDirectory + 'vietqr.png';
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
        });
        const permission = await MediaLibrary.requestPermissionsAsync();

        if (permission.granted) {
            const asset = await MediaLibrary.createAssetAsync(fileUri);
            await MediaLibrary.createAlbumAsync('QR Codes', asset, false); 
            Alert.alert('Thành công!', 'Ảnh QR đã được lưu vào thư viện ảnh.');
        } else {
            Alert.alert('Không có quyền', 'Ứng dụng cần quyền truy cập vào thư viện ảnh.');
        }
    } catch (error) {
        console.error('Error saving QR Image to gallery:', error);
        Alert.alert('Lỗi', 'Không thể lưu ảnh QR vào thư viện ảnh.');
    }
};
    
    const fetchBanks = async () => {
        
        try {
            const response = await fetch('https://api.vietqr.io/v2/android-app-deeplinks');
            const data = await response.json();
            if (data && data.apps && Array.isArray(data.apps)) {
                setBanks(data.apps);
                setLoading(false);
            } else {
                Alert.alert('Lỗi', 'Dữ liệu ngân hàng không hợp lệ.');
                setLoading(false);
            }
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể tải danh sách ngân hàng.');
        } 
    };
    const handlePress1 = (bank: Bank) => {
        setSelectedBank(bank);

    };

    const applyAndPay = async () => {
        setIsSubmitting(true);
        try {
            fetchPaymentUrl()
            // if (selectedBank) {
            //     await Linking.openURL(selectedBank.deeplink).catch(err =>
            //         Alert.alert('Error', 'Không thể mở ứng dụng ngân hàng.')
            //     );
            // }
            // // No booking creation here; bookingId should be passed in params
            // Alert.alert('Tiếp tục', 'Vui lòng hoàn tất thanh toán.');
            // // Optionally, navigate to booking detail or main screen after payment
        } finally {
            setIsSubmitting(false);
        }
    };

    const fetchLocationDetails = async (id: string) => {
        try {
          console.log('locationid in payment: ',locationId);
          const response = await fetch(`${API_BASE_URL}/locationbyid/${locationId}`);
          const data = await response.json();
          if (data.isSuccess) {
            console.log('Location details:', data.data);
            setLocationDetails(data.data);
          } else {
            console.error('API error:', data.error);
          }
        } catch (error) {
          console.error('Fetch error:', error);
        }
    };
    useEffect(() => {
        if (locationId) {
          fetchLocationDetails(locationId); 
        }
    }, [locationId]);

    // If totalPrice is missing, show error
    useEffect(() => {
        if (totalPrice === undefined || totalPrice === null) {
            Alert.alert('Lỗi', 'Không nhận được giá từ máy chủ. Vui lòng quay lại và thử lại.');
        }
    }, [totalPrice]);
    

    return (

        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.arrowleftbutton} onPress={() => navigation.goBack()}>
                <Image source={require('../assets/icons/arrowleft.png')} style={styles.arrowlefticon} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Phương Thức Thanh Toán</Text>
            </View>

            {/* <ScrollView>
                <View style={{flexDirection:'row'}}>
                    <View style={styles.imageContainer}>
                        <Image source={require('../assets/images/camping-ho-coc.png')} style={styles.image} />
                    </View>
                    <View style ={styles.textContainer}>
                        <Text style= {styles.title}>{locationDetails?.name || 'Tên địa điểm'}</Text>

                        <View style={styles.detailsContainer}>
                            <View style={styles.ratingBox}>
                                <Image source = {require('../assets/icons/star.png')} style={{height:20, width:20, marginRight:3,}}></Image>
                                <Text style={styles.boxText}>{locationDetails?.rating || 4}</Text>
                            </View>
                            <View style={styles.featureBox}>
                                <Image source={require('../assets/icons/clock.png')} style ={{marginRight:3,}}></Image>
                                <Text style={styles.boxText}>free cancel in 24h</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.container}>
                    <TouchableOpacity onPress={handleGenerateQR}>
                        
                    </TouchableOpacity>
                    {qrImage && (
                        <Image
                            source={{ uri: qrImage }}
                            style={styles.qrImage}
                            resizeMode="contain"
                        />
                    )}
                    <View style={{width:'100%', justifyContent:'center',alignItems:'center', marginTop: 5}}>
                        <TouchableOpacity style={{width:60, flexDirection: 'row', height:20, left: 20, justifyContent:'center'}} onPress={saveQRImageToGallery}>
                            <Text style ={{width:'100%',height:20, justifyContent:'center', alignItems:'center', fontSize:14, fontWeight:'700',}}>Lưu ảnh</Text>
                            <IconButton 
                                icon="download" 
                                size={20}
                                style={{ bottom: 15, right: 20}} 
                            />                        
                        </TouchableOpacity>
                    </View>                   
                </View>

                <View style={styles.imagesRow}>

                    <View style={{justifyContent:'center',alignItems:'center',}}>
                        <TouchableOpacity
                            style={[
                                styles.squareContainer,
                                selectedButton === 'bank' && styles.selectedSquareContainer
                            ]}
                            onPress={() => handlePress('bank')}
                        >
                            <Image source={require('../assets/images/bank.png')} style={styles.smallImage} />
                        </TouchableOpacity>
                        <Text style={{marginTop:10,}}>Bank</Text>
                    </View>

                    <View style={{justifyContent:'center',alignItems:'center',}}>
                        <TouchableOpacity
                            style={[
                                styles.squareContainer,
                                selectedButton === 'momo' && styles.selectedSquareContainer
                            ]}
                            onPress={() => handlePress('momo')}
                        >
                            <Image source={require('../assets/images/momo.png')} style={styles.smallImage} />
                        </TouchableOpacity>
                        <Text style={{marginTop:10,}}>Momo</Text>
                    </View>

                    <View style={{justifyContent:'center',alignItems:'center',}}>
                        <TouchableOpacity
                            style={[
                                styles.squareContainer,
                                selectedButton === 'credit-card' && styles.selectedSquareContainer
                            ]}
                            onPress={() => handlePress('credit-card')}
                        >
                            <Image source={require('../assets/images/credit-card.png')} style={styles.smallImage} />
                        </TouchableOpacity>
                        <Text style={{marginTop:10,}}>Credit-card</Text>
                    </View>
                    
                </View>

                <ScrollView style = {{marginTop:20, marginBottom: 130, height: 300}}>
                {selectedButton === 'bank' && ( 
                    loading ? ( 
                    <ActivityIndicator size="large" color="#0000ff" />
                    ) : (
                        <View style={styles.bankList}>
                            {banks.map((bank) => (
                                <TouchableOpacity
                                    key={bank.appId} 
                                    style={styles.bankItem}
                                    onPress={() => handlePress1(bank)}
                                >
                                    <Image source={{ uri: bank.appLogo }} style={styles.bankLogo} />
                                    <View>
                                        <Text style={styles.bankName}>{bank.bankName}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ))}
                    </ScrollView>
                <View style={{position:'absolute',bottom:20,width:'100%'}}>
                    <Text style={{marginLeft:30, fontSize:24, marginBottom:20,}}> Thanh toán {totalPrice} VND</Text>
                    <View style = {{  alignItems:'center', justifyContent:'center',alignContent:'center',width:'100%'}}>
                        
                    <TouchableOpacity
                        style={styles.addpaymentmethod2}
                        onPress={applyAndPay}
                        disabled={isSubmitting} // Vô hiệu hóa nút trong khi xử lý
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.boxText3}>Xác Nhận Thanh Toán</Text>
                        )}
                    </TouchableOpacity>
                    </View>
                </View>
            </ScrollView> */}
            {paymentUrl && showWebView && (
                <View style={{flex: 1, height: '100%', width: '100%'}}>
                    <WebView
                        ref={webviewRef}
                        source={{ uri: paymentUrl }}
                        style={{ flex: 1 }}
                        startInLoadingState
                        javaScriptEnabled
                        domStorageEnabled
                        onNavigationStateChange={(navState) => {
                            if (navState.url && navState.url.includes('vnpay_return')) {
                                // @ts-ignore
                                webviewRef.current?.stopLoading && webviewRef.current.stopLoading();
                                setShowWebView(false);
                                setShowSuccessModal(true); // Hiện modal thanh toán thành công
                                setTimeout(() => {
                                    setShowSuccessModal(false);
                                    navigation.navigate('main-screen');
                                }, 2000); // 2 giây sau tự động chuyển về main-screen
                            }
                        }}
                    />
                </View>
            )}
            {paymentUrl && !showWebView && (
                <View style={{alignItems:'center', marginVertical:16}}>
                    <TouchableOpacity
                        style={{backgroundColor:'#176FF2', borderRadius:8, padding:16, marginBottom:8}}
                        onPress={() => setShowWebView(true)}
                    >
                        <Text style={{color:'#fff', fontWeight:'bold', fontSize:18}}>Thanh toán qua VNPay</Text>
                    </TouchableOpacity>
                </View>
            )}
            {showSuccessModal && (
                <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 9999,
                }}>
                    <View style={{
                        backgroundColor: 'white',
                        borderRadius: 16,
                        padding: 32,
                        alignItems: 'center',
                    }}>
                        <Image source={require('../assets/icons/success.png')} style={{width: 64, height: 64, marginBottom: 16}} />
                        <Text style={{fontSize: 20, fontWeight: 'bold', color: '#176FF2', marginBottom: 8}}>Thanh toán thành công!</Text>
                        <Text style={{fontSize: 16, color: '#333'}}>Bạn sẽ được chuyển về trang chính...</Text>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#ffffff',
    },

    qrImage: {
        marginTop: 20,
        width: '100%',
        height: 200,
    },

    header: {
      
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 30,
      width:'100%',
      position: 'relative',
      backgroundColor: '#ffffff', 
      paddingHorizontal:100,
      paddingVertical:40,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 2,
      shadowRadius: 4,
      elevation: 20,
    },
    headerTitle: {
      width:'120%',
      fontSize: 20,
      fontWeight: 'bold',
    },

    arrowleftbutton: {
        position: 'absolute',
        left: 10,
      },
      arrowlefticon: {
        width: 40,
        height: 40,
      },

      imageContainer: {
        marginLeft:20,
        width: 130,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 20,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },

    textContainer: {
        flex: 1,
        marginLeft: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        flexShrink: 1,
        flexWrap: 'wrap',
    },

    detailsContainer: {
        position:'absolute',
        flexDirection: 'row',
        bottom: 0,
    },
    ratingBox: {
        flexDirection: 'row',
        backgroundColor: '#FFFFE9',
        padding: 10,
        borderRadius: 20,
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureBox: {
        flexDirection:'row',
        borderRadius:20,
        backgroundColor: '#FFFFE9',
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },

    boxText:{

    },

    boxText2:{
        color:'white',
        fontWeight:'bold',
        fontSize:16,
    },

    boxText3:{
        color:'white',
        fontWeight:'900',
        fontSize:22,
    },

    addpaymentmethod:{
        borderRadius:20,
        backgroundColor: '#176FF2',
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
        alignContent:'center',
        width:200,
        shadowColor: '#176FF2',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 2,
        shadowRadius: 4,
        elevation: 20,
    },

    addpaymentmethod2:{
        borderRadius:60,
        backgroundColor: '#176FF2',
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
        alignContent:'center',
        width:'85%',
        height:60,
    },

    imagesRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
        top:20,
    },

    squareContainer: {
        width: 70,
        height: 70,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
        borderWidth: 1,
        borderColor: 'transparent',
    },

    smallImage: {
        width: 30,
        height: 30,
        borderRadius: 10,
    },

    selectedSquareContainer: {
        borderColor: '#176FF2', 
    },

    squareContainer2: {
        width: '90%',
        alignContent:'center',
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        marginTop:40,
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
        borderWidth: 1,
        borderColor: 'transparent',
    },

    bank:{
        marginTop:5,
        flexDirection:'row',
        borderRadius:4,
        backgroundColor: '#0F7B3A',
        padding: 10,
        alignItems: 'center',
        justifyContent: 'flex-start',
        alignContent:'center',
        width:'90%',
        height:60,
    },

    bank2:{
        marginTop:5,
        flexDirection:'row',
        borderRadius:4,
        backgroundColor: '#3F8075',
        padding: 10,
        alignItems: 'center',
        justifyContent: 'flex-start',
        alignContent:'center',
        width:'90%',
        height:60,
    },

    selectedBank: {
        borderColor: '#0000ff',
        borderWidth: 2,
    },

    blankbank:{
        marginTop:5,
        flexDirection:'row',
        borderRadius:4,
        backgroundColor: '#FFFFFF',
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
        alignContent:'center',
        width:'90%',
        height:60,
        borderWidth:0.4,
        marginBottom:5,
        
    },

    boxTextbank:{
        marginLeft:10,
        color:'white',
    },

    account:{
        marginLeft:10,
        color:'white',
        fontSize:16,
    },

    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
  
    bankList: {
        width: '100%',
        alignItems: 'center',
        marginTop: 20,
    },
    bankItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10,
        paddingHorizontal: 10,
        paddingVertical: 15,
        borderRadius: 10,
        backgroundColor: '#f0f0f0',
        width: '90%',
    },
    bankLogo: {
        width: 40,
        height: 40,
        marginRight: 10,
    },
    bankName: {
        paddingRight:45,
        flexShrink: 1,
        flexWrap: 'wrap',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
