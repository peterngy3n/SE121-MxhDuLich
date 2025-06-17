import React, { useEffect, useState, useContext } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, ScrollView, Linking, TextInput, Alert, SafeAreaView, StatusBar, FlatList } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import Facility from '@/components/HomeScreen/Facility';
import axios from 'axios';
import { NativeStackNavigatorProps } from 'react-native-screens/lib/typescript/native-stack/types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRoute, RouteProp } from '@react-navigation/native';
import { API_BASE_URL } from '../../constants/config';
import { Icon } from 'react-native-paper';
import { iconMapping } from '../../constants/icon';
import CustomModal from '@/components/CollectionScreen/AddIntoCollection';
import ImageCarousel from '@/components/HomeScreen/ImageCarousel';
import Recommendation from '@/components/DetailScreen/Recommendation';
import ServiceOption from '@/components/DetailScreen/ServiceOption';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trackEvents } from '../../constants/recommendation';
import { useUser } from '../../context/UserContext';

const { width, height } = Dimensions.get('window');

const GOOGLE_MAPS_API_KEY = 'AIzaSyBeCTs9sMcGjsjlIIIiML2TXrLqOZSEY6s';
const ADDRESS = 'FFXQ+X94, Bung Riềng, Xuyên Mộc, Bà Rịa - Vũng Tàu, Vietnam';


type RootStackParamList = {
  'detail-screen': { id: string }; 
};

type LikedItems = {
  [key: string]: boolean;
};

type DetailScreenRouteProp = RouteProp<RootStackParamList, 'detail-screen'>;

