import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, FlatList, ActivityIndicator, RefreshControl, Button, TextInput, ScrollView } from 'react-native';
import Ticket from '@/components/BookingScreen/Booking';
import {API_BASE_URL} from '../constants/config'; // Import component Ticket
import { useUser } from '@/context/UserContext';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

export default function TicketScreen() {
  const { userId } = useUser();
  const [tickets, setTickets] = useState<any[]>([]);
  const [locationId, setLocationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [image, setImage] = useState<string | null>(null);
  // const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationData, setLocationData] = useState({
    name: 'Huy ', // Đảm bảo trường này có giá trị
    address: 'long an', // Đảm bảo trường này có giá trị
    description: '', 
  });
  // const [loading, setLoading] = useState(false);

  // Hàm gọi API lấy danh sách ticket
  const fetchTickets = async () => {
    try {
        
      const response = await fetch(`${API_BASE_URL}/booking/getbyuserid/${userId}`); // Thay bằng URL API của bạn
      const result = await response.json();

      setTickets(result.data); 
      console.log('Tickets fetched:', result.data);
      if (result.isSuccess && result.data) {
        const ticketWithNames = await Promise.all(
          result.data.map(async (ticket: any) => {
            const room = await fetchRoomDetails(ticket.items[0]?.roomId);  


            const location = room && room.locationId ? await fetchLocationDetails(room.locationId) : null;
            const imageUrl = location && location.image && location.image?.[0]?.url ? location.image?.[0].url : 'https://via.placeholder.com/150';
            // console.log('location iamge 0: ', location.image[0].url)
            setLocationId(room.locationId);
            return {
              ...ticket,
              locationName: location ? location.name : 'Unknown Location',
              imageUrl: imageUrl,
              locationId: room.locationId, // Lưu locationId để sử dụng sau này 
            };
          })
        );
        setTickets(ticketWithNames);
      } else {
        console.error('API returned an error:', result.error);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } 
  };

  const fetchRoomDetails = async (roomId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/room/getbyid/${roomId}`);
      const result = await response.json();
      if (result && result.isSuccess) {
        return result.data; 
      }
      return null;
    } catch (error) {
      console.error(`Error fetching room details for roomId: ${roomId}`, error);
      return null;
    }
  };
  
  const fetchLocationDetails = async (locationId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/locationbyid/${locationId}`);
      const result = await response.json();
      if (result && result.isSuccess) {
        return result.data; 
      }
      return null;
    } catch (error) {
      console.error(`Error fetching location details for locationId: ${locationId}`, error);
      return null;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true); // Bắt đầu trạng thái làm mới
    await fetchTickets(); // Gọi lại API để cập nhật danh sách
    setRefreshing(false); // Kết thúc trạng thái làm mới
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert('Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async () => {
    if (!image) {
      alert('Please select an image first!');
      return;
    }

    // Kiểm tra xem tất cả các trường cần thiết có giá trị hay không
    if (!locationData.name || !locationData.address) {
      alert('Location name and address are required!');
      return;
    }

    setLoading(true);
    const formData = new FormData();

    try {
      const response = await fetch(image);
      const blob = await response.blob();
      if (!blob.type.startsWith('image/')) {
        alert('The file is not a valid image');
        return; // Dừng lại nếu không phải hình ảnh
      }

      // Thêm ảnh vào FormData
      formData.append('file', blob, 'image.jpg');
      formData.append('name', locationData.name);
      formData.append('address', locationData.address);
      formData.append('description', locationData.description);// Thêm thông tin location

      console.log('FormData entries:', [...formData.entries()]);

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      // Gửi yêu cầu POST lên API
      const apiResponse = await axios.post(`${API_BASE_URL}/createLocation`, formData, config);

      if (apiResponse.status === 201) {
        console.log('Location created successfully:', apiResponse.data);
        alert('Location and image uploaded successfully!');
      } else {
        setError('Upload failed with status code ' + apiResponse.status);
      }
    } catch (err: any) {
      if (err.response) {
        console.error('API error response:', err.response.data);
        setError('API error: ' + err.response.data.message || err.response.data);
      } else if (err.request) {
        console.error('Error with the request:', err.request);
        setError('Error with the request');
      } else {
        console.error('Error message:', err.message);
        setError('Error: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <View style={styles.container}>
          {/* <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.innerContainer}>
        <Text style={styles.title}>Pick an Image for Location</Text>
        <Button title="Pick an image" onPress={pickImage} />
        {image && <Image source={{ uri: image }} style={styles.image} />}
        {error && <Text style={styles.errorText}>{error}</Text>}
        
      
        <Text>Name:</Text>
        <TextInput 
          style={styles.input} 
          value={locationData.name} 
          onChangeText={(text) => setLocationData({ ...locationData, name: text })} 
        />
        
        <Text>Address:</Text>
        <TextInput 
          style={styles.input} 
          value={locationData.address} 
          onChangeText={(text) => setLocationData({ ...locationData, address: text })} 
        />
        
        <Button
          title={loading ? 'Uploading...' : 'Upload Location with Image'}
          onPress={uploadImage}
          disabled={loading}
        />
        {loading && <ActivityIndicator size="large" color="#0000ff"  />}
      </View>
    </ScrollView> */}
      <View style ={{ flexDirection: 'row',  justifyContent: 'space-between', alignItems: 'center', marginRight: 20}}>
      <Text style={styles.collections}>Tất cả Booking</Text>
      <Image source={require('../assets/icons/logo.png')} style={styles.logo} />

      </View>
      

        <FlatList
            data={tickets}
            keyExtractor={(item) => item._id} // Sử dụng _id làm key
            renderItem={({ item }) => (
                <Ticket
                title={item.locationName} // Hiển thị roomId (hoặc tuỳ chỉnh)
                date={`${new Date(item.checkinDate).toLocaleDateString()} - ${new Date(item.checkoutDate).toLocaleDateString()}`}
                status={item.status}
                imageUrl={item.imageUrl || 'https://via.placeholder.com/150'}
                onCancel={() => console.log(`Cancel ticket: ${item._id}`)}
                bookingId={item._id}
                locationId={item.locationId} // Truyền locationId vào component Ticket
                />
            )}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        /> 
    </View>
  );
}

const styles = StyleSheet.create({
  
 
  innerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    padding: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5 },
  textArea: { height: 80 },
  imagePreview: { flexDirection: 'row', marginTop: 10 },
  image: { width: 50, height: 50, marginRight: 10, borderRadius: 5 },
  errorText: { color: 'red', marginTop: 10 },

  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  logo: {
    marginTop: 20,
    width: 50,
    height: 50,
    marginLeft: 10,
  },
  collections: {
    marginTop: 30,
    marginLeft: 25,
    fontSize: 26,
    fontWeight: 'bold',
  },
});
