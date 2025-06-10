import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, Image, TouchableOpacity, TextInput, ScrollView, Alert, Platform, Linking, ActivityIndicator, Modal } from 'react-native';
import { NativeStackNavigatorProps } from 'react-native-screens/lib/typescript/native-stack/types';
import { RadioButton } from 'react-native-paper';
import { useRoute } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { RouteParams } from 'expo-router';
import { RootStackParamList } from '@/types/navigation';
import { API_BASE_URL } from '../constants/config';
import { useUser } from '../context/UserContext';
import { trackEvents } from '../constants/recommendation';

type ReservationRouteProp = RouteProp<RootStackParamList, 'reservation-required-screen'>;

interface RoomDetails {
    name: string;
    price: number;
    checkinDate: Date;
    checkoutDate: Date;
    pricePerNight: number;
}

interface SelectedRoomData {
    count: number;
    roomDetails: RoomDetails;
    roomId: string;
    nights: number;
}

export default function ReservationRequiredScreen({ navigation }: {navigation: NativeStackNavigatorProps}) {
    const route = useRoute<ReservationRouteProp>();
    const { selectedRoomsData,selectedServicesData ,locationId } = route.params;
    const { userId } = useUser();

    const formatRoomDate = (date: Date): string => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      };
    //console.log('xxx:',selectedRoomsData);
    const roomList = selectedRoomsData.map((room) => ({
        id: room.roomId,
        name: room.roomDetails.name,
        price: room.roomDetails.price,
        checkinDate: room.roomDetails.checkinDate,
        checkoutDate: room.roomDetails.checkoutDate,
        count: room.count,
    }));
    //console.log('selected room dataa: ',selectedRoomsData);

    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [name, setName] = useState({ firstName: '', lastName: '' });
    const [phoneNumber, setPhoneNumber] = useState('');
    const [displayName, setDisplayName] = useState({ firstName: '', lastName: '' });
    const [displayPhoneNumber, setDisplayPhoneNumber] = useState('');
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [checked, setChecked] = useState('first');
    const [locationDetails, setLocationDetails] = useState<any>(null);
    const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
    const [voucherList, setVoucherList] = useState<any[]>([]);
    const [voucherDetail, setVoucherDetail] = useState<any>(null);
    const [showVoucherModal, setShowVoucherModal] = useState(false);
    const [isCalculating, setIsCalculating] = useState(false);
    const [previewBookingId, setPreviewBookingId] = useState<string | null>(null);
    // Thêm state lưu giá giảm voucher (chưa thuế)
    const [voucherDiscount, setVoucherDiscount] = useState(0);

    const totalRooms = selectedRoomsData.reduce((sum, room) => sum + room.count, 0);

    const roomPrice = selectedRoomsData.reduce(
        (sum, room) => sum + room.roomDetails.price * room.count * room.nights,
        0
      );

      const calculateTotal = () => {
        //console.log('selectedServicesData:', selectedServicesData);
        return selectedServicesData?.reduce((total: any, item: any) => {
          return total + item.quantity * item.service.price;
        }, 0);
      };

    
    const servicePrice = calculateTotal();
    //   const cleaningFee = 15000.0;
    //   const serviceFee = roomPrice * 0.01;
      const tax = 0.0008 * (roomPrice + servicePrice);
      const totalPrice = roomPrice   + servicePrice;

      const [displayedTax, setDisplayedTax] = useState(tax);
      const [displayedTotalPrice, setDisplayedTotalPrice] = useState(totalPrice);
    
      const fetchLocationDetails = async (id: string) => {
        try {
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

    useEffect(() => {
        console.log('Received Rooms:', selectedRoomsData);
      }, [selectedRoomsData]);

      useEffect(() => {
        const fetchVouchers = async () => {
          try {
            const res = await fetch(`${API_BASE_URL}/voucher/getall`);
            const data = await res.json();
            if (data.isSuccess) setVoucherList(data.data || []);
          } catch (e) { console.log('Lỗi lấy voucher', e); }
        };
        fetchVouchers();
      }, []);

      const handleSelect = (option: string) => {
        setSelectedOption(option);
        setChecked(option);
        // Không set lại displayedTotalPrice ở đây!
      };



    const handleSave = (field: string) => {
        if (field === 'name') {
            setDisplayName({ firstName: name.firstName, lastName: name.lastName }); 
        } else if (field === 'phoneNumber') {
            setDisplayPhoneNumber(phoneNumber);
        }
        setIsEditing(null);
    };

    const handlePhoneNumberChange = (text: string) => {
        setPhoneNumber(text);
    };



    const renderField = (field: string) => {
        switch (field) {
        case 'name':
            return isEditing === 'name' ? (
            <>
                <TextInput
                style={styles.input}
                value={name.firstName}
                onChangeText={(text) => setName({ ...name, firstName: text })}
                placeholder="Họ"
                />
                <TextInput
                style={styles.input}
                value={name.lastName}
                onChangeText={(text) => setName({ ...name, lastName: text })}
                placeholder="Tên"
                />
                <TouchableOpacity style={styles.saveButton} onPress={() => handleSave('name')}>
                <Text style={styles.saveButtonText}>Lưu</Text>
                </TouchableOpacity>
            </>
            ) : (
            <Text style={styles.secondtext0}>{`${name.firstName} ${name.lastName}`}</Text>
            );
        case 'phoneNumber':
            return isEditing === 'phoneNumber' ? (
            <>
                <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={handlePhoneNumberChange}
                keyboardType="phone-pad"
                />
                <TouchableOpacity style={styles.saveButton} onPress={() => handleSave('phoneNumber')}>
                <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
            </>
            ) : (
                <Text style={styles.secondtext0}>{displayPhoneNumber || phoneNumber}</Text>
            );
        default:
            return null;
        }
    };

    // Hàm kiểm tra voucher hợp lệ
const verifyVoucher = async (voucher: any) => {
  try {
    const res = await fetch(`${API_BASE_URL}/voucher/getbycode/${voucher.code}`);
    const data = await res.json();
    if (!data || !data.data) return false;
    const v = data.data;
    const now = new Date();
    if (v.status !== 'active') return false;
    if (now < new Date(v.startDate) || now > new Date(v.endDate)) return false;
    if (v.usesCount >= v.maxUse) return false;
    if (v.minOderValue && totalPrice < v.minOderValue) return false;
    return true;
  } catch (e) {
    return false;
  }
};

// Khi chọn voucher, kiểm tra hợp lệ, cập nhật state và gọi lại API tính tổng tiền
const handleSelectVoucher = async (voucher: any) => {
  setIsCalculating(true);
  try {
    const valid = await verifyVoucher(voucher);
    if (!valid) {
      Alert.alert('Voucher không hợp lệ', 'Voucher đã hết hạn, hết lượt dùng hoặc không đủ điều kiện.');
      setIsCalculating(false);
      return;
    }
    setSelectedVoucher(voucher);
    // Wait for state update before recalculating
    await recalculateTotalPrice(voucher);
    setShowVoucherModal(false);
  } catch (e) {
    Alert.alert('Lỗi', 'Không thể áp dụng voucher. Vui lòng thử lại.');
  } finally {
    setIsCalculating(false);
  }
};

// Khi bỏ chọn voucher (nếu có), cũng cần cập nhật lại tổng tiền
useEffect(() => {
  if (!selectedVoucher) {
    recalculateTotalPrice(undefined);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [selectedVoucher]);

// Đảm bảo luôn có previewBookingId khi vào trang (kể cả khi không chọn voucher)
useEffect(() => {
  if (!previewBookingId) {
    createPreviewBooking().then((id) => {
      if (id) {
        setPreviewBookingId(id);
      }
    });
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

// Đảm bảo khi thay đổi selectedRoomsData hoặc selectedServicesData thì luôn tạo lại previewBookingId
useEffect(() => {
  createPreviewBooking().then((id) => {
    if (id) {
      setPreviewBookingId(id);
    }
  });
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [selectedRoomsData, selectedServicesData]);

// Đảm bảo khi voucher thay đổi, luôn cập nhật lại tổng tiền
useEffect(() => {
  if (selectedVoucher) {
    recalculateTotalPrice(selectedVoucher);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [selectedVoucher]);

// Thêm state lưu preview_bookingId
// Hàm tạo preview booking
const createPreviewBooking = async () => {
  try {
    const rooms = selectedRoomsData.map(room => ({
      roomId: room.roomId,
      quantity: room.count,
      nights: room.nights,
      price: room.roomDetails.price
    }));
    const services = selectedServicesData.map((service: any) => ({
      serviceId: service.service?._id || service.serviceId,
      quantity: service.quantity,
      price: service.service?.price || service.price
    }));
    
    const payload = { rooms, services };
    console.log('Payload for preview booking:', payload);
    const res = await fetch(`${API_BASE_URL}/booking/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.isSuccess && data.data) {
      setPreviewBookingId(data.data.previewId || data.data);
      return data.data.previewId || data.data;
    }
    return null;
  } catch (e) {
    setPreviewBookingId(null);
    return null;
  }
};

// Sửa lại recalculateTotalPrice để tính đúng tổng tiền và thuế
const recalculateTotalPrice = async (voucherObj?: any) => {
  setIsCalculating(true);
  try {
    const previewId = await createPreviewBooking();
    if (!previewId) {
      setDisplayedTotalPrice(totalPrice + tax);
      setDisplayedTax(tax);
      setVoucherDiscount(0);
      setIsCalculating(false);
      return;
    }
    setPreviewBookingId(previewId);
    let discount = 0;
    let priceBeforeTax = totalPrice;
    if (voucherObj) {
      try {
        const verifyPayload = {
          code: voucherObj.code,
          preview_bookingId: previewId
        };
        const voucherRes = await fetch(`${API_BASE_URL}/voucher/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(verifyPayload)
        });
        const voucherData = await voucherRes.json();
        if (voucherData.isSuccess && voucherData.data) {
          discount = voucherData.data.discount || 0;
          priceBeforeTax = totalPrice - discount;
          if (priceBeforeTax < 0) priceBeforeTax = 0;
        }
      } catch (e) {
        priceBeforeTax = totalPrice;
        discount = 0;
      }
    }
    setVoucherDiscount(discount);
    const newTax = 0.0008 * priceBeforeTax;
    setDisplayedTax(newTax);
    setDisplayedTotalPrice(priceBeforeTax + newTax);
  } catch (e) {
    setDisplayedTotalPrice(totalPrice + tax);
    setDisplayedTax(tax);
    setVoucherDiscount(0);
  } finally {
    setIsCalculating(false);
  }
};

    const handlePayment = async () => {
        // if (!phoneNumber || !name.firstName || !name.lastName) {
        //     Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin liên lạc.');
        //     return;
        // }

        if (!previewBookingId) {
            Alert.alert('Lỗi', 'Không thể tạo booking preview. Vui lòng thử lại.');
            return;
        }
        try {
            // Build booking payload
            const bookingData = {
                userId,
                dateBooking: new Date(),
                checkinDate: selectedRoomsData[0].roomDetails.checkinDate,
                checkoutDate: selectedRoomsData[0].roomDetails.checkoutDate,
                preview_bookingId: previewBookingId,
                ...(selectedVoucher?._id ? { voucherId: selectedVoucher._id } : {}), // Chỉ thêm voucherId nếu có
                contact: {
                    firstName: name.firstName,
                    lastName: name.lastName,
                    phoneNumber: phoneNumber,
                },
            };
            const response = await fetch(`${API_BASE_URL}/booking/createbooking`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData),
            });
            const result = await response.json();
            console.log('Booking creation result:', result);
            if (result.isSuccess && result.data && result.data._id) {
                // Track booking event
                if (userId && locationId) {
                    trackEvents.book(userId, locationId, {
                        total_price: displayedTotalPrice,
                        check_in_date: selectedRoomsData[0].roomDetails.checkinDate,
                        check_out_date: selectedRoomsData[0].roomDetails.checkoutDate,
                        rooms_count: selectedRoomsData.length,
                        booking_id: result.data._id,
                    });
                }
                // Navigate to payment screen with bookingId
                navigation.navigate('payment-method-screen', {
                    bookingId: result.data._id,
                    locationId: locationId,
                    totalPrice: displayedTotalPrice,
                    selectedRoomsData: selectedRoomsData,
                });
            } else {
                Alert.alert('Lỗi', result.message || 'Không thể tạo đặt chỗ.');
            }
        } catch (error) {
            console.error('Error creating booking:', error);
            Alert.alert('Lỗi', 'Không thể kết nối với máy chủ.');
        }
    };

    return (

        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.arrowleftbutton} onPress={() => navigation.goBack()}>
                <Image source={require('../assets/icons/arrowleft.png')} style={styles.arrowlefticon} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Yêu Cầu Đặt Chỗ</Text>
            </View>
            <ScrollView>
            <View style={{flexDirection:'row'}}>
                <View style={styles.imageContainer}>
                    <Image source={{ uri: locationDetails?.image?.[0].url }} style={styles.image} />
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
                            <Text style={styles.boxText}>mễn phí hủy trong 24h</Text>
                        </View>
                    </View>
                </View>
            </View>
            <View style ={{width:'100%', height:10, backgroundColor:'#E0DCDC', marginVertical:10, }}></View>
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
                  {selectedRoomsData.map((room, idx) => (
                    <View key={room.roomId + idx} style={styles.bookingTableRow}>
                      <Text style={[styles.bookingTableCell, {flex:2}]}>{room.roomDetails.name}</Text>
                      <Text style={styles.bookingTableCell}>{room.count}</Text>
                      <Text style={styles.bookingTableCell}>phòng</Text>
                      <Text style={styles.bookingTableCell}>{(room.roomDetails.price * room.nights)?.toLocaleString('vi-VN')} VND</Text>
                    </View>
                  ))}
                  {/* Dịch vụ */}
                  {selectedServicesData.map((service: any, idx: number) => (
                    <View key={service.service?._id + idx} style={styles.bookingTableRow}>
                      <Text style={[styles.bookingTableCell, {flex:2}]}>{service.service?.name}</Text>
                      <Text style={styles.bookingTableCell}>{service.quantity}</Text>
                      <Text style={styles.bookingTableCell}>{service.service?.unit || ''}</Text>
                      <Text style={styles.bookingTableCell}>{service.service?.price ? service.service.price.toLocaleString('vi-VN') : ''} VND</Text>
                    </View>
                  ))}
                </View>
            </View>
                        <View style ={{width:'100%', height:10, backgroundColor:'#E0DCDC', marginVertical:10, }}></View>


            <View style={styles.bookingcontainer}>
                <Text style={styles.yourbooking}>Chọn voucher</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginTop: 10}}>
                  {voucherList.map((voucher) => {
                    const isSelected = selectedVoucher?._id === voucher._id;
                    return (
                      <TouchableOpacity
                        key={voucher._id}
                        style={[
                          styles.voucherBox,
                          isSelected && styles.voucherBoxSelected
                        ]}
                        activeOpacity={0.85}
                        onPress={async () => {
                          setVoucherDetail(voucher);
                          setShowVoucherModal(true);
                        }}
                      >
                        <View style={styles.voucherHeader}>
                          <Image source={require('../assets/icons/ticket.png')} style={styles.voucherIcon} />
                          <Text style={styles.voucherTitle}>{voucher.name}</Text>
                        </View>
                        <Text style={styles.voucherCode}>Mã: {voucher.code}</Text>
                        <Text style={styles.voucherDiscount}>
                          Giảm: {voucher.discount.amount.toLocaleString('vi-VN')}{voucher.discount.type === 'percent' ? '%' : ' VND'}
                        </Text>
                        <Text style={styles.voucherDesc}>{voucher.description}</Text>
                        <Text style={styles.voucherCond}>
                          Đơn tối thiểu: {voucher.minOderValue?.toLocaleString('vi-VN') || 0} VND
                        </Text>
                        <Text style={styles.voucherDate}>
                          Hiệu lực: {voucher.startDate ? new Date(voucher.startDate).toLocaleDateString() : ''} - {voucher.endDate ? new Date(voucher.endDate).toLocaleDateString() : ''}
                        </Text>
                        <Text style={styles.voucherCount}>Số lượt còn lại: {voucher.maxUse - voucher.usesCount}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
            </View>

            <View style ={{width:'100%', height:10, backgroundColor:'#E0DCDC', marginVertical:10, }}></View>
            <View style={styles.bookingcontainer}>
                <Text style={styles.yourbooking}>Chi tiết giá</Text>
                <View style={styles.priceTable}>
                  <View style={styles.priceRowTable}>
                    <Image source={require('../assets/icons/room.png')} style={styles.priceIcon} />
                    <Text style={styles.priceLabel}>Phòng ({totalRooms} phòng)</Text>
                    <Text style={styles.priceValue}>{roomPrice.toLocaleString('vi-VN')} VND</Text>
                  </View>
                  <View style={styles.priceRowTable}>
                    <Image source={require('../assets/icons/service.png')} style={styles.priceIcon} />
                    <Text style={styles.priceLabel}>Dịch vụ kèm theo</Text>
                    <Text style={styles.priceValue}>{calculateTotal()?.toLocaleString('vi-VN')} VND</Text>
                  </View>
                  {/* Nếu có thuế, có thể thêm dòng thuế ở đây */}
                  <View style={styles.priceRowTable}>
                    <Image source={require('../assets/icons/tax.png')} style={styles.priceIcon} />
                    <Text style={styles.priceLabel}>Thuế</Text>
                    <Text style={styles.priceValue}>{displayedTax?.toLocaleString('vi-VN')} VND</Text>
                  </View>
                  {selectedVoucher && voucherDiscount > 0 && (
                    <View style={[styles.priceRowTable, {backgroundColor:'#e6f0ff'}]}> 
                      <Image source={require('../assets/icons/ticket.png')} style={styles.priceIcon} />
                      <Text style={[styles.priceLabel, {color:'#176FF2'}]}>Giảm giá voucher</Text>
                      <Text style={[styles.priceValue, {color:'#176FF2'}]}>- {voucherDiscount?.toLocaleString('vi-VN')} VND</Text>
                    </View>
                  )}
                  <View style={styles.priceRowTableTotal}>
                    <Text style={[styles.priceLabel, {fontWeight:'bold', fontSize:20}]}>Tổng cộng</Text>
                    <Text style={[styles.priceValue, {fontWeight:'bold', fontSize:20, color:'#e53935'}]}>{displayedTotalPrice.toLocaleString('vi-VN')} VND</Text>
                  </View>
                </View>
            </View>

            <View style ={{width:'100%', height:10, backgroundColor:'#E0DCDC', marginVertical:10, }}></View>
            <View style={styles.bookingcontainer}>
                <View style={{flexDirection:'row'}}>
                    <Text style={styles.yourbooking}>Phương thức thanh toán</Text>
                    <Text style={{color:'red', fontSize:20, marginLeft:5}}>*</Text>
                </View>
                <View style={{flexDirection:'row', alignItems:'center', marginTop:10,}}>
                    <Text style={styles.firsttext}>Trả hết</Text>
                    <Text style={styles.secondtext}>
                      {displayedTotalPrice.toLocaleString('vi-VN')} VND
                    </Text>
                    <View style={{position:'absolute', right:0,}}>
                        <RadioButton
                          value="first"
                          status={checked === 'first' ? 'checked' : 'unchecked'}
                          onPress={() => handleSelect('first')}
                        />
                      </View>
                    
                </View>
                <View style={{flexDirection:'row', alignItems:'center', marginTop:10,}}>
                    <Text style={styles.firsttext}>Trả một nửa</Text>
                    <Text style={styles.secondtext}>
                      {(displayedTotalPrice / 2).toLocaleString('vi-VN')} VND
                    </Text>
                    <View style={{position:'absolute', right:0,}}>
                        <RadioButton
                          value="second"
                          status={checked === 'second' ? 'checked' : 'unchecked'}
                          onPress={() => handleSelect('second')}
                        />
                      </View>
                    
                </View>
                <Text style={{width:'60%',}}>
                  Cần trả {(checked === 'second' ? (displayedTotalPrice / 2) : displayedTotalPrice).toLocaleString('vi-VN')} VND hôm nay và còn lại vào ngày {formatRoomDate(selectedRoomsData[0].roomDetails.checkinDate)}
                </Text>
                
            </View>

            <View style ={{width:'100%', height:10, backgroundColor:'#E0DCDC', marginVertical:10, }}></View>
            
            <View style={styles.bookingcontainer}>
                <View style={{flexDirection:'row'}}>
                    <Text style={styles.yourbooking}>Thông tin liên lạc</Text>
                    <Text style={{color:'red', fontSize:20, marginLeft:5}}>*</Text>
                </View>
                <TouchableOpacity 
                style={styles.rowwithicon}         
                onPress={() => setIsEditing(isEditing === 'phoneNumber' ? null : 'phoneNumber')}
                >
                    <Text style={styles.firsttext}>{phoneNumber ? phoneNumber : 'Số điện thoại'}</Text>
                    <Image
                        source={isEditing === 'phoneNumber'
                            ? require('../assets/icons/arrowdown.png')
                            : require('../assets/icons/arrowright.png')}
                        style={styles.arrowIcon}
                    />                    
                </TouchableOpacity>
                {isEditing === 'phoneNumber' && renderField('phoneNumber')}
                <TouchableOpacity
                style={styles.rowwithicon} 
                onPress={() => setIsEditing(isEditing === 'name' ? null : 'name')}
                >
                    <Text style={styles.firsttext}>{name.firstName || name.lastName ? `${name.firstName} ${name.lastName}` : 'Tên'}</Text>
                    <Image
                        source={isEditing === 'name'
                            ? require('../assets/icons/arrowdown.png')
                            : require('../assets/icons/arrowright.png')}
                        style={styles.arrowIcon}
                    />                   
                    </TouchableOpacity>
                {isEditing === 'name' && renderField('name')}

            </View>

            <View style ={{width:'100%', height:10, backgroundColor:'#E0DCDC', marginVertical:10, }}></View>
            <View style={styles.bookingcontainer}>
            <View style={{flexDirection:'row'}}>
                    <Text style={styles.yourbooking}>Lưu ý</Text>
                    <Text style={{color:'red', fontSize:20, marginLeft:5}}>*</Text>
                </View>
            </View>
            
            <View style={{width:'100%', marginVertical:20,}}>                <View style = {{  alignItems:'center', justifyContent:'center',alignContent:'center',width:'100%'}}>
                    
                    <TouchableOpacity 
                        style={styles.addpaymentmethod2} 
                        onPress={handlePayment}
                    >
                        <Text style={styles.boxText3}>Tiếp tục để thanh toán</Text>
                    </TouchableOpacity>
                </View>
            </View>

            
            {/* Modal hiển thị chi tiết voucher */}
<Modal
  visible={showVoucherModal}
  transparent
  animationType="slide"
  onRequestClose={() => setShowVoucherModal(false)}
>
  <View style={{flex:1, backgroundColor:'rgba(0,0,0,0.4)', justifyContent:'center', alignItems:'center'}}>
    <View style={{backgroundColor:'#fff', borderRadius:16, padding:24, width:'80%'}}>
      <Text style={{fontWeight:'bold', fontSize:20, marginBottom:8}}>Chi tiết voucher</Text>
      {voucherDetail && (
        <>
          <Text style={{fontSize:16, marginBottom:4}}>Tên: {voucherDetail.name}</Text>
          <Text style={{fontSize:16, marginBottom:4}}>Mã: {voucherDetail.code}</Text>
          <Text style={{fontSize:16, marginBottom:4}}>Giảm: {voucherDetail.discount.amount.toLocaleString('vi-VN')}{voucherDetail.discount.type === 'percent' ? '%' : ' VND'}</Text>
          <Text style={{fontSize:16, marginBottom:4}}>Điều kiện: Đơn tối thiểu {voucherDetail.minOderValue?.toLocaleString('vi-VN') || 0} VND</Text>
          <Text style={{fontSize:16, marginBottom:4}}>Hiệu lực: {voucherDetail.startDate ? new Date(voucherDetail.startDate).toLocaleDateString() : ''} - </Text>
          <Text style={{fontSize:16, marginBottom:4}}>Số lượt còn lại: </Text>
        </>
      )}
      <View style={{flexDirection:'row', justifyContent:'flex-end', marginTop:16}}>
        <TouchableOpacity onPress={() => setShowVoucherModal(false)} style={{marginRight:16}}>
          <Text style={{color:'#176FF2', fontWeight:'bold'}}>Đóng</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={async () => {
            if (voucherDetail) {
              await handleSelectVoucher(voucherDetail);
            }
          }}
        >
          <Text style={{color:'#fff', backgroundColor:'#176FF2', paddingHorizontal:16, paddingVertical:8, borderRadius:8, fontWeight:'bold'}}>Áp dụng</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>

            </ScrollView>
        </View>  
);
}

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

      // Thêm style cho voucher
      voucherBox: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 16,
        marginRight: 16,
        minWidth: 220,
        maxWidth: 260,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        justifyContent: 'space-between',
      },
      voucherBoxSelected: {
        borderColor: '#176FF2',
        backgroundColor: '#e6f0ff',
        shadowColor: '#176FF2',
        shadowOpacity: 0.3,
      },
      voucherHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
      },
      voucherIcon: {
        width: 28,
        height: 28,
        marginRight: 8,
        resizeMode: 'contain',
      },
      voucherTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#176FF2',
        flex: 1,
        flexWrap: 'wrap',
      },
      voucherCode: {
        fontSize: 14,
        color: '#333',
        marginBottom: 2,
      },
      voucherDiscount: {
        fontSize: 15,
        color: '#e53935',
        fontWeight: 'bold',
        marginBottom: 2,
      },
      voucherDesc: {
        fontSize: 13,
        color: '#666',
        marginBottom: 2,
      },
      voucherCond: {
        fontSize: 13,
        color: '#444',
        marginBottom: 2,
      },
      voucherDate: {
        fontSize: 12,
        color: '#888',
        marginBottom: 2,
      },
      voucherCount: {
        fontSize: 12,
        color: '#176FF2',
        fontWeight: 'bold',
        marginTop: 2,
      },

      // Thêm style cho business price row
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
      priceIcon: {
        width: 22,
        height: 22,
        marginRight: 6,
        resizeMode: 'contain',
        alignSelf: 'center',
      },

      // Thêm style cho bảng booking
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
});