export default function DetailScreen({navigation} : {navigation : NativeStackNavigatorProps}) {
  const route = useRoute<DetailScreenRouteProp>();
  const { id } = route.params;
  const { userId } = useUser();
  
  interface Service {
    _id: string;
    id: string;
    roomId: string;
    name: string;
    quantity: number;
    icon: string;
    description: string;
  }

  interface Review {
    senderId: string;
    review: string;
    rating: number;
    image: { url: string }[];
  }

  type FacilityIcons = {
    [key: string]: string; // Cho phép dùng các khóa kiểu string
};



  const getIcon = (iconName: string) => {
    return iconMapping[iconName] || iconMapping["default.png"];
  };


const facilityIcons: FacilityIcons = {
    "Wifi miễn phí": "wifi",
    "Máy lạnh": "ac-unit",
    "Kitchen": "Kitchen", 
    "Hồ bơi": "pool",
    "Lửa trái": "fire",
    "Bãi đỗ xe": "local-parking",
    "Nhà hàng": "restaurant",
    "Phòng gym": "fitness-center",
    "Spa": "spa",
    "Bar": "local-bar",
    "Dịch vụ khác": "help",
};
  
  const [services, setServices] = useState<Service[]>([]);  // Khai báo rõ ràng kiểu dữ liệu
  const [servicesOfLocation, setServicesOfLocation] = useState([]);  // Khai báo rõ ràng kiểu dữ liệu

  
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLiked, setIsLiked] = useState(false);

    const [date1, setDate1] = useState<Date | null>(null);
    const [date2, setDate2] = useState<Date | null>(null);
    const [showPicker1, setShowPicker1] = useState(false);
    const [showPicker2, setShowPicker2] = useState(false);
    const [selectedDate1, setSelectedDate1] = useState('');
    const [selectedDate2, setSelectedDate2] = useState('');
    const [locationDetails, setLocationDetails] = useState<any>(null);
    //const [services, setServices] = useState<string[]>([]);
    const [minPrice, setMinPrice] = useState(0);
    const [roomsStatus, setRoomsStatus] = useState('');
    const [likedItems, setLikedItems] = useState<LikedItems>({});
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [userNames, setUserNames] = useState<{ [key: string]: string }>({});
    const [reviewCount, setReviewCount] = useState(0);
    const [userAvatars, setUserAvatars] = useState<{ [key: string]: { url: string } }>({});



    const showDatePicker1 = () => {
      setShowPicker1(true);
    };

    const showDatePicker2 = () => {
      setShowPicker2(true);
    };
  
    // Hàm xử lý khi chọn ngày
    const onDateChange1 = (_: any, selected: Date | undefined) => {
      setShowPicker1(false);
      if (selected) {
        if (date2 && selected > date2) {
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
        if (date1 && selected < date1) {
          Alert.alert("Lỗi", "Ngày checkout phải lớn hơn hoặc bằng ngày checkin.");
        } else {
          setDate2(selected);
          const formattedDate = selected.toLocaleDateString('vi-VN');
          setSelectedDate2(formattedDate);
        }
      }
    };

    const toggleLike = () => {
        

    };    const handlePress = (id: string) => {
      const newLikedState = !isLiked;
      setIsLiked(newLikedState);
      setLikedItems((prevState) => ({
        ...prevState,
        [id]: newLikedState,
      }));
      setSelectedLocationId(id);
      setModalVisible(true); 
      
      // Track favorite event to recommendation system
      if (userId) {
        trackEvents.favorite(userId, id, newLikedState);
        console.log(`Tracked favorite event for user: ${userId}, location: ${id}, state: ${newLikedState ? 'liked' : 'unliked'}`);
      }
    };

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [visibleCount, setVisibleCount] = useState(5); // Hiển thị 3 phản hồi đầu tiên

    const handleLoadMore = () => {
      setVisibleCount((prev) => prev + 5); // Mỗi lần load thêm 3 phản hồi
    };

    const getCoordinatesFromAddress = async (address: string) => {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;

        try {
            const response = await axios.get(url);
            if (response.data.status === 'OK') {
                const location = response.data.results[0].geometry.location;
                setLatitude(location.lat);
                setLongitude(location.lng);
            } else {
                console.log('Không thể lấy tọa độ:', response.data.status);
            }
        } catch (error) {
            console.error('Lỗi khi gọi Geocoding API:', error);
        }
    };

    //Gọi hàm lấy tọa độ khi component được render
    useEffect(() => {
        getCoordinatesFromAddress(ADDRESS);
    }, []);
    
    // Track view event when the component loads
    useEffect(() => {
        if (userId && id) {
            // Log view event to recommendation system
            trackEvents.view(userId, id, { source: 'detail_screen' });
            console.log(`Tracked view event for user: ${userId}, location: ${id}`);
        }
    }, [userId, id]);

    useEffect(() => {
      if (locationDetails?.address) {
          getCoordinatesFromAddress(locationDetails?.address);
      }
  }, [locationDetails]);

    const openMap = () => {
      navigation.navigate('view-map-screen')
        // if (latitude && longitude) {
        //     const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
        //     Linking.openURL(url).catch(err => console.error("Không thể mở Google Maps", err));
        // } else {
        //     console.log('Tọa độ không khả dụng');
        //}
    };

    useEffect(() => {
      if (id) {
        fetchLocationDetails(id); // Gọi API lấy thông tin chi tiết
      }
    }, [id]);

    useEffect(() => {
      if (locationDetails?._id) {
        fetchRoomServices(locationDetails._id); 
        fetchservices (locationDetails._id); // Gọi API lấy dịch vụ của địa điểm
      }
    }, [locationDetails]);

    // Hàm lưu vào localStorage (AsyncStorage)
const storeLocationDetails = async (data: any) => {
  try {
    const jsonValue = JSON.stringify(data);
    await AsyncStorage.setItem('@location_details', jsonValue);
    await AsyncStorage.setItem('lastViewedLocationId', data._id); // Lưu ID địa điểm đã xem gần nhất
  } catch (e) {
    console.error('Error saving location details:', e);
  }
};

    const fetchLocationDetails = async (id: string) => {
      try {
        const response = await fetch(`${API_BASE_URL}/locationbyid/${id}`);
        const data = await response.json();
        if (data.isSuccess) {
          setLocationDetails(data.data);
          await storeLocationDetails(data.data);
        } else {
          console.error('API error:', data.error);
        }
      } catch (error) {
        console.error('Fetch error:', error);
      }
    };

    const fetchRoomServices = async (locationId: string) => {
      try {
        const response = await fetch(`${API_BASE_URL}/room/getbylocationid/${locationId}`);
        const result = await response.json();
    
        if (result.isSuccess && result.data) {
          
          // Lấy danh sách dịch vụ từ tất cả các phòng
          const allServices = result.data.flatMap((room: any) => room.facility || []);
          const uniqueServices = Array.from(new Set(allServices.map((service: any) => service.id)))
                                  .map((id) => {
                                    return allServices.find((service: any) => service.id === id); // Lấy thông tin dịch vụ
                                  }); // Loại bỏ dịch vụ trùng lặp
          setServices(uniqueServices);
        } else {
          //console.error('Error fetching room services:', result.error);
        }

        const allPrices = result.data?.map((room:any) => room.pricePerNight);
        const minPrice =Math.min(...allPrices);
        setMinPrice(minPrice);

        if (result.isSuccess && Array.isArray(result.data)){
          const availableRooms = result.data?.filter((room: any) => room?.quantity > 0);
        
          if (availableRooms.length > 0){
            setRoomsStatus('Còn phòng');
          } else {
            setRoomsStatus('Hết phòng');
          }
        } else {
          setRoomsStatus('Hết phòng');
        }



      } catch (error) {
        // console.error('Error fetching room services:', error);
      }
    };

    useEffect(() => {
      const fetchReviews = async () => {
        setLoadingReviews(true);
        try {
          const response = await fetch(`${API_BASE_URL}/review/location/${id}`);
          const result = await response.json();
    
          if (response.ok && result.isSuccess) {
            setReviewCount(result.data.length);
            setReviews(result.data);
            const userPromises = result.data.map(async (review: any) => {
              const userResponse = await fetch(`${API_BASE_URL}/user/getbyid/${review.senderId}`);
              const userResult = await userResponse.json();
              return {
                senderId: review.senderId,
                name: userResult.data?.userName || 'Ẩn danh',
                avatar: userResult.data?.userAvatar?.url || null,
              };
            });

            const userNamesArray = await Promise.all(userPromises);
            const userNamesMap = userNamesArray.reduce((acc, user) => {
              acc[user.senderId] = user.name;
              return acc;
            }, {});
            setUserNames(userNamesMap);
            // Build avatar map
            const userAvatarsMap = userNamesArray.reduce((acc, user) => {
              acc[user.senderId] = { url: user.avatar };
              return acc;
            }, {});
            setUserAvatars(userAvatarsMap);
          } else {
            // Alert.alert('Lỗi', result.message || 'Không thể lấy phản hồi.');
          }
        } catch (error) {
          console.error('Error fetching reviews:', error);
          Alert.alert('Lỗi', 'Không thể kết nối với máy chủ.');
        } finally {
          setLoadingReviews(false);
        }
      };
    
      fetchReviews();
    }, [id]);

    const fetchservices = async (id : any) => {
      
      try {
        const response = await fetch(`${API_BASE_URL}/service/location/${id}`);
        const result = await response.json();
        if (response.ok && result.isSuccess) {
          
          setServicesOfLocation(result.data);
        } else {
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
        Alert.alert('Lỗi', 'Không thể kết nối với máy chủ.');
      } 
    };

    const renderImage = ({ item }: { item: { _id: string; url: string } }) => (
      <Image
        
        source={{ uri: item.url }}
        style={styles.image}
      />
    )

    const servicesoption = [
      { icon: 'bicycle', text: 'Thuê xe đạp giá rẻ' },
      { icon: 'car', text: 'Xe đưa rước tận nơi' },
      { icon: 'tshirt', text: 'Dịch vụ giặt là giá rẻ' },
      { icon: 'camera', text: 'Thuê máy ảnh giá rẻ' },
      // ... thêm các dịch vụ cần thiết
    ];
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f4f8' }}>
      <View style={styles.container}>
        <ScrollView >
          {/* Hình ảnh và nút quay lại */}
          <View style={styles.imageContainer}>


          <ImageCarousel images={locationDetails?.image} />

            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <FontAwesome name="arrow-left" size={24} color="#1E90FF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('chat-board-screen')} style={styles.messageButton}>
                <Image style={{width:30, height:30}} source={require('../../assets/icons/message.png')}></Image>
              {/* <FontAwesome name="message" size={24} color="#FF4500" /> */}
            </TouchableOpacity>
            <TouchableOpacity style={styles.heartButton} onPress={() => handlePress(id.toString())}>
              <FontAwesome name="heart" size={24}  color={isLiked ? "red" : "#000"} />
            </TouchableOpacity>
            <CustomModal visible={modalVisible} onClose={() => setModalVisible(false)} onSelectCollection={(collectionId:any)=>console.log('selected:', collectionId)} selectedLocationId={selectedLocationId}></CustomModal>

          </View>

          {/* Thông tin địa điểm */}
          <View style={styles.infoSection}>
          <View style = {styles.header}>
            <Text style={styles.title}>{locationDetails?.name || 'Tên địa điểm'}</Text>
            <TouchableOpacity onPress={openMap} >
                <Text style = {styles.showMap}>Map</Text>
            </TouchableOpacity>
          </View>
            
            <View style={styles.rating}>
              <FontAwesome name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>{locationDetails?.rating || '0'} ({reviewCount || 0} Đánh giá)</Text>
            </View>
            <View>
            <Text style={styles.description}  
                    numberOfLines={isExpanded ? undefined : 4}
                    ellipsizeMode="tail">
                    {locationDetails?.description || 'Mô tả chưa có sẵn.'}
                </Text>
                <TouchableOpacity onPress={toggleExpanded}>
                    <Text style={styles.readMore}>
                        {isExpanded ? 'Thu gọn' : 'Xem thêm'}
                    </Text>
                </TouchableOpacity>

            </View>
            {/* Tiện ích */}
            <Text style={styles.facilityTitle}>Dịch vụ</Text>


            <View style={styles.facilityContainer}>
              {services.map((service, index) => (
                <View style={styles.facilityItem} key={index}>
                    <Image source={getIcon(service?.id)}/>
                  <Text style={styles.facilityText}>{service?.name}</Text>
                </View>
              ))}
            </View>

            <View style={styles.section}>
            <Text style={styles.title2}>Tìm phòng</Text>

            {/* Checkin Date - Checkout Date Input */}
            <View style={{flexDirection:'row', justifyContent:'space-between'}}>
              <View style={[styles.inputContainer, {width:'47%'}]}>
                
                <TouchableOpacity style={{flex:1, flexDirection:'row', alignItems:'center'}} onPress={showDatePicker1} activeOpacity={0.8}>
                  <FontAwesome name="calendar" size={20} color="gray" style={styles.iconLeft} />
                  <TextInput
                    placeholder="Checkin"
                    value={selectedDate1}
                    style={styles.input}
                    editable={false}
                    pointerEvents="none"
                  />
                </TouchableOpacity>
                {showPicker1 && (
                  <DateTimePicker
                    value={date1 || new Date()}
                    mode="date"
                    display="default"
                    onChange={onDateChange1}
                  />
                )}
              </View>
              <View style={[styles.inputContainer,{width:'47%'}]}>
                <TouchableOpacity style={{flex:1, flexDirection:'row', alignItems:'center'}} onPress={showDatePicker2} activeOpacity={0.8}>
                  <FontAwesome name="calendar" size={20} color="gray" style={styles.iconLeft} />
                  <TextInput
                    placeholder="Checkout"
                    value={selectedDate2}
                    style={styles.input}
                    editable={false}
                    pointerEvents="none"
                  />
                </TouchableOpacity>            
                {showPicker2 && (
                  <DateTimePicker
                    value={date2 || new Date()}                    mode="date"
                    display="default"
                    onChange={onDateChange2}
                  />
                )}
              </View>
            </View>

            {/* Number of People  */}
            {/* <View style={styles.inputContainer}>
              <FontAwesome name="user" size={20} color="gray" style={styles.iconLeft} />
              <TextInput
                placeholder="Số người"
                style={styles.input}
                keyboardType="numeric"
              />
              <FontAwesome name="chevron-down" size={20} color="gray" style={styles.iconRight} />
            </View>             */}
            <TouchableOpacity onPress={()=> {
              if (!date1 || !date2) {
                Alert.alert('Thông báo', 'Vui lòng chọn ngày checkin và checkout trước khi tìm phòng.');
                return;
              }
              if (userId && locationDetails._id) {
                trackEvents.click(userId, locationDetails._id, { 
                  action: 'search_rooms',
                  checkin_date: date1?.toISOString(),
                  checkout_date: date2?.toISOString()
                });
                console.log(`Tracked search/click event for user: ${userId}, location: ${locationDetails._id}`);
              }
              navigation.navigate('available-room-screen', {
                id: locationDetails._id,
                checkinDate: date1, // Gửi ngày checkin
                checkoutDate: date2,
                serviceOfLocation: servicesOfLocation // Gửi dịch vụ của địa điểm
              });
            }} style={styles.searchButton}>
              <Text style={styles.searchButtonText}>Tìm kiếm</Text>
            </TouchableOpacity>
          </View>

          <ServiceOption services={servicesOfLocation}></ServiceOption>

          {/* Feedback Section */}
          <View style={styles.section}>
            <Text style={styles.title2}>Phản hồi từ người dùng</Text>

            {loadingReviews ? (
              <Text>Đang tải phản hồi...</Text>
            ) : reviews.length > 0 ? (
              <>
              {reviews.slice(0, visibleCount).map((review, index) => (
                <View style={styles.reviewframe} key={index}>
                  <View style={styles.feedbackContainer}>
                    <View style={styles.avatarContainer}>
                      <Image
                        source={userAvatars[review.senderId]?.url ? { uri: userAvatars[review.senderId].url } : require('../../assets/images/avt.png')}
                        style={styles.avatar}
                      />
                    </View>
                    <View>
                      <Text style={styles.customerName}>{userNames[review.senderId] || 'Ẩn danh'}</Text>
                      <View style={styles.rating}>
                        {[...Array(5)].map((_, i) => (
                          <Image
                            key={i}
                            source={
                              i < (review.rating || 0)
                                ? require('../../assets/icons/star.png')
                                : require('../../assets/icons/emptystar.png')
                            }
                            style={{ width: 15, height: 15, marginRight: 3 }}
                          />
                        ))}
                      </View>
                    </View>
                  </View>
                  <Text style={styles.feedbackText}>{`"${review.review || 'Không có nhận xét.'}"`}</Text>
                  {review.image && review.image.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                      {review.image.map((img, idx) => (
                        <Image
                          key={img?.url + idx}
                          source={{ uri: img?.url }}
                          style={{ width: 120, height: 90, borderRadius: 8, marginRight: 8, resizeMode: 'cover' }}
                        />
                      ))}
                    </ScrollView>
                  )}
                </View>
                
              ))}
               {/* Hiện nút "Xem thêm" nếu còn review chưa hiển thị */}
          {visibleCount < reviews.length && (
            <TouchableOpacity onPress={handleLoadMore} style={{ alignSelf: 'center', marginTop: 10 }}>
              <Text style={{ color: '#007bff' }}>Xem thêm phản hồi</Text>
            </TouchableOpacity>
          )}
              </>
              
            ) : (
              <Text>Không có phản hồi nào cho địa điểm này.</Text>
            )}
          </View>

            <Recommendation locationId={id} navigation={navigation}/>
            
          </View>   
            </ScrollView>
            <View style={styles.bookingSection}>
                <View>
                    <Text style={styles.priceLabel}>Giá chỉ từ</Text>
                    <Text style={styles.price}>{minPrice.toLocaleString('vi-VN')} VND</Text>
                </View>
              
              <TouchableOpacity onPress={()=> {
                if (!date1 || !date2) {
                  Alert.alert('Thông báo', 'Chọn ngày đặt phòng ở mục tìm phòng');
                  return;
                }
                navigation.navigate('available-room-screen', {
                id: locationDetails._id,
                checkinDate: date1, // Gửi ngày checkin
                checkoutDate: date2,
                serviceOfLocation: servicesOfLocation // Gửi ngày checkout
              })}} style={styles.bookNowButton}>
                <Text style={styles.bookNowText}>Đặt ngay</Text>
                <FontAwesome size={20} name='arrow-right' style={styles.iconBookNow}></FontAwesome>
              </TouchableOpacity>
            </View>
      </View>
    </SafeAreaView>

    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
    margin: 0,
    padding: 0,
  },
  imageContainer: {
    width: '100%',
    height: height * 0.4,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius:18,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 16,
    elevation: 5,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
},
  messageButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 16,
    elevation: 5,
  },
  heartButton: {
    position: 'absolute',
    bottom: -20,
    right: 16,
    width:50,
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 25,
    elevation: 5,
    height:50,
    justifyContent:'center',
    alignItems:'center',
  },
  infoSection: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 16,
    color: '#555',
    marginLeft: 4,
  },
  description: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
  },
  readMore: {
    color: '#1E90FF',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  facilityTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  facilityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  facilityItem: {
    alignItems: 'center',
    width:'22%',
    backgroundColor:'white',
    borderRadius:10,
    height: 60,
    justifyContent:'center',
    marginTop:10,
    
  },
  facilityText: {
    fontSize: 12,
    color: '#555',
    marginTop: 4,
  },
  bookingSection: {
    marginHorizontal: 10,
    marginVertical:10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceLabel: {
    fontSize: 18,
    color: '#555',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#32CD32',
  },
  bookNowButton: {
    flexDirection:'row',
    width:160,
    height: 60,
    alignItems:'center',
    justifyContent:'center',
    backgroundColor: '#1E90FF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  bookNowText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize:18,
  },

  iconBookNow :{
    color: 'white',
    marginLeft: 4
  },

  showMap: { 
    fontSize: 16,
    color: '#1E90FF',
    fontWeight: 'bold',
},

reviewframe: {
  // backgroundColor: 'white',
  width:'100%',
  marginVertical:5,
  borderTopWidth: 1,
  borderBottomWidth: 1,
  borderColor: '#E7E7E7',
  borderStyle: 'solid',
},

section: {
  marginTop:-10,
  marginBottom:40,
  
},
title2: {
  fontSize: 20,
  fontWeight: 'bold',
  marginBottom: 12,
},

avatarContainer: {

  width: 50,
  height: 50,
  borderRadius: 50,
  marginRight:20,
  overflow: 'hidden',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#F3F8FE', 
},
avatar: {
  width: '100%',
  height: '100%',
  resizeMode: 'cover', 
},

inputContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 8,
  marginBottom: 12,
  paddingLeft: 10,
  paddingRight: 10,
},
input: {
  flex: 1,
  padding: 10,
},
iconLeft: {
  marginRight: 10,
},
iconRight: {
  marginLeft: 10,
},
stateContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 16,
},
stateText: {
  marginRight: 8,
  fontSize: 16,
},
stateBadge: {
  backgroundColor: '#ebf4ff',
  color: '#1e90ff',
  paddingHorizontal: 12,
  paddingVertical: 4,
  borderRadius: 16,
  fontSize: 14,
},
searchButton: {
  backgroundColor: '#1e90ff',
  borderRadius: 8,
  paddingVertical: 12,
  alignItems: 'center',
},
searchButtonText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: 'bold',
},
feedbackContainer: {
  marginTop: 10,
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 12,
},
profilePicture: {
  width: 50,
  height: 50,
  borderRadius: 25,
  marginRight: 12,
},
customerName: {
  fontWeight: 'bold',
  fontSize: 16,
},
feedbackText: {
  color: '#4a4a4a',
  fontSize: 14,
  lineHeight: 20,
  marginBottom: 10,
},
});
