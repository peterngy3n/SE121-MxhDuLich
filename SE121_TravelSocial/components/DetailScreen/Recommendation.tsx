import {Text, View, FlatList, Dimensions, TouchableOpacity, StyleSheet, Image, ActivityIndicator} from 'react-native'
import locationData from '@/constants/location';
import React, { useEffect, useState } from 'react';
import * as Network from 'expo-network';
import {API_BASE_URL, API_RCM_URL} from '../../constants/config';

const {width, height} = Dimensions.get('window')
const CARD_WIDTH =  width - 190;
const CARD_HEIGHT = 200;
const CARD_WIDTH_SPACING = CARD_WIDTH + 24;
type LikedItems = {
    [key: string]: boolean; 
};

interface PopularSectionProps {
    navigation: any;
    locationId: string;
  }

export default function Recommendation({ navigation, locationId }: PopularSectionProps) {
    const [likedItems, setLikedItems] = useState<LikedItems>({});
    const [locations, setLocations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
      const [page, setPage] = useState(1);
      const [hasMore, setHasMore] = useState(true);
      const [isFetchingMore, setIsFetchingMore] = useState(false);

    const handlePress = (id: string) => {
        setLikedItems((prevState) => ({
            ...prevState,
            [id]: !prevState[id] 
        }));
    };

    // Hàm fetch có timeout
const fetchWithTimeout = (url: string, options = {}, timeout = 10000) => {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeout)
        )
    ]);
};

    // Fetch promotions for a list of locationIds
    const fetchPromotionsForLocations = async (locationIds: string[]) => {
        if (!locationIds || locationIds.length === 0) return [];
        try {
            const response = await fetch(`${API_BASE_URL}/locations-with-promotion-by-ids`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ locationIds })
            });
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data.data)) {
                    return data.data;
                }
            }
        } catch (e) {
            console.error('Error fetching promotions:', e);
        }
        return [];
    };

