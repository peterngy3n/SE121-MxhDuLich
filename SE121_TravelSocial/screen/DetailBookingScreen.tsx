import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, Image, TouchableOpacity, TextInput, ScrollView, Alert, Platform, Linking, ActivityIndicator, Modal, FlatList, Dimensions } from 'react-native';
import { NativeStackNavigatorProps } from 'react-native-screens/lib/typescript/native-stack/types';
import { RadioButton } from 'react-native-paper';
import { useRoute } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { RouteParams } from 'expo-router';
import { RootStackParamList } from '@/types/navigation';
import {API_BASE_URL} from '../constants/config';

type ReservationRouteProp = RouteProp<RootStackParamList, 'detail-booking-screen'>;

export default function DetailBookingScreen({ navigation }: {navigation: NativeStackNavigatorProps}) {
    const route = useRoute<ReservationRouteProp>();
    const { bookingId, title, status } = route.params;

    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [name, setName] = useState({ firstName: '', lastName: '' });
    const [phoneNumber, setPhoneNumber] = useState('');
    const [displayName, setDisplayName] = useState({ firstName: '', lastName: '' });
    const [displayPhoneNumber, setDisplayPhoneNumber] = useState('');
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [checked, setChecked] = useState('first');
    const [locationDetails, setLocationDetails] = useState<any>(null);
    const [bookingDetails, setBookingDetails] = useState<any>(null);
    const [roomDetail, setRoomDetail] = useState<any>(null);
    const [isGeneralModalVisible, setIsGeneralModalVisible] = useState(false); // Modal phòng & dịch vụ
    const [isRoomDetailModalVisible, setIsRoomDetailModalVisible] = useState(false); // Modal chi tiết phòng
    const cleaningFee = 15000.0;

    useEffect(() => {
        const fetchBookingDetails = async () => {
          try {
            const response = await fetch(`${API_BASE_URL}/booking/getbyid/${bookingId}`);
            const result = await response.json();
    
            if (response.ok && result.isSuccess) {
              setBookingDetails(result.data);
            } else {
              Alert.alert('Lỗi', result.message || 'Không thể lấy chi tiết booking.');
            }
          } catch (error) {
            console.error('Error fetching booking details:', error);
            Alert.alert('Lỗi', 'Không thể kết nối với máy chủ.');
          } finally {
            // setLoading(false);
          }
        };
    
        fetchBookingDetails();
    }, [bookingId]);

      const formatRoomDate = (date: any): string => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    useEffect(() => {
        if (bookingDetails) {
          // Kiểm tra phương thức thanh toán
          const paymentMethod = bookingDetails.amountPaid === bookingDetails.totalPaid ? 'first' : 'second';
          setChecked(paymentMethod);
        }
    }, [bookingDetails]);

 const handleCancelBooking = () => {

    if (bookingDetails?.status === 'confirm' || bookingDetails?.status === 'finished' ) {
        Alert.alert('Không thể hủy', 'Booking đã được xác nhận và không thể hủy.');
        return;
    } else if (bookingDetails?.status === 'canceled') {
        Alert.alert('Không thể hủy', 'Booking đã được hủy.');
        return;
    }

    Alert.alert(
      'Xác nhận hủy',
      'Bạn có chắc chắn muốn hủy booking này?',
      [
        {
          text: 'Không',
          style: 'cancel',
        },
        {
          text: 'Có',
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/booking/update/${bookingId}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: 'canceled' }), // Truyền trạng thái mới
              });
  
              const result = await response.json();
  
              if (result.isSuccess) {
                Alert.alert('Thành công', 'Booking đã được hủy.');
                // onCancel(); // Cập nhật danh sách sau khi hủy
              } else {
                Alert.alert('Lỗi', result.message || 'Không thể hủy booking.');
              }
            } catch (error) {
              console.error('Error canceling booking:', error);
              Alert.alert('Lỗi', 'Không thể kết nối với máy chủ.');
            }
          },
        },
      ],
      { cancelable: true } // Cho phép hủy bỏ thông báo bằng cách nhấn ra ngoài
    );
  };
      

    useEffect(() => {
        if (bookingDetails && bookingDetails.locationId) {
            const fetchLocationDetails = async () => {
                try {
                    const response = await fetch(`${API_BASE_URL}/locationbyid/${bookingDetails.locationId}`);
                    const result = await response.json();
                    if (result.isSuccess) {
                        setLocationDetails(result.data);
                    }
                } catch (error) {
                    // handle error
                }
            };
            fetchLocationDetails();
        }
    }, [bookingDetails]);

    const handleShowGeneralDetail = () => setIsGeneralModalVisible(true);
    const handleHideGeneralDetail = () => setIsGeneralModalVisible(false);
    const handleShowRoomDetail = () => setIsRoomDetailModalVisible(true);
    const handleHideRoomDetail = () => setIsRoomDetailModalVisible(false);

    useEffect(() => {
        if (bookingDetails && bookingDetails.items && bookingDetails.items.length > 0) {
            
            const roomId = bookingDetails.items[0].roomId._id;
            if (roomId) {
                fetchRoomDetail(roomId);
            }
        }
    }, [bookingDetails]);

    const fetchRoomDetail = async (roomId: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/room/getbyid/${roomId}`);
            const result = await response.json();
            if (result.isSuccess && result.data) {
                setRoomDetail(result.data);
            }
        } catch (error) {
            // Có thể log lỗi nếu cần
        }
    };

    if (!bookingDetails) {
        return (
          <View>
            <Text>Đang tải dữ liệu booking...</Text>
          </View>
        );
    }
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.arrowleftbutton} onPress={() => navigation.goBack()}>
                <Image source={require('../assets/icons/arrowleft.png')} style={styles.arrowlefticon} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Lịch Sử Đặt Chỗ</Text>
            </View>
            <ScrollView style={{ flex: 1, backgroundColor: '#fff' }}>
              {/* Hình ảnh địa điểm */}
              <View style={{flexDirection:'row'}}>
                <View style={styles.imageContainer}>
                  {locationDetails?.image?.[0]?.url ? (
                    <Image source={{ uri: locationDetails.image[0].url }} style={styles.image} />
                  ) : (
                    <Image source={require('../assets/images/camping-ho-coc.png')} style={styles.image} />
                  )}
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.title}>{locationDetails?.name || title || 'Tên địa điểm'}</Text>
                  <View style={styles.detailsContainer}>
                    {locationDetails?.rating && (
                      <View style={styles.ratingBox}>
                        <Image source={require('../assets/icons/star.png')} style={{height:20, width:20, marginRight:3}} />
                        <Text style={styles.boxText}>{locationDetails.rating}</Text>
                      </View>
                    )}
                    <View style={styles.featureBox}>
                      <Image source={require('../assets/icons/clock.png')} style={{marginRight:3}} />
                      <Text style={styles.boxText}>mễn phí hủy trong 24h</Text>
                    </View>
                  </View>
                </View>
              </View>
              {/* Ngày checkin/checkout */}
              <View style={{width:'100%', padding: 10, backgroundColor:'#f5f6fa', borderRadius: 8, marginVertical: 10}}>
                <Text style={{fontWeight:'bold', fontSize:16, marginBottom: 5}}>Ngày nhận/trả phòng</Text>
                <Text>
                  {bookingDetails?.checkinDate ? formatRoomDate(new Date(bookingDetails.checkinDate)) : '--'}
                  <Text style={{color:'#888'}}> → </Text>
                  {bookingDetails?.checkoutDate ? formatRoomDate(new Date(bookingDetails.checkoutDate)) : '--'}
                </Text>
              </View>
              {/* Nút xem chi tiết phòng/dịch vụ */}
              <View style={{alignItems:'flex-end', marginRight:20, marginBottom:5}}>
                <TouchableOpacity style={{padding:8, backgroundColor:'#176FF2', borderRadius:8}} onPress={handleShowGeneralDetail}>
                  <Text style={{color:'#fff', fontWeight:'bold'}}>Xem chi tiết phòng & dịch vụ</Text>
                </TouchableOpacity>
              </View>
              {/* Modal chi tiết phòng/dịch vụ */}
              {isGeneralModalVisible && (
                <View style={{position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.4)', justifyContent:'center', alignItems:'center', zIndex:10}}>
                  <View style={{backgroundColor:'#fff', borderRadius:12, padding:20, width:'85%'}}>
                    <Text style={{fontWeight:'bold', fontSize:18, marginBottom:10}}>Chi tiết phòng đã đặt</Text>
                    {bookingDetails?.items?.map((room: any, idx: number) => (
                      <View key={room.roomId?._id + idx} style={{marginBottom:8, borderBottomWidth:1, borderColor:'#eee', paddingBottom:8}}>
                        <Text style={{fontWeight:'600'}}>{room.roomId?.name}</Text>
                        <Text>Số lượng: {room.quantity}</Text>
                        <Text>Giá: {room.price ? (room.price * room.quantity).toLocaleString('vi-VN') : ''} VND</Text>
                        <TouchableOpacity style={{marginTop:4, alignSelf:'flex-start', backgroundColor:'#176FF2', borderRadius:6, paddingHorizontal:10, paddingVertical:4}} onPress={() => { setRoomDetail(room.roomId); handleShowRoomDetail(); }}>
                          <Text style={{color:'#fff'}}>Xem chi tiết</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                    <Text style={{fontWeight:'bold', fontSize:18, marginVertical:10}}>Dịch vụ kèm theo</Text>
                    {bookingDetails?.services?.length > 0 ? bookingDetails.services.map((service: any, idx: number) => (
                      <View key={service.serviceId?._id + idx} style={{marginBottom:8}}>
                        <Text style={{fontWeight:'600'}}>{service.serviceId?.name}</Text>
                        <Text>Số lượng: {service.quantity}</Text>
                        <Text>Giá: {service.price ? (service.price * service.quantity).toLocaleString('vi-VN') : ''} VND</Text>
                      </View>
                    )) : <Text>Không có dịch vụ kèm theo</Text>}
                    <TouchableOpacity style={{marginTop:15, alignSelf:'center'}} onPress={handleHideGeneralDetail}>
                      <Text style={{color:'#176FF2', fontWeight:'bold'}}>Đóng</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              {/* Modal chi tiết phòng cụ thể */}
              <Modal
                visible={isRoomDetailModalVisible}
                transparent
                animationType="slide"
                onRequestClose={handleHideRoomDetail}
              >
                <View style={{flex:1, backgroundColor:'rgba(0,0,0,0.4)', justifyContent:'center', alignItems:'center'}}>
                  <View style={{backgroundColor:'#fff', borderRadius:16, padding:0, width:'92%', maxHeight:'85%', overflow:'hidden', elevation:8}}>
                    {roomDetail ? (
                      <ScrollView style={{padding:0}}>
                        {/* Hình ảnh phòng */}
                        <View style={{width:'100%', height:200, backgroundColor:'#f5f7fa', alignItems:'center', justifyContent:'center'}}>
                          {roomDetail.image && roomDetail.image.length > 0 ? (
                            <FlatList
                              data={roomDetail.image}
                              horizontal
                              pagingEnabled
                              showsHorizontalScrollIndicator={false}
                              keyExtractor={(item, idx) => item + idx}
                              renderItem={({ item }) => (
                                <Image
                                  source={{ uri: item }}
                                  style={{ width: 320, height: 180, borderRadius: 12, margin: 8, resizeMode: 'cover' }}
                                />
                              )}
                            />
                          ) : (
                            <Image source={require('../assets/images/room.jpg')} style={{ width: 320, height: 180, borderRadius: 12, margin: 8, resizeMode: 'cover' }} />
                          )}
                        </View>
                        {/* Thông tin phòng */}
                        <View style={{padding:18}}>
                          <Text style={{fontWeight:'bold', fontSize:20, color:'#176FF2', marginBottom:4}}>{roomDetail.name}</Text>
                          <Text style={{fontSize:14, color:'#666', marginBottom:8}}>{roomDetail.description || 'Mô tả phòng hiện chưa có.'}</Text>
                          <View style={{flexDirection:'row', marginBottom:6}}>
                            <View style={{flexDirection:'row', alignItems:'center', marginRight:18}}>
                              <Image source={require('../assets/icons/bed.png')} style={{width:18, height:18, marginRight:4}} />
                              <Text style={{fontSize:13, color:'#444'}}>{roomDetail.bed?.map((b:any) => `${b.category} x${b.quantity}`).join(', ')}</Text>
                            </View>
                            <View style={{flexDirection:'row', alignItems:'center', marginRight:18}}>
                              {/* <Image source={require('../assets/icons/arrows.png')} style={{width:18, height:18, marginRight:4}} /> */}
                              <Text style={{fontSize:13, color:'#444'}}>{roomDetail.area} m²</Text>
                            </View>
                          </View>
                          <View style={{flexDirection:'row', marginBottom:6}}>
                            <View style={{flexDirection:'row', alignItems:'center', marginRight:18}}>
                              {/* <Image source={require('../assets/icons/users.png')} style={{width:18, height:18, marginRight:4}} /> */}
                              <Text style={{fontSize:13, color:'#444'}}>Tối đa {roomDetail.capacity} khách</Text>
                            </View>
                            <View style={{flexDirection:'row', alignItems:'center', marginRight:18}}>
                              {/* <Image source={require('../assets/icons/money.png')} style={{width:18, height:18, marginRight:4}} /> */}
                              <Text style={{fontSize:13, color:'#2DD7A4', fontWeight:'bold'}}>{roomDetail.pricePerNight?.toLocaleString('vi-VN')} VND/đêm</Text>
                            </View>
                          </View>
                          {/* Tiện nghi */}
                          <View style={{flexDirection:'row', flexWrap:'wrap', marginVertical:8}}>
                            {roomDetail.facility && roomDetail.facility.length > 0 ? (
                              roomDetail.facility.map((f:any, idx:number) => (
                                <View key={f.id+idx} style={{flexDirection:'row', alignItems:'center', backgroundColor:'#e6f0ff', borderRadius:8, paddingHorizontal:8, paddingVertical:3, marginRight:6, marginBottom:4}}>
                                  <Image source={require('../assets/icons/wifi.png')} style={{width:16, height:16, marginRight:3, resizeMode:'contain'}} />
                                  <Text style={{fontSize:12, color:'#176FF2'}}>{f.name}</Text>
                                </View>
                              ))
                            ) : (
                              <Text style={{fontSize:13, color:'#888'}}>Không có dịch vụ</Text>
                            )}
                          </View>
                        </View>
                        <TouchableOpacity onPress={handleHideRoomDetail} style={{ marginTop: 10, backgroundColor: '#1976d2', padding: 12, borderRadius: 8, marginHorizontal:18, marginBottom:18 }}>
                          <Text style={{ color: '#fff', textAlign: 'center', fontWeight:'bold', fontSize:16 }}>Đóng</Text>
                        </TouchableOpacity>
                      </ScrollView>
                    ) : (
                      <Text style={{padding:20}}>Đang tải thông tin phòng...</Text>
                    )}
                  </View>
                </View>
              </Modal>
              <View style={{width:'100%', height:10, backgroundColor:'#E0DCDC', marginVertical:10}} />
              <View style={styles.bookingcontainer}>
                <Text style={styles.yourbooking}>Booking của bạn</Text>
                <View style={styles.bookingTable}>
                  <View style={styles.bookingTableHeader}>
                    <Text style={[styles.bookingTableCell, styles.bookingTableHeaderCell, {flex:2}]}>Tên</Text>
                    <Text style={[styles.bookingTableCell, styles.bookingTableHeaderCell]}>Số lượng</Text>
                    <Text style={[styles.bookingTableCell, styles.bookingTableHeaderCell]}>Đơn vị</Text>
                    <Text style={[styles.bookingTableCell, styles.bookingTableHeaderCell]}>Giá</Text>
                  </View>
                  {/* Phòng */}
                  {bookingDetails?.items?.map((room: any, idx: number) => (
                    <View key={room.roomId?._id + idx} style={styles.bookingTableRow}>
                      <Text style={[styles.bookingTableCell, {flex:2}]}>{room.roomId?.name}</Text>
                      <Text style={styles.bookingTableCell}>{room.quantity}</Text>
                      <Text style={styles.bookingTableCell}>phòng</Text>
                      <Text style={styles.bookingTableCell}>{room.price ? (room.price * room.quantity).toLocaleString('vi-VN') : ''} VND</Text>
                    </View>
                  ))}
                  {/* Dịch vụ nếu có */}
                  {bookingDetails?.services?.map((service: any, idx: number) => (
                    <View key={service.serviceId?._id + idx} style={styles.bookingTableRow}>
                      <Text style={[styles.bookingTableCell, {flex:2}]}>{service.serviceId?.name}</Text>
                      <Text style={styles.bookingTableCell}>{service.quantity}</Text>
                      <Text style={styles.bookingTableCell}>{service.serviceId?.unit || ''}</Text>
                      <Text style={styles.bookingTableCell}>{service.price ? (service.price * service.quantity).toLocaleString('vi-VN') : ''} VND</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={{width:'100%', height:10, backgroundColor:'#E0DCDC', marginVertical:10}} />
              <View style={styles.bookingcontainer}>
                <Text style={styles.yourbooking}>Chi tiết giá</Text>
                <View style={styles.priceTable}>
                  <View style={styles.priceRowTable}>
                    <Text style={styles.priceLabel}>Phòng</Text>
                    <Text style={styles.priceValue}>{bookingDetails?.totalPrice?.toLocaleString('vi-VN') || '0'} VND</Text>
                  </View>
                  {bookingDetails?.services && bookingDetails.services.length > 0 && (
                    <View style={styles.priceRowTable}>
                      <Text style={styles.priceLabel}>Dịch vụ kèm theo</Text>
                      <Text style={styles.priceValue}>{(bookingDetails.services.reduce((sum: number, s: {price: number, quantity: number}) => sum + (s.price * s.quantity), 0)).toLocaleString('vi-VN')} VND</Text>
                    </View>
                  )}
                  {bookingDetails?.discount > 0 && (
                    <View style={[styles.priceRowTable, {backgroundColor:'#e6f0ff'}]}>
                      <Text style={[styles.priceLabel, {color:'#176FF2'}]}>Giảm giá voucher</Text>
                      <Text style={[styles.priceValue, {color:'#176FF2'}]}>- {bookingDetails.discount?.toLocaleString('vi-VN')} VND</Text>
                    </View>
                  )}
                  <View style={styles.priceRowTableTotal}>
                    <Text style={[styles.priceLabel, {fontWeight:'bold', fontSize:20}]}>Tổng cộng</Text>
                    <Text style={[styles.priceValue, {fontWeight:'bold', fontSize:20, color:'#e53935'}]}>{bookingDetails?.totalPriceAfterTax?.toLocaleString('vi-VN') || '0'} VND</Text>
                  </View>
                </View>
              </View>
              {/* <View style={{width:'100%', height:10, backgroundColor:'#E0DCDC', marginVertical:10}} />
              <View style={styles.bookingcontainer}>
                <View style={{ flexDirection: 'row' }}>
                  <Text style={styles.yourbooking}>Phương thức thanh toán</Text>
                  <Text style={{ color: 'red', fontSize: 20, marginLeft: 5 }}>*</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                  <Text style={styles.firsttext}>Trả hết</Text>
                  <Text style={styles.secondtext}>
                    {bookingDetails?.totalPriceAfterTax?.toLocaleString('vi-VN')} VND
                  </Text>
                  <View style={{ position: 'absolute', right: 0 }}>
                  <RadioButton
                      value="first"
                      status={checked === 'first' ? 'checked' : 'unchecked'}
                  />
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                  <Text style={styles.firsttext}>Trả một nửa</Text>
                  <Text style={styles.secondtext}>
                    {(bookingDetails?.totalPriceAfterTax / 2)?.toLocaleString('vi-VN')} VND
                  </Text>
                  <View style={{ position: 'absolute', right: 0 }}>
                  <RadioButton
                      value="second"
                      status={checked === 'second' ? 'checked' : 'unchecked'}
                  />
                  </View>
                </View>
                <Text style={{ width: '60%' }}>
                  Cần trả{' '}
                  {(bookingDetails?.totalPriceAfterTax / 2)?.toLocaleString('vi-VN')} VND hôm nay và
                  còn lại vào ngày {formatRoomDate(new Date(bookingDetails.checkinDate))}
                </Text>
              </View>
              <View style={{width:'100%', height:10, backgroundColor:'#E0DCDC', marginVertical:10}} />
              <View style={styles.bookingcontainer}>
                <Text style={styles.yourbooking}>Thông tin liên lạc</Text>
                <Text style={styles.firsttext}>{bookingDetails?.contactName || 'Chưa có tên liên lạc'}</Text>
                <Text style={styles.firsttext}>{bookingDetails?.contactPhone || 'Chưa có số điện thoại'}</Text>
              </View> */}
              <View style={{width:'100%', marginVertical:20}}>
                <View style={{ alignItems:'center', justifyContent:'center',alignContent:'center',width:'100%'}}>
                  <TouchableOpacity
                    style={styles.addpaymentmethod2}
                    onPress={handleCancelBooking}
                  >
                    <Text style={styles.boxText3}>Hủy</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
        </View>  
   ) }
  


const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#ffffff',
    },

    bookingcontainer:{
        marginLeft:20,
        marginTop:10,
        marginBottom:10,
        marginRight:10,
    },

    yourbooking:{
        fontSize:20,
        fontWeight:'bold',
    },

    firsttext:{
        fontSize:20,
        
    },

    secondtext:{
        fontSize:20,
        opacity: 0.6,
        marginLeft:20,
        
    },

    secondtext1:{
        fontSize:20,
        opacity: 0.6,
        marginLeft:20,
        position:'absolute',
        right:20,
    },

    rowwithicon:{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop:5,
    },

    arrowIcon:{
        marginRight:10,
    
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


    firsttext0:{
        fontSize:20,
        opacity:0.8,
        marginLeft:0,
      },
    
      edittext:{
        marginRight:0,
        fontSize:22,
        textDecorationLine:'underline',
        opacity:0.7,
      },
    
      secondtext0:{
        marginTop:10,
        fontSize:20,
        marginLeft:0,
      },
    
      input: {
        marginTop: 20,
        fontSize: 20,
        marginLeft: 0,
        borderWidth: 1,
        borderColor: 'gray',
        padding: 8,
        borderRadius:8,
        marginBottom:5,
      },
      
      saveButton: {
        width:60,
        backgroundColor: 'blue',
        padding: 10,
        marginTop: 20,
        alignItems: 'center',
        borderRadius:5,
        marginBottom:10,
      },
      saveButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
      },

      tableRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E0DCDC',
      },
      tableLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
      },
      tableValue: {
        fontSize: 16,
        flex: 2,
        textAlign: 'right',
      },

      bookingTable: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 10,
        overflow: 'hidden',
        marginTop: 10,
        marginBottom: 10,
    },
    bookingTableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f5f7fa',
        borderBottomWidth: 1,
        borderColor: '#e0e0e0',
        paddingVertical: 8,
    },
    bookingTableHeaderCell: {
        fontWeight: 'bold',
        color: '#176FF2',
        fontSize: 15,
    },
    bookingTableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#f0f0f0',
        backgroundColor: '#fff',
        paddingVertical: 6,
    },
    bookingTableCell: {
        flex: 1,
        fontSize: 14,
        color: '#222',
        textAlign: 'center',
        paddingHorizontal: 2,
    },
    priceTable: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        padding: 8,
        marginTop: 8,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.07,
        shadowRadius: 2,
    },
    priceRowTable: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    priceRowTableTotal: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 4,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        marginTop: 8,
    },
    priceLabel: {
        flex: 1,
        fontSize: 16,
        color: '#222',
        marginLeft: 4,
    },
    priceValue: {
        fontSize: 16,
        color: '#222',
        fontWeight: '600',
        minWidth: 100,
        textAlign: 'right',
    },
});


