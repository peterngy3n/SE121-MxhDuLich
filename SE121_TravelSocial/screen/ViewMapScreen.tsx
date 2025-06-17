import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, Dimensions, TouchableOpacity, Text, Image, Platform, FlatList } from 'react-native';
import { NativeStackNavigatorProps } from 'react-native-screens/lib/typescript/native-stack/types';

import MapView, {Marker} from 'react-native-maps';
import Header2 from '@/components/Header2';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import haversine from 'haversine';
import { API_BASE_URL } from '../constants/config';
import { getDistance } from 'geolib';

const MapComponent = Platform.OS === 'web' ? null : require('react-native-maps');

export default function ViewMapScreen({navigation} : {navigation : NativeStackNavigatorProps}) {
  // const navigation = useNavigation();
  const [locationDetails, setLocationDetails] = useState<any>(null);
  const [nearbyLocations, setNearbyLocations] = useState<any[]>([]);
  const mapRef = useRef<MapView>(null); // Thêm ref cho MapView

  useEffect(() => {
    getStoredLocationDetails().then((data) => {
      if (data) {
        setLocationDetails(data);
        fetchNearbyLocations(data.latitude, data.longtitude);
        console.log('Loaded location details from storage:', data);
      }
    });
  }, []);

  // Hàm lấy các địa điểm trong bán kính 1km
  const fetchNearbyLocations = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/alllocation?page=1&limit=100`); // Giả sử API trả về tất cả địa điểm
      const data = await response.json();
      if (data.isSuccess && Array.isArray(data.data.data)) {
        // Lọc các địa điểm trong bán kính 1km
        const filtered = data.data.data.filter((loc: any) => {
          if (!loc.latitude || !loc.longtitude) return false;
          const dist = getDistance(
            { latitude, longitude },
            { latitude: loc.latitude, longitude: loc.longtitude }
          );
          return dist > 0 && dist <= 1000000;
        });
        setNearbyLocations(filtered);
      }
    } catch (error) {
      console.error('Error fetching nearby locations:', error);
    }
  };

  // Hàm chuyển map đến marker khi click vào địa điểm trong danh sách
  const handleLocationItemPress = (loc: any) => {
    if (mapRef.current && loc.latitude && loc.longtitude) {
      mapRef.current.animateToRegion({
        latitude: loc.latitude,
        longitude: loc.longtitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
  };

  const renderLocationItem = ({ item }: { item: any }) => {
    // Tính khoảng cách từ vị trí hiện tại đến địa điểm
    let distanceText = '';
    if (locationDetails?.latitude && locationDetails?.longtitude && item.latitude && item.longtitude) {
      const dist = getDistance(
        { latitude: locationDetails.latitude, longitude: locationDetails.longtitude },
        { latitude: item.latitude, longitude: item.longtitude }
      );
      if (dist >= 1000) {
        distanceText = `${(dist / 1000).toFixed(2)} km`;
      } else {
        distanceText = `${dist} m`;
      }
    }

    return (
      <TouchableOpacity style={styles.locationItem} onPress={() => handleLocationItemPress(item)}>
        <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
          {/* Hiển thị hình ảnh nếu có */}
          {item.image && item.image.length > 0 && item.image[0].url ? (
            <Image
              source={{ uri: item.image[0].url }}
              style={styles.locationImage}
            />
          ) : (
            <View style={styles.locationImagePlaceholder} />
          )}
          <View style={[styles.locationInfo, { flex: 1 }]}> 
            <Text style={styles.locationName}>{item.name}</Text>
            {/* Hiển thị rating nếu có */}
            {typeof item.rating === 'number' ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 2 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Text key={i} style={{ color: i < Math.round(item.rating) ? '#FFD700' : '#ccc', fontSize: 14 }}>
                    ★
                  </Text>
                ))}
                <Text style={{ marginLeft: 6, color: '#333', fontSize: 13 }}>
                  {item.rating.toFixed(1)}
                </Text>
              </View>
            ) : (
              <Text style={{ color: '#888', fontSize: 12, fontStyle: 'italic' }}>Chưa có đánh giá</Text>
            )}
            <Text style={styles.locationAddress}>{item.address}</Text>
            {/* Hiển thị khoảng cách */}
            {distanceText ? (
              <Text style={{ color: '#007AFF', fontSize: 12, marginTop: 2 }}>Cách bạn: {distanceText}</Text>
            ) : null}
          </View>
          {/* Button chuyển đến detail */}
          <TouchableOpacity
            style={styles.detailButton}
            onPress={() => navigation.navigate('detail-screen', { id: item._id })}
          >
            <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>Chi tiết</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.arrowleftbutton} onPress={() => navigation.goBack()}>
          <Image source={require('../assets/icons/arrowleft.png')} style={styles.arrowlefticon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Xem trên bản đồ</Text>
      </View>
      {/* MAP VIEW */}
      <MapView
        ref={mapRef} 
        style={styles.map}
        initialRegion={{
          latitude: locationDetails?.latitude,
          longitude: locationDetails?.longtitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        
        {locationDetails?.latitude && locationDetails?.longtitude && (
          <Marker
            coordinate={{
              latitude: locationDetails.latitude,
              longitude: locationDetails.longtitude,
            }}
            title={locationDetails?.name || 'Vị trí'}
            description={locationDetails?.address || ''}
            pinColor="blue"
          />
        )}
        {/* Marker cho các địa điểm gần đó */}
        {nearbyLocations.map((loc, idx) => (
          <Marker
            key={loc._id || idx}
            coordinate={{ latitude: loc.latitude, longitude: loc.longtitude }}
            title={loc.name}
            description={loc.address}
            pinColor="red"
          />
        ))}
      </MapView>
      {/* Danh sách các địa điểm gần đó */}
      <View style={styles.bottomListContainer}>
        <Text style={styles.listTitle}>Địa điểm trong bán kính 1km</Text>
        {nearbyLocations.length === 0 ? (
          <Text style={styles.noLocationText}>Không tìm thấy địa điểm nào gần đây.</Text>
        ) : (
          <>
            {/* Sử dụng FlatList để hỗ trợ scroll */}
            <FlatList
              data={nearbyLocations}
              keyExtractor={(item, idx) => item._id ? item._id.toString() : idx.toString()}
              renderItem={renderLocationItem}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingBottom: 16 }}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 2 / 3, // 2/3 màn hình
  },
  header: {
    top: 40, // tránh status bar
    left: 0,
    right: 0,
    zIndex: 999,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'transparent',
    position: 'absolute',
    paddingHorizontal: 100,

    
    // paddingVertical: 40,

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
  markerIcon: {
    width: 40,
    height: 30,
    resizeMode: 'contain',
  },
  bottomListContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Dimensions.get('window').height / 3,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  noLocationText: {
    color: '#888',
    fontStyle: 'italic',
  },
  locationItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 8,
  },
  locationInfo: {
    flexDirection: 'column',
  },
  locationName: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  locationAddress: {
    color: '#666',
    fontSize: 13,
  },
  locationImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#eee',
  },
  locationImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#eee',
  },
  // Thêm style cho button chi tiết
  detailButton: {
    marginLeft: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
    alignSelf: 'center',
  },
});
const getStoredLocationDetails = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem('@location_details');
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error('Error reading location details:', e);
    return null;
  }
};


