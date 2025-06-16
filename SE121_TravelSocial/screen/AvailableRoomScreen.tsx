import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, Image, TouchableOpacity, TextInput, ScrollView, Alert, Platform, Modal, FlatList, Dimensions } from 'react-native';
import { NativeStackNavigatorProps } from 'react-native-screens/lib/typescript/native-stack/types';
import { iconMapping } from '../constants/icon';
import { RootStackParamList } from '@/types/navigation';
import { API_BASE_URL } from '../constants/config';
import axios from 'axios';
import { FontAwesome } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import ServiceOption2 from '../components/DetailScreen/ServiceOption2';
import { useUser } from '../context/UserContext';
import { trackEvents } from '../constants/recommendation';

const { width } = Dimensions.get('window');


interface Room {
    _id: string;
    name: string;
    bedType: string;
    area: number; 
    quantity: number; 
    pricePerNight: number;
    nights:number;
    image: string[]; 
    description: string;
    checkinDate: Date;
    checkoutDate: Date;
    facility: {
        id: string;
        name: string; 
        description?: string; 
        icon: string;
    }[];
    bed: {
        category: string;
        icon: string;
        quantity: number;
    }[];
}

export default function AvailableRoomScreen({ navigation }: {navigation: NativeStackNavigatorProps}) {
    const route = useRoute<RouteProp<RootStackParamList, 'available-room-screen'>>();
    const { id, checkinDate, checkoutDate, serviceOfLocation } = route.params;
    const { userId } = useUser();
    const [date1, setDate1] = useState(checkinDate);
    const [date2, setDate2] = useState(checkoutDate);
    
    const [selectedDate1, setSelectedDate1] = useState('');
    const [selectedDate2, setSelectedDate2] = useState('');
    const [showPicker1, setShowPicker1] = useState(false);
    const [showPicker2, setShowPicker2] = useState(false);    
    const [rooms, setRooms] = useState<Room[]>([]);
    const [services, setServices] = useState([]);
    const [isModalVisible, setModalVisible] = useState(false);
    const [isModalServiceVisible, setModalServiceVisible] = useState(false);
    const [selectedServices, setSelectedServices] = useState<any>([]);

    const [roomCount, setRoomCount] = useState(0);
    const [selectedRooms, setSelectedRooms] = useState(0);
    const [selectedRoomCounts, setSelectedRoomCounts] = useState<Record<string, number>>({});
    const [selectedServiceCounts, setSelectedServiceCounts] = useState(0);
    const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
    const [buttonText, setButtonText] = useState("Chọn");
    const [currentIndex, setCurrentIndex] = useState(0);

    const showDatePicker1 = () => {
        setShowPicker1(true);
    };
  
      const showDatePicker2 = () => {
        setShowPicker2(true);
    };

    const onDateChange1 = (_: any, selected: Date | undefined) => {
      setShowPicker1(false);
      if (selected) {
        if (selected > date2) {
          Alert.alert("Lỗi", "Ngày checkin phải nhỏ hơn hoặc bằng ngày checkout.");
        } else {
          
          setDate1(selected);
          const formattedDate = selected.toLocaleDateString('vi-VN');
          setSelectedDate1(formattedDate);
        }
      }
    };

    const onDateChange2 = (_: any, selected: Date | undefined) => {
      setShowPicker2(false);
      if (selected) {
        // Kiểm tra nếu ngày checkout nhỏ hơn ngày checkin
        if (selected < date1) {
          Alert.alert("Lỗi", "Ngày checkout phải lớn hơn hoặc bằng ngày checkin.");
        } else {
          setDate2(selected);
          const formattedDate = selected.toLocaleDateString('vi-VN');
          setSelectedDate2(formattedDate);
        }
      }
    };    

    const onScrollEnd = (e: any) => {
      const contentOffsetX = e.nativeEvent.contentOffset.x;
      const index = Math.round(contentOffsetX / width);
      setCurrentIndex(index);
    };

    const images = [
        require('../assets/images/room.jpg'),
        require('../assets/images/room.jpg'),
        require('../assets/images/room.jpg'),
    ];

    const getIcon = (iconName: string) => {
        return iconMapping[iconName] || iconMapping["default.png"];
    };

    useEffect(() => {
        const fetchAvailableRooms = async () => {
          try {
            const bookingResponse = await fetch(
              `${API_BASE_URL}/booking/getall`
            );
            const bookingData = await bookingResponse.json();
      
            if (Array.isArray(bookingData.data)) {
              const bookings = bookingData.data;

              const roomResponse = await fetch(
                `${API_BASE_URL}/room/getbylocationid/${id}`
              );
              const roomData = await roomResponse.json();
      
              if (Array.isArray(roomData.data)) {
                const rooms = roomData.data;


                const availableRooms = rooms.filter((room: any) => {
                  const isBooked = bookings.some((booking: any) => {
                    const bookingCheckin = new Date(booking.checkInDate).getTime();
                    const bookingCheckout = new Date(booking.checkOutDate).getTime();
                    
                    const userCheckin = new Date(checkinDate).getTime();
                    const userCheckout = new Date(checkoutDate).getTime();
                    // console.log('booking checkin: ',bookingCheckin);
                    // console.log('booking checkout: ',bookingCheckout);
                    // console.log('user checkin: ',userCheckin);
                    // console.log('user checkout: ',userCheckout);
                    
                    return (
                      room._id === booking?.items?.roomId && 
                      ((userCheckin >= bookingCheckin && userCheckin <= bookingCheckout) ||
                        (userCheckout >= bookingCheckin && userCheckout <= bookingCheckout))  
                    );
                  });
      
                  return !isBooked; 
                });
      
                setRooms(availableRooms); 
              }
            }
          } catch (error) {
            console.error('eError fetching rooms or bookings:', error);
          }
        };
      
        fetchAvailableRooms();
      }, [id, checkinDate, checkoutDate]);

    const handleApply = () => {
        {selectedRoomCounts[currentRoomId!] ? `Đã chọn ${selectedRoomCounts[currentRoomId!]} phòng` : "Chọn"}
        setModalVisible(false);
    };

    const handleApplyService = () => {
        {selectedRoomCounts[currentRoomId!] ? `Đã chọn ${selectedRoomCounts[currentRoomId!]} phòng` : "Chọn"}
        setModalServiceVisible(false);
    };
    
    const toggleModal = (roomId?: string) => {
        setCurrentRoomId(roomId || null);
        setModalVisible(!isModalVisible);
    };

    const toggleModalService = (roomId?: string) => {
        //setCurrentRoomId(roomId || null);
        setModalServiceVisible(!isModalServiceVisible);
    };

    const incrementRoomCount = (roomId: string) => {
        const room = rooms.find((r) => r._id === roomId); // Tìm thông tin phòng
        if (room) {
            const maxCount = room.quantity; // Lấy số lượng phòng có sẵn
            setSelectedRoomCounts((prevCounts) => {
                const currentCount = prevCounts[roomId] || 0;
                if (currentCount < maxCount) {
                    return {
                        ...prevCounts,
                        [roomId]: currentCount + 1,
                    };
                } else {
                    Alert.alert("Thông báo", `Chỉ còn ${maxCount} phòng khả dụng.`);
                    return prevCounts; // Không tăng nếu đã đạt giới hạn
                }
            });
        }
    };

    const decrementRoomCount = (roomId: string) => {
        setSelectedRoomCounts(prevCounts => {
            const currentCount = prevCounts[roomId] || 0;
            if (currentCount > 0) {
                return {
                    ...prevCounts,
                    [roomId]: currentCount - 1, 
                };
            }
            return prevCounts;
        });
    };

    type SelectedRoom = {
        roomId: string;
        count: number;
        roomDetails: {
          name: string;
          price: number;
          checkinDate: Date;
          checkoutDate: Date;
        };
    };    const handleConfirm = () => {
        const selectedRoomsData = Object.keys(selectedRoomCounts).map((roomId) => {
            const room = rooms.find((r) => r._id === roomId);
            return {
              roomId,
              count: selectedRoomCounts[roomId],
              roomDetails: {
                name: room?.name || '',
                price: room?.pricePerNight || 0,
                checkinDate: date1,
                checkoutDate: date2
              },
              nights: Math.abs((date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24)),
            };
        });

        if (selectedRoomsData.length === 0) {
            Alert.alert("Thông báo", "Vui lòng chọn ít nhất 1 phòng trước khi tiếp tục.");
            return;
        }
        const selectedServicesData = selectedServices.filter((service: any) => service.quantity > 0);

        // Track click event for the booking process
        if (userId && id) {
          trackEvents.click(userId, id, {
            action: 'proceed_to_booking',
            rooms_selected: selectedRoomsData.length,
            services_selected: selectedServicesData.length,
            checkin_date: date1.toISOString(),
            checkout_date: date2.toISOString()
          });
        }

        navigation.navigate('reservation-required-screen', {
          selectedRoomsData,
          selectedServicesData: selectedServicesData,
          locationId: id,
        });
    };

    return (

        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.arrowleftbutton} onPress={() => navigation.goBack()}>
                    <Image source={require('../assets/icons/arrowleft.png')} style={styles.arrowlefticon} />
                </TouchableOpacity>
                <View style ={{flexDirection:'row', alignItems:'center', alignContent:'center',justifyContent:'center', }}>
                    <View>
                        <Text style={{fontSize:18,fontWeight:'bold',}}>Phòng có sẵn</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.createButton}
                    onPress={handleConfirm}
                    >
                    <Text style={styles.createButtonText}>Xác nhận</Text>
                </TouchableOpacity>
            </View>
            {/* Thêm nút chọn dịch vụ kèm theo */}
            <View style={{alignItems:'flex-end', marginRight:20, marginBottom:10, zIndex: 100}}>
                <TouchableOpacity style={{backgroundColor:'#176FF2', borderRadius:8, paddingVertical:8, paddingHorizontal:16}} onPress={() => toggleModalService()}>
                    <Text style={{color:'white', fontWeight:'bold'}}>
                        {selectedServices.length > 0 ? `Đã chọn ${selectedServices.length} dịch vụ` : 'Chọn dịch vụ kèm theo'}
                    </Text>
                </TouchableOpacity>
            </View>
            <ScrollView style={styles.body}>
                <View style={styles.container}>
                <View style={styles.body}>
                {rooms.map((room, index) => (
                    <View key={index} style={styles.roomCard}>
                        <View style={styles.roomImageWrapper}>
                          {room.image && room.image.length > 1 ? (
                            <FlatList
                              data={room.image}
                              horizontal
                              pagingEnabled
                              showsHorizontalScrollIndicator={false}
                              keyExtractor={(item, idx) => item + idx}
                              renderItem={({ item }) => (
                                <Image
                                  source={{ uri: item }}
                                  style={styles.roomImagePro}
                                />
                              )}
                            />
                          ) : (
                            <Image
                              source={room.image && room.image.length > 0 ? { uri: room.image[0] } : require('../assets/images/room.jpg')}
                              style={styles.roomImagePro}
                            />
                          )}
                        </View>
                        <View style={styles.roomInfoBox}>
                          <Text style={styles.roomName}>{room.name}</Text>
                          <Text style={styles.roomDescriptionPro}>{room.description || 'Mô tả phòng hiện chưa có'}</Text>
                          <View style={styles.roomMetaRow}>
                            <View style={styles.metaItem}>
                              <FontAwesome name="bed" size={16} color="#176FF2" />
                              <Text style={styles.metaText}>{room.bed.map(b => `${b.category} x${b.quantity}`).join(', ')}</Text>
                            </View>
                            <View style={styles.metaItem}>
                              <FontAwesome name="arrows-alt" size={16} color="#176FF2" />
                              <Text style={styles.metaText}>{room.area} m²</Text>
                            </View>
                          </View>
                          <View style={styles.roomMetaRow}>
                            <View style={styles.metaItem}>
                              <FontAwesome name="users" size={16} color="#176FF2" />
                              <Text style={styles.metaText}>Tối đa {room.quantity} khách</Text>
                            </View>
                            <View style={styles.metaItem}>
                              <FontAwesome name="money" size={16} color="#2DD7A4" />
                              <Text style={[styles.metaText, { color: '#2DD7A4', fontWeight: 'bold' }]}>{room.pricePerNight.toLocaleString('vi-VN')} VND/đêm</Text>
                            </View>
                          </View>
                          <View style={styles.facilityRow}>
                            {room.facility.map((facility, idx) => (
                              <View key={facility.id + idx} style={styles.facilityBox}>
                                <Image source={getIcon(facility.id)} style={styles.facilityIcon} />
                                <Text style={styles.facilityText}>{facility.name}</Text>
                              </View>
                            ))}
                          </View>
                          <View style={styles.roomActionRow}>
                            <View style={styles.statusBox}>
                              <Text style={styles.statusLabel}>Còn lại:</Text>
                              <Text style={styles.statusValue}>{room.quantity} phòng</Text>
                            </View>
                            <TouchableOpacity style={styles.choosebuttonPro} onPress={() => toggleModal(room._id)}>
                              <Text style={styles.choosetextPro}>{selectedRoomCounts[room._id] ? `Đã chọn ${selectedRoomCounts[room._id]} phòng` : 'Chọn phòng'}</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                ))}

                </View>
                </View>  
                
            </ScrollView>

            <Modal visible={isModalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity onPress={()=>toggleModal()} style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>X</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Chọn số lượng phòng</Text>
                        <View style={styles.modalBody}>
                            <Text style={styles.modalText}>Số lượng phòng</Text>
                            <View style={styles.counterContainer}>
                                <TouchableOpacity onPress={()=>decrementRoomCount(currentRoomId!)} style={styles.counterButton}>
                                    <Text style={styles.counterButtonText}>-</Text>
                                </TouchableOpacity>
                                <Text style={styles.counterValue}>{selectedRoomCounts[currentRoomId!] || 0}</Text>
                                <TouchableOpacity onPress={()=>incrementRoomCount(currentRoomId!)} style={styles.counterButton}>
                                    <Text style={styles.counterButtonText}>+</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
                            <Text style={styles.applyButtonText}>Xác nhận</Text>
                        </TouchableOpacity>
                        
                    </View>
                </View>
            </Modal>

            <Modal visible={isModalServiceVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity onPress={()=>toggleModalService()} style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>X</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Chọn dịch vụ kèm theo</Text>
                        <ScrollView>
                            <ServiceOption2 services={serviceOfLocation} selectedServicess={selectedServices} onChangeSelectedServices={setSelectedServices} />
                        </ScrollView>
                        <TouchableOpacity style={styles.applyButton} onPress={handleApplyService}>
                            <Text style={styles.applyButtonText}>Xác nhận</Text>
                        </TouchableOpacity>
                        
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#E7E9F3',
    },

    body:{
    },

    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 10,
      },
      dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 5,
      },
      activeDot: {
        backgroundColor: 'blue',
      },
      inactiveDot: {
        backgroundColor: 'gray',
      },

    imageCarousel: {
        width: '100%',
        height: 220,
        marginBottom: 16, 
      },
    roomImage: {
        marginStart:0,
        marginTop: 10,
        width: 394, 
        height: 190,
        borderRadius: 10,
        marginRight: 0, 
    },

    roomCard: {
      backgroundColor: '#fff',
      borderRadius: 16,
      marginHorizontal: 10,
      marginVertical: 12,
      flexDirection: 'row',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 1,
      borderColor: '#e0e0e0',
      overflow: 'hidden',
    },
    roomImageWrapper: {
      width: 130,
      height: 130,
      borderTopLeftRadius: 16,
      borderBottomLeftRadius: 16,
      overflow: 'hidden',
      backgroundColor: '#f5f7fa',
      alignItems: 'center',
      justifyContent: 'center',
    },
    roomImagePro: {
      width: 130,
      height: 130,
      resizeMode: 'cover',
    },
    roomInfoBox: {
      flex: 1,
      padding: 14,
      justifyContent: 'space-between',
    },
    roomName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#176FF2',
      marginBottom: 4,
    },
    roomDescriptionPro: {
      fontSize: 13,
      color: '#666',
      marginBottom: 6,
    },
    roomMetaRow: {
      flexDirection: 'row',
      marginBottom: 4,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 18,
    },
    metaText: {
      fontSize: 13,
      color: '#444',
      marginLeft: 4,
    },
    facilityRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginVertical: 4,
    },
    facilityBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#e6f0ff',
      borderRadius: 8,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginRight: 6,
      marginBottom: 4,
    },
    facilityIcon: {
      width: 16,
      height: 16,
      marginRight: 3,
      resizeMode: 'contain',
    },
    facilityText: {
      fontSize: 12,
      color: '#176FF2',
    },
    roomActionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      justifyContent: 'space-between',
    },
    statusBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f5f7fa',
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    statusLabel: {
      fontSize: 13,
      color: '#888',
      marginRight: 4,
    },
    statusValue: {
      fontSize: 14,
      color: '#2DD7A4',
      fontWeight: 'bold',
    },
    choosebuttonPro: {
      borderRadius: 10,
      backgroundColor: '#176FF2',
      paddingVertical: 8,
      paddingHorizontal: 18,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 100,
    },
    choosetextPro: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
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

      modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        maxHeight: '80%',
        // width: '80%',
        // backgroundColor: 'white',
        // borderRadius: 10,
        // padding: 20,
        // alignItems: 'center',
        width: '90%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5, // Đổ bóng trên Android
        shadowColor: '#000', // Đổ bóng trên iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    closeButton: {
        alignSelf: 'flex-end',
    },
    closeButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginVertical: 10,
    },
    modalBody: {
        width: '100%',
        alignItems: 'center',
    },
    modalText: {
        fontSize: 16,
        marginVertical: 10,
    },
    counterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
    },
    counterButton: {
        backgroundColor: '#E7E9F3',
        padding: 10,
        borderRadius: 5,
        marginHorizontal: 10,
    },
    counterButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    counterValue: {
        fontSize: 18,
        marginHorizontal: 10,
    },
    applyButton: {
        backgroundColor: '#176FF2',
        padding: 10,
        borderRadius: 5,
        marginTop: 20,
        width: '100%',
        alignItems: 'center',
    },
    applyButtonText: {
        color: 'white',
        fontSize: 18,
    },

    createButton: {
        position: 'absolute',
        right: 10,
      },
      createButtonText: {
        color: '#196EEE',
        fontWeight: 'bold',
        fontSize: 16,
      }, 
});



