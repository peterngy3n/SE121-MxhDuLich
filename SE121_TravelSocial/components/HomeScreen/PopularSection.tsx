import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Text,
  View,
  Animated,
  FlatList,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';

import locationData from '@/constants/location';
import CustomModal from '../CollectionScreen/AddIntoCollection';
import * as Network from 'expo-network';
import { NetworkInfo } from 'react-native-network-info';
import { API_BASE_URL } from '../../constants/config';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = 245;
const CARD_HEIGHT = height - 600;
const CARD_WIDTH_SPACING = CARD_WIDTH + 24;

type LikedItems = {
  [key: string]: boolean;
};

interface PopularSectionProps {
  categoryId: string | undefined;
  navigation: any;
}

export default function PopularSection({ categoryId, navigation }: PopularSectionProps) {
  const [likedItems, setLikedItems] = useState<LikedItems>({});
  const [locations, setLocations] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [onEndReachedCalledDuringMomentum, setOnEndReachedCalledDuringMomentum] = useState(false);

  const scrollX = useRef(new Animated.Value(0)).current;

  const handlePress = (id: string) => {
    setLikedItems((prevState) => ({
      ...prevState,
      [id]: !prevState[id],
    }));
    setSelectedLocationId(id);
    setModalVisible(true);
  };

  useEffect(() => {
    if (categoryId === "all") {
      getAllLocations(1);
      return;
    }
    if (categoryId) {
      fetchPopularLocations(categoryId, 1);
    }
  }, [categoryId]);

  const fetchPopularLocations = async (id: string, pageNumber: number) => {
    if (isFetchingMore || !hasMore) return;
  
    setIsFetchingMore(true);
    try {
      const response = await fetch(`${API_BASE_URL}/locationbycategory/${id}?page=${pageNumber}&limit=10`);
      const data = await response.json();
  
      if (data.isSuccess) {
        if (pageNumber === 1) {
          setLocations(data.data.data);
        } else {
          setLocations(prev => [...prev, ...data.data.data]);
        }
  
        setHasMore(data.data.data.length > 0);
        setPage(pageNumber + 1);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsFetchingMore(false);
      setLoading(false);
    }
  };

  const getAllLocations = async (pageNumber: number) => {
    try {
      if (isFetchingMore || !hasMore) return;
  
      setIsFetchingMore(true);
  
      const response = await fetch(`${API_BASE_URL}/alllocation?page=${pageNumber}&limit=10`);
      const data = await response.json();
  
      if (data.isSuccess) {
        if (pageNumber === 1) {
          setLocations(data.data.data);
          // console.log('all location: ', data.data);
        } else {
          setLocations(prev => [...prev, ...data.data.data]);
        }
  
        setHasMore(data.data.data.length > 0);
        setPage(pageNumber + 1); 
      } else {
        console.error(data.error);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsFetchingMore(false);
      setLoading(false);
    }
  };

  const loadMoreData = useCallback(() => {
    if (!onEndReachedCalledDuringMomentum && !isFetchingMore && hasMore) {
      if (categoryId === 'all') {
        getAllLocations(page);
      } else if (categoryId) {
        fetchPopularLocations(categoryId, page);
      }
      setOnEndReachedCalledDuringMomentum(true);
    }
  }, [categoryId, page, isFetchingMore, hasMore, onEndReachedCalledDuringMomentum]);

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const inputRange = [
      (index - 1) * CARD_WIDTH_SPACING,
      index * CARD_WIDTH_SPACING,
      (index + 1) * CARD_WIDTH_SPACING,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: 'clamp',
    });

    const shadowOpacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.1, 0.3, 0.1],
      extrapolate: 'clamp',
    });

    // Lấy promotion đầu tiên nếu có
    const hasPromotion = item.promotions && item.promotions.length > 0;
    const promotionName = hasPromotion ? item.promotions[0].name : null;

    return (
      <Animated.View
        style={[
          styles.card,
          {
            transform: [{ scale }],
            shadowOpacity,
          },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.navigate('detail-screen', { id: item._id })}>
          <View style={styles.imageBox}>
            <Image
              source={
                item?.image?.[0]?.url
                  ? { uri: item.image[0].url }
                  : require('@/assets/images/bai-truoc-20.jpg')
              }
              style={styles.image}
            />
            {/* Badge promotion */}
            {hasPromotion && (
              <View style={styles.promotionBadge}>
                <Text style={styles.promotionText}>{promotionName}</Text>
              </View>
            )}
          </View>
          <View style={styles.titleBox}>
            <View style={styles.textBoxProvince}>
              <Text style={[styles.textStyle, { fontSize: 12, marginBottom: 10 }]}>{item?.province}</Text>
            </View>
            <View style={styles.textBox}>
              <Text style={[styles.textStyle, { fontSize: 16, fontWeight: 'bold' }]} numberOfLines={1}>{item.name}</Text>
            </View>
            <View style={{ flexDirection: 'row', marginTop: 2, alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={styles.textBox}>
                <Image
                  source={require('../../assets/icons/star.png')}
                  style={styles.star}
                />
                <Text style={[styles.textStyle, { fontSize: 12 }]}>{item.rating}</Text>
              </View>
              {/* Giá hiển thị nổi bật */}
              <View style={{ backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 }}>
                <Text style={{ color: '#196EEE', fontWeight: 'bold', fontSize: 13 }}>
                  {typeof item.minPrice === 'number' ? `${item.minPrice.toLocaleString('vi-VN')} VND` : 'Giá không xác định'}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={{ height: CARD_HEIGHT + 70 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: 10 }}>
        <Text style={styles.titleText}>Danh mục</Text>
        <TouchableOpacity onPress={() => navigation.navigate('search-location-screen')} style={{ marginRight: 20, top: 10 }}>
          <Text style={{ fontSize: 14, color: '#196EEE' }}>Xem tất cả</Text>
        </TouchableOpacity> 

      </View>
      <Animated.FlatList
        data={locations}
        horizontal
        snapToInterval={CARD_WIDTH_SPACING}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        keyExtractor={(item, index) => item._id}
        renderItem={renderItem}
        onEndReached={loadMoreData}
        onMomentumScrollBegin={() => setOnEndReachedCalledDuringMomentum(false)}
        onEndReachedThreshold={0.2}
        maxToRenderPerBatch={5}
        windowSize={10}
        removeClippedSubviews={true}
      />
      {isFetchingMore && (
  <Text style={{ textAlign: 'center', marginTop: 10 }}>Đang tải thêm...</Text>
)}
      
      <CustomModal visible={modalVisible} onClose={() => setModalVisible(false)} onSelectCollection={(collectionId: any) => console.log('selected:', collectionId)} selectedLocationId={selectedLocationId}></CustomModal>
    </View>
  );
}

const styles = StyleSheet.create({
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    left: 20,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginVertical: 10,
    marginHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  imageBox: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
  },
  image: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    resizeMode: 'cover',
  },
  titleBox: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
  },
  textBox: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  textBoxProvince: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,

  },
  textStyle: {
    fontWeight: 'bold',
    color: 'black',
    marginHorizontal: 5,
    marginVertical: 5,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  star: {
    width: 16,
    height: 16,
    marginRight: 2,
    left: 5,
  },
  heart: {
    width: 30,
    height: 30,
  },
  promotionBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFD700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  promotionText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 12,
  },
  priceText: {
    fontWeight: 'bold',
    color: '#196EEE',
    fontSize: 14,
    marginTop: 5,
  },
});