const getContentBasedRecommendations = async (pageNumber: number) => {
  try {
    setLoading(true);
    setIsFetchingMore(true);
    // Gọi API content_based recommendation với product_id
    const response = await fetchWithTimeout(`${API_RCM_URL}/recommend_legacy/?case=content_based&product_id=${locationId}`, {}, 10000); // 10s timeout
    // Đảm bảo response là Response trước khi gọi .json()
    if (!(response instanceof Response)) {
      throw new Error('Không nhận được phản hồi hợp lệ từ máy chủ.');
    }
    let data = null;
    let isJson = false;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
        isJson = true;
      } catch (jsonErr) {
        // JSON parse error
        const text = await response.text().catch(() => '');
        console.log('Recommend API JSON parse error:', jsonErr, text);
        setHasMore(false);
        setLoading(false);
        setIsFetchingMore(false);
        return;
      }
    } else {
      // Not JSON
      const text = await response.text();
      console.error('Recommend API response not ok:', text);
      setHasMore(false);
      setLoading(false);
      setIsFetchingMore(false);
      return;
    }
    if (isJson && data && data.recommendations) {
      // Batch fetch promotions for all recommended locations
      const locationIds = data.recommendations.map((item: any) => item._id || item.location_id).filter(Boolean);
      const locationsWithPromotions = await fetchPromotionsForLocations(locationIds);
      // Merge promotion info into recommendations by _id/location_id
      const promoMap = new Map();
      locationsWithPromotions.forEach((loc: any) => {
        promoMap.set(loc._id || loc.location_id, loc);
      });
      const merged = data.recommendations.map((item: any) => {
        const key = item._id || item.location_id;
        return promoMap.get(key) ? { ...item, ...promoMap.get(key) } : item;
      });
      if (pageNumber === 1) {
        setLocations(merged);
      } else {
        const existingIds = new Set(locations.map(item => item._id || item.location_id));
        const uniqueNewItems = merged.filter((item: any) => !existingIds.has(item._id || item.location_id));
        setLocations(prev => [...prev, ...uniqueNewItems]);
      }
      setHasMore(merged.length > 0);
      setPage(pageNumber + 1);
    } else {
      setHasMore(false);
    }
  } catch (error: any) {
    setHasMore(false);
    if (error instanceof TypeError && String(error).includes('Network request failed')) {
      console.log('Content-based Recommend API error:', error);
    } else if (error.message === 'Request timeout') {
      console.log('Content-based Recommend API error: Request timeout');
    } else {
      console.log('Content-based Recommend API error:', error);
    }
  } finally {
    setIsFetchingMore(false);
    setLoading(false);
  }
};

    useEffect(() => {
        getContentBasedRecommendations(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [locationId]);
      

    if (loading) {
        return <ActivityIndicator size="large" color="#0000ff" />; // Hiển thị loading indicator
    }

    return (

        <View style={{height:CARD_HEIGHT+50}}>
            <Text style = {styles.titleText}>Có thể bạn sẽ thích</Text>
            <FlatList
            data={locations}
            
            horizontal
            snapToInterval={CARD_WIDTH_SPACING}
            decelerationRate={"fast"}
            keyExtractor={item => item?._id || item?.location_id}
            onEndReached={() => {
                if (hasMore) {
                  getContentBasedRecommendations(page);
                } 
              }}
              onEndReachedThreshold={0.5}
            renderItem={({item, index}) => {
                // Promotion logic
                const promotions = item.promotions || item.promotion || [];
                const hasPromotion = Array.isArray(promotions) ? promotions.length > 0 : !!promotions;
                const firstPromotion = Array.isArray(promotions) ? promotions[0] : promotions;
                // Lấy giá (nếu có)
                const price = item.price || item.minPrice || item.maxPrice || null;
                return (
                    <TouchableOpacity onPress={() => navigation.navigate('detail-screen', { id: item?._id })} style = {[
                        styles.cardContainer,
                        {
                        marginLeft: 24,
                        marginRight:  index === locations.length - 1 ? 24 : 0}]}> {/* fixed bug: use locations.length */}
                        <View style={{width: 224}}>
                            <View style = {[styles.imageBox, ]}>
                            <Image
                            source={
                            item?.image
                                ? { uri: item?.image?.[0]?.url}
                                : require('@/assets/images/bai-truoc-20.jpg')
                            }
                            style={styles.image}
                            />
                            {/* Promotion badge góc phải trên */}
                            {hasPromotion && firstPromotion && (
                                <View style={{position: 'absolute', top: 8, right: 8, backgroundColor: '#FFB300', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, zIndex: 2}}>
                                    <Text style={{color: 'white', fontWeight: 'bold', fontSize: 12}} numberOfLines={1}>
                                        {firstPromotion.name}
                                    </Text>
                                </View>
                            )}
                                <View style= {styles.titleBox}>
                                    <View style = {[styles.textBox, {top: 10, width: 70}]}>
                                        <Image source={require('@/assets/icons/star.png')}
                                        style = {styles.star}></Image>
                                        <Text style = {[styles.textrating, {fontSize: 15}]}>{item?.rating}</Text>
                                    </View>
                                </View>
                            </View>
                            <View style = {[styles.footer,{}]}>
                                <View style ={{ width: '100%', }}>
                                    <Text style = {[styles.textStyle, {fontSize: 14}]} numberOfLines={1}>{item?.name}</Text>
                                    <View style = {{flexDirection: 'row', alignItems: 'center', marginTop: 2, width: '100%', justifyContent: 'space-between', paddingHorizontal: 14}}>
{item?.province && (
                                        <Text style={{ color: '#666', fontSize: 13, marginBottom: 2 }} numberOfLines={1}>{item.province}</Text>
                                    )}
                                    {/* Hiển thị giá */}
                                    {(item?.price || item?.minPrice || item?.maxPrice) && (
                                        <Text style={{ color: '#196EEE', fontWeight: 'bold', fontSize: 14, marginBottom: 2 }}>
                                            Giá: {(item.price || item.minPrice || item.maxPrice).toLocaleString()}đ
                                        </Text>
                                    )}
                                    </View>
                                    {/* Hiển thị tỉnh/thành phố */}
                                    
                                    {/* Promotion chi tiết dưới tên */}
                                    {/* {hasPromotion && firstPromotion && (
                                        <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 2}}>
                                            <Image source={require('@/assets/icons/discount.png')} style={{width: 16, height: 16, marginRight: 4}} />
                                            <Text style={{fontSize: 13, color: '#FF5722', fontWeight: '500'}} numberOfLines={1}>
                                                {firstPromotion.name} {firstPromotion.discount ? `- Giảm ${firstPromotion.discount.amount}${firstPromotion.discount.type === 'PERCENT' ? '%' : ' VND'}` : ''}
                                            </Text>
                                        </View>
                                    )} */}
                                </View>
                                {/* ...existing code... */}
                            </View>
                        </View>
                    </TouchableOpacity>                            
                )}
            }></FlatList>
            
        </View>
    )
}

const styles = StyleSheet.create({

    cardContainer: {
        borderWidth: 2, // Viền trắng
        borderColor: 'white',
        borderRadius: 24, // Bo góc
        shadowColor: '#000', // Màu bóng
        shadowOffset: {
          width: 0,
          height: 10, // Đổ bóng theo chiều dọc
        },
        shadowOpacity: 0.1, // Độ mờ của bóng
        shadowRadius: 10, // Bán kính bóng
        elevation: 5, // Đổ bóng trên Android
        backgroundColor: 'white', // Nền trắng
        height: CARD_HEIGHT - 5,
      },
    
    titleText: {
        fontSize: 24,
        fontWeight: 'bold',
        left: 20,
        marginBottom: 20,
    },
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT-70,
        marginVertical: 10,
    },
    imageBox: {
        width: CARD_WIDTH - 13,
        height: CARD_HEIGHT - 60,
        borderRadius: 24,
        overflow: 'hidden',    
    },
    image: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT - 60,
        resizeMode: 'cover',

    },
    titleBox: {
        position: 'absolute',
        top: CARD_HEIGHT - 120,
        left: 6
    },
    textBox: {
        flexDirection: 'row',
        backgroundColor: '#4D5652',
        borderRadius: 20,
        alignItems: 'center',
        height: 30,
        marginVertical: 5,
        left:3,
        // borderWidth:3,
        // borderColor:'white',
        bottom:20,
    },
    textBox2: {
        alignItems: 'center',
        height: 30,
        left:140,
        // borderWidth:3,
        // borderColor:'white',
        bottom:25,
    },
    star: {
        width: 18,
        height: 18,
        left: 10
    },
    heart: {
        width: 30,
        height: 30,
        left: 10
    },
    textStyle: {
        
        fontWeight: 'medium',
        color: 'black',
        marginLeft: 5,
        left:7,
        top:2,
        marginVertical: 2,
        
    },
    textrating: {
        fontWeight: 'medium',
        color: 'white',
        marginLeft: 5,
        left:7,
        top:2,
        marginVertical: 2,
    },
    textStyle2: {
        fontWeight: 'medium',
        color: 'black',
        marginLeft: 5,
        
    },
    footer: {
        flexDirection: 'row', 
        justifyContent: 'space-between', 
    }
})