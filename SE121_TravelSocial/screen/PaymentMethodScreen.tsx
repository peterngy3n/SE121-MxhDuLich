import React, { useEffect, useState, useRef } from 'react';
import { Text, View, StyleSheet, Image, TouchableOpacity, TextInput, ScrollView, Alert, Platform, Linking, ActivityIndicator } from 'react-native';
import { NativeStackNavigatorProps } from 'react-native-screens/lib/typescript/native-stack/types';
import { RootStackParamList } from '@/types/navigation';
import { RouteProp, useRoute } from '@react-navigation/native';
import { API_BASE_URL } from '../constants/config';
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



export default function PaymentMethodScreen({ navigation }: { navigation: NativeStackNavigatorProps }) {
    const route = useRoute<ReservationRouteProp>();
    const { locationId, totalPrice, selectedRoomsData, bookingId, ImageUrl, checkinDate, checkoutDate } = route.params; // nhận thêm locationImage, checkinDate, checkoutDate
    // totalPrice is now the backend-calculated price

    const { userId } = useUser();
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
                body: JSON.stringify({ bookingId }), // clientIp có thể lấy từ backend nếu cần
            });
            const data = await res.json();
            if (data.isSuccess && data.data) {
                setPaymentUrl(data.data);
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
        } catch (error: any) {
            console.error('Error generating VietQR:', error.response?.data || error.message);
        }
    };

    useEffect(() => {
        if (qrImage) {
        }
    }, [qrImage]);

    useEffect(() => {
        handleGenerateQR();
    }, [])


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
            console.log('locationid in payment: ', locationId);
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
        showWebView && paymentUrl ? (
            <View style={{ flex: 1, height: '100%', width: '100%' }}>
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
                            setShowSuccessModal(true);
                            setTimeout(() => {
                                setShowSuccessModal(false);
                                navigation.navigate('main-screen');
                            }, 2000);
                        }
                    }}
                />
                {/* Modal thành công */}
                {showSuccessModal && (
                    <View style={styles.successModal}>
                        <View style={styles.successModalContent}>
                            <Image source={require('../assets/icons/success.png')} style={{ width: 64, height: 64, marginBottom: 16 }} />
                            <Text style={styles.successTitle}>Thanh toán thành công!</Text>
                            <Text style={styles.successText}>Bạn sẽ được chuyển về trang chính...</Text>
                        </View>
                    </View>
                )}
            </View>
        ) : (
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.arrowleftbutton} onPress={() => navigation.goBack()}>
                        <Image source={require('../assets/icons/arrowleft.png')} style={styles.arrowlefticon} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Phương Thức Thanh Toán</Text>
                </View>



                {/* Thông tin đặt phòng */}
                <View style={styles.bookingSummaryBox}>
                    {ImageUrl && (
                        console.log('locationImage in payment: ', ImageUrl),
                        <Image
                            source={{ uri: Array.isArray(ImageUrl) ? ImageUrl[0]?.url : ImageUrl }}
                            style={{ width: 120, height: 80, borderRadius: 8 }}
                            resizeMode="cover"
                        />
                    )}                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.bookingTitle}>{locationDetails?.name || 'Tên địa điểm'}</Text>
                        <Text style={styles.bookingDate}>{checkinDate && checkoutDate
                            ? `Check-in: ${new Date(checkinDate).toLocaleDateString()} - Check-out: ${new Date(checkoutDate).toLocaleDateString()}`
                            : ''}</Text>
                        <Text style={styles.bookingPrice}>Tổng tiền: <Text style={{ color: '#176FF2', fontWeight: 'bold' }}>{Number(totalPrice).toLocaleString('vi-VN')} VND</Text></Text>
                    </View>
                </View>

                {/* Lựa chọn phương thức thanh toán */}
                <Text style={styles.sectionTitle}>Chọn phương thức thanh toán</Text>
                <View style={styles.paymentMethodsRow}>
                    <TouchableOpacity
                        style={[styles.paymentMethodBox, selectedButton === 'vnpay' && styles.selectedPaymentMethodBox]}
                        onPress={() => { setSelectedButton('vnpay'); }}
                    >
                        <Image source={require('../assets/images/vnpay.png')} style={styles.paymentIcon} />
                        <Text style={styles.paymentLabel}>VNPay</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.paymentMethodBox, selectedButton === 'momo' && styles.selectedPaymentMethodBox]}
                        onPress={() => { setSelectedButton('momo'); }}
                    >
                        <Image source={require('../assets/images/momo.png')} style={styles.paymentIcon} />
                        <Text style={styles.paymentLabel}>Momo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.paymentMethodBox, selectedButton === 'bank' && styles.selectedPaymentMethodBox]}
                        onPress={() => { setSelectedButton('bank'); fetchBanks(); }}
                    >
                        <Image source={require('../assets/images/bank.png')} style={styles.paymentIcon} />
                        <Text style={styles.paymentLabel}>Ngân hàng</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.paymentMethodBox, selectedButton === 'credit-card' && styles.selectedPaymentMethodBox]}
                        onPress={() => { setSelectedButton('credit-card'); }}
                    >
                        <Image source={require('../assets/images/credit-card.png')} style={styles.paymentIcon} />
                        <Text style={styles.paymentLabel}>Thẻ tín dụng</Text>
                    </TouchableOpacity>
                </View>

                {/* Ưu đãi/Voucher */}
                {/* <View style={styles.voucherBox}>
                    <Image source={require('../assets/icons/voucher.png')} style={styles.voucherIcon} />
                    <Text style={styles.voucherText}>Chọn hoặc nhập mã ưu đãi để tiết kiệm hơn!</Text>
                    <TouchableOpacity style={styles.voucherButton} onPress={() => navigation.navigate('voucher-screen')}>
                        <Text style={styles.voucherButtonText}>Chọn voucher</Text>
                    </TouchableOpacity>
                </View> */}

                {/* Hướng dẫn thanh toán */}
                <View style={styles.guideBox}>
                    <Text style={styles.guideTitle}>Hướng dẫn thanh toán</Text>
                    <Text style={styles.guideText}>{"1. Chọn phương thức thanh toán phù hợp.\n2. Nhấn Thanh toán" + " để tiếp tục.\n3. Làm theo hướng dẫn của cổng thanh toán.\n4. Sau khi thanh toán thành công, bạn sẽ được chuyển về trang chính."}</Text>
                </View>

                {/* Nút thanh toán động theo phương thức */}
                <View style={{ alignItems: 'center', marginVertical: 24 }}>
                    {selectedButton === 'vnpay' && paymentUrl && !showWebView && (
                        <TouchableOpacity
                            style={styles.payButton}
                            onPress={() => setShowWebView(true)}
                        >
                            <Text style={styles.payButtonText}>Thanh toán qua VNPay</Text>
                        </TouchableOpacity>
                    )}
                    {selectedButton === 'momo' && (
                        <TouchableOpacity style={styles.payButton} onPress={handleMomoPayment}>
                            <Text style={styles.payButtonText}>Thanh toán qua Momo</Text>
                        </TouchableOpacity>
                    )}
                    {selectedButton === 'bank' && (
                        <TouchableOpacity style={styles.payButton} onPress={applyAndPay}>
                            <Text style={styles.payButtonText}>Chuyển khoản ngân hàng</Text>
                        </TouchableOpacity>
                    )}
                    {selectedButton === 'credit-card' && (
                        <TouchableOpacity style={styles.payButton} onPress={() => Alert.alert('Chức năng đang phát triển!')}>
                            <Text style={styles.payButtonText}>Thanh toán bằng thẻ tín dụng</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Modal thành công */}
                {showSuccessModal && (
                    <View style={styles.successModal}>
                        <View style={styles.successModalContent}>
                            <Image source={require('../assets/icons/success.png')} style={{ width: 64, height: 64, marginBottom: 16 }} />
                            <Text style={styles.successTitle}>Thanh toán thành công!</Text>
                            <Text style={styles.successText}>Bạn sẽ được chuyển về trang chính...</Text>
                        </View>
                    </View>
                )}
            </View>
        )
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
        width: '100%',
        position: 'relative',
        backgroundColor: '#ffffff',
        paddingHorizontal: 100,
        paddingVertical: 40,
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
        width: '120%',
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
        marginLeft: 20,
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
        position: 'absolute',
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
        flexDirection: 'row',
        borderRadius: 20,
        backgroundColor: '#FFFFE9',
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },

    boxText: {

    },

    boxText2: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },

    boxText3: {
        color: 'white',
        fontWeight: '900',
        fontSize: 22,
    },

    addpaymentmethod: {
        borderRadius: 20,
        backgroundColor: '#176FF2',
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
        alignContent: 'center',
        width: 200,
        shadowColor: '#176FF2',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 2,
        shadowRadius: 4,
        elevation: 20,
    },

    addpaymentmethod2: {
        borderRadius: 60,
        backgroundColor: '#176FF2',
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
        alignContent: 'center',
        width: '85%',
        height: 60,
    },

    imagesRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
        top: 20,
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
        alignContent: 'center',
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        marginTop: 40,
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
        borderWidth: 1,
        borderColor: 'transparent',
    },

    bank: {
        marginTop: 5,
        flexDirection: 'row',
        borderRadius: 4,
        backgroundColor: '#0F7B3A',
        padding: 10,
        alignItems: 'center',
        justifyContent: 'flex-start',
        alignContent: 'center',
        width: '90%',
        height: 60,
    },

    bank2: {
        marginTop: 5,
        flexDirection: 'row',
        borderRadius: 4,
        backgroundColor: '#3F8075',
        padding: 10,
        alignItems: 'center',
        justifyContent: 'flex-start',
        alignContent: 'center',
        width: '90%',
        height: 60,
    },

    selectedBank: {
        borderColor: '#0000ff',
        borderWidth: 2,
    },

    blankbank: {
        marginTop: 5,
        flexDirection: 'row',
        borderRadius: 4,
        backgroundColor: '#FFFFFF',
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
        alignContent: 'center',
        width: '90%',
        height: 60,
        borderWidth: 0.4,
        marginBottom: 5,

    },

    boxTextbank: {
        marginLeft: 10,
        color: 'white',
    },

    account: {
        marginLeft: 10,
        color: 'white',
        fontSize: 16,
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
        paddingRight: 45,
        flexShrink: 1,
        flexWrap: 'wrap',
        fontSize: 16,
        fontWeight: 'bold',
    },

    // New styles for the updated UI
    bookingSummaryBox: {
        flexDirection: 'row',
        backgroundColor: '#f9f9f9',
        padding: 16,
        borderRadius: 12,
        margin: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    bookingImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
        marginRight: 16,
    },
    bookingTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    bookingDate: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    bookingPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#176FF2',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 16,
        marginBottom: 8,
    },
    paymentMethodsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
    },
    paymentMethodBox: {
        flex: 1,
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#f0f0f0',
        marginHorizontal: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    selectedPaymentMethodBox: {
        borderColor: '#176FF2',
        borderWidth: 2,
    },
    paymentIcon: {
        width: 40,
        height: 40,
        marginBottom: 8,
    },
    paymentLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    voucherBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e1f5fe',
        padding: 16,
        borderRadius: 12,
        margin: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    voucherIcon: {
        width: 40,
        height: 40,
        marginRight: 16,
    },
    voucherText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        marginRight: 16,
    },
    voucherButton: {
        backgroundColor: '#176FF2',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    voucherButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    guideBox: {
        backgroundColor: '#f9f9f9',
        padding: 16,
        borderRadius: 12,
        margin: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    guideTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    guideText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    payButton: {
        backgroundColor: '#176FF2',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 8,
        width: '90%',
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    payButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
    successModal: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    successModalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    successTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#176FF2',
        marginBottom: 8,
    },
    successText: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
    },
});
