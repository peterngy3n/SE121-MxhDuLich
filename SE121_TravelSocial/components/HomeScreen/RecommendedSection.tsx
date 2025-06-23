import {Text, View, FlatList, Dimensions, TouchableOpacity, StyleSheet, Image, ActivityIndicator} from 'react-native'
import locationData from '@/constants/location';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import * as Network from 'expo-network';
import {API_BASE_URL, API_RCM_URL} from '../../constants/config';

const {width, height} = Dimensions.get('window')
const CARD_WIDTH =  width - 190;
const CARD_HEIGHT = 240;
const CARD_WIDTH_SPACING = CARD_WIDTH + 24;
type LikedItems = {
    [key: string]: boolean; 
};

interface PopularSectionProps {
    categoryId: string | undefined;
    navigation: any;
}

// Define a location interface for type safety
interface Location {
    _id: string;
    name: string;
    province?: string;
    rating?: number;
    image?: Array<{url: string}>;
    [key: string]: any; // For other properties
}

// Đặt cacheRef ngoài component để giữ cache khi SectionList remount
const recommendedSectionCacheRef = { data: [] as Location[] };

const RecommendedSectionComponent = React.memo(function RecommendedSection({ categoryId, navigation }: PopularSectionProps) {
    const [likedItems, setLikedItems] = useState<LikedItems>({});
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [onEndReachedCalledDuringMomentum, setOnEndReachedCalledDuringMomentum] = useState(false);
    const flatListRef = useRef(null);
    // Sử dụng cacheRef ngoài component
    const cacheRef = recommendedSectionCacheRef;

    const handlePress = (id: string) => {
        setLikedItems((prevState) => ({
            ...prevState,
            [id]: !prevState[id] 
        }));
    };

    useEffect(() => {
        if (cacheRef.data.length > 0) {
            setLocations(cacheRef.data);
            setLoading(false);
            setHasMore(cacheRef.data.length > 0);
            return;
        }
        getPopularLocations(1);
    }, []);

    // Hàm fetch có timeout
    const fetchWithTimeout = (url: string, options = {}, timeout = 10000) => {
        return Promise.race([
            fetch(url, options),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout')), timeout)
            )
        ]);
    };

    const getPopularLocations = async (pageNumber: number) => {
        try {
            setLoading(true);
            if (pageNumber === 1 && cacheRef.data.length > 0) {
                setLocations(cacheRef.data);
                setLoading(false);
                setHasMore(cacheRef.data.length > 0);
                return;
            }
            const response = await fetchWithTimeout(`${API_RCM_URL}/recommend_legacy?case=popular`, {}, 10000); // 10s timeout
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
                    const text = await response.text().catch(() => '');
                    console.log('Popular API JSON parse error:', jsonErr, text);
                    setHasMore(false);
                    setLoading(false);
                    setIsFetchingMore(false);
                    return;
                }
            } else {
                const text = await response.text();
                console.error('Popular API response not ok:', text);
                setHasMore(false);
                setLoading(false);
                setIsFetchingMore(false);
                return;
            }
            if (isJson && data && data.recommendations) {
                // Lấy danh sách locationId
                const locationIds = data.recommendations.map((item: any) => item._id || item.location_id).filter(Boolean);
                if (!locationIds || locationIds.length === 0) {
                    setLocations([]);
                    setHasMore(false);
                    setLoading(false);
                    return;
                }
                // Gọi API lấy location có promotion
                const promoRes = await fetch(`${API_BASE_URL}/locations-with-promotion-by-ids`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ locationIds })
                });
                let promoData = null;
                if (promoRes.ok) {
                    promoData = await promoRes.json();
                }
                // Sửa tại đây: lấy từ promoData.data
                if (promoData && Array.isArray(promoData.data)) {
                    if (pageNumber === 1) {
                        setLocations(promoData.data);
                        cacheRef.data = promoData.data;
                    } else {
                        const newItems = promoData.data as Location[];
                        setLocations(prev => {
                            const existingIds = new Set(prev.map(item => item._id || item.location_id));
                            const uniqueNewItems = newItems.filter((item: Location) => {
                                const key = item._id || item.location_id;
                                return key && !existingIds.has(key);
                            });
                            const merged = [...prev, ...uniqueNewItems];
                            // Loại bỏ trùng lặp lần cuối (phòng trường hợp API trả về trùng trong cùng 1 lần)
                            const seen = new Set();
                            const deduped = merged.filter(item => {
                                const key = item._id || item.location_id;
                                if (!key || seen.has(key)) return false;
                                seen.add(key);
                                return true;
                            });
                            cacheRef.data = deduped;
                            return deduped;
                        });
                    }
                    setHasMore(promoData.data.length > 0);
                    setPage(pageNumber + 1);
                } else {
                    setHasMore(false);
                }
            } else {
                setHasMore(false);
            }
        } catch (error: any) {
            setHasMore(false);
            if (error instanceof TypeError && String(error).includes('Network request failed')) {
                console.log('Popular API error:', error);
            } else if (error.message === 'Request timeout') {
                console.log('Popular API error: Request timeout');
            } else {
                console.log('Popular API error:', error);
            }
        } finally {
            setIsFetchingMore(false);
            setLoading(false);
        }
    };

    const loadMoreData = useCallback(() => {
        if (!onEndReachedCalledDuringMomentum && !isFetchingMore && hasMore) {
            getPopularLocations(page);
            setOnEndReachedCalledDuringMomentum(true);
        }
    }, [page, isFetchingMore, hasMore, onEndReachedCalledDuringMomentum]);

    // useEffect(() => {
    //     getPopularLocations(1);
    // }, []);

    // if (loading) {
    //     return <ActivityIndicator size="large" color="#0000ff" />;
    // }

    return (
        <View style={{height:CARD_HEIGHT+80}}>
            <Text style = {styles.titleText}>Phổ biến</Text>
            <FlatList
                ref={flatListRef}
                data={locations}
                horizontal
                snapToInterval={CARD_WIDTH_SPACING}
                decelerationRate={"fast"}
                keyExtractor={item => (item._id || item.location_id || `${item.name}_${item.province}_${item.index}`)}
                onEndReached={loadMoreData}
                onMomentumScrollBegin={() => setOnEndReachedCalledDuringMomentum(false)}
                onEndReachedThreshold={0.2}
                maxToRenderPerBatch={5}
                windowSize={10}
                removeClippedSubviews={true}
                renderItem={({item, index}) => {
                    // Lấy promotion (nếu có)
                    const promotions = item.promotions || item.promotion || [];
                    const hasPromotion = Array.isArray(promotions) ? promotions.length > 0 : !!promotions;
                    const firstPromotion = Array.isArray(promotions) ? promotions[0] : promotions;
                    // Lấy giá (nếu có)
                    const price = item.price || item.minPrice || item.maxPrice || null;
                    return (
                        <TouchableOpacity onPress={() => navigation.navigate('detail-screen', { id: item._id || item.location_id })} style={[
                            styles.cardContainer,
                            { marginLeft: 24, marginRight: index === locations.length - 1 ? 24 : 0, width: CARD_WIDTH + 30, height: CARD_HEIGHT + 10 }
                        ]}>
                            <View>
                                <View style={[styles.imageBox, { position: 'relative', width: CARD_WIDTH + 25, height: CARD_HEIGHT - 80 }]}> 
                                    <Image
                                        source={
                                            item?.image?.[0]?.url
                                                ? { uri: item.image[0].url }
                                                : require('@/assets/images/bai-truoc-20.jpg')
                                        }
                                        style={[styles.image, { width: CARD_WIDTH + 30, height: CARD_HEIGHT - 40 }]}
                                    />
                                    {/* Promotion badge góc phải trên */}
                                    {hasPromotion && firstPromotion && (
                                        <View style={styles.promotionBadge}>
                                            <Text style={styles.promotionBadgeText} numberOfLines={1}>
                                                {firstPromotion.name}
                                            </Text>
                                        </View>
                                    )}
                                    {/* Rating góc trái dưới ảnh */}
                                    <View style={styles.ratingBox}>
                                        <Image source={require('@/assets/icons/star.png')} style={styles.star} />
                                        <Text style={styles.textrating}>{item.rating ? item.rating.toFixed(1) : '--'}</Text>
                                    </View>
                                </View>
                                <View style={styles.footerBox}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.locationName} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
                                        <Text style={styles.locationProvince} numberOfLines={1}>{item?.province}</Text>
                                        {price && (
                                            <Text style={styles.priceText}>Giá: {price.toLocaleString()}đ</Text>
                                        )}
                                        {/* Promotion chi tiết dưới tên */}
                                        {/* {hasPromotion && firstPromotion && (
                                            <View style={styles.promotionBox}>
                                                <Text style={styles.promotionTitle}>{firstPromotion.name}</Text>
                                                {firstPromotion.description ? (
                                                    <Text style={styles.promotionDesc} numberOfLines={1}>{firstPromotion.description}</Text>
                                                ) : null}
                                                {firstPromotion.discount && (
                                                    <Text style={styles.promotionDiscount}>
                                                        {firstPromotion.discount.type === 'PERCENT'
                                                            ? `Giảm ${firstPromotion.discount.amount}%`
                                                            : `Giảm ${firstPromotion.discount.amount.toLocaleString()}đ`}
                                                    </Text>
                                                )}
                                            </View>
                                        )} */}
                                    </View>
                                    <TouchableOpacity onPress={() => handlePress(item._id?.toString() || item.location_id?.toString())} style={styles.heartBox}>
                                        <Image source={require('@/assets/icons/heart.png')}
                                            style={[
                                                styles.heart,
                                                { tintColor: likedItems[item._id || item.location_id] ? 'red' : 'white' }
                                        ]}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableOpacity>                            
                    )
                }}
            />

            {isFetchingMore && (
                <Text style={{ textAlign: 'center', marginTop: 10 }}>Đang tải thêm...</Text>
            )}
        </View>
    )
});

export default RecommendedSectionComponent;

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
        height: CARD_HEIGHT-10,
      },
    
    titleText: {
        fontSize: 24,
        fontWeight: 'bold',
        left: 20,
        marginBottom:10,

    },
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT-100,
        marginVertical: 10,
    },
    imageBox: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT - 100,
        borderRadius: 24,
        overflow: 'hidden',    
    },
    image: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT - 100,
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
        //left: 10
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
        width: 160,
    },
    textrating: {
        fontWeight: 'medium',
        color: 'white',
        marginLeft: 5,
        //left:7,
        top:0,
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
    },
    // Thêm style cho promotion
    promotionBox: {
        backgroundColor: '#FFE066',
        borderRadius: 10,
        padding: 6,
        marginTop: 4,
        marginBottom: 2,
        maxWidth: 180,
    },
    promotionTitle: {
        fontWeight: 'bold',
        color: '#D35400',
        fontSize: 13,
    },
    promotionDesc: {
        color: '#7B7B7B',
        fontSize: 12,
    },
    promotionDiscount: {
        color: '#C0392B',
        fontWeight: 'bold',
        fontSize: 13,
        marginTop: 2,
    },
    // Badge góc phải trên
    promotionBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#FFD700',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
        zIndex: 10,
        maxWidth: 220,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
    },
    promotionBadgeText: {
        color: '#C0392B',
        fontWeight: 'bold',
        fontSize: 12,
    },
    ratingBox: {
        position: 'absolute',
        left: 10,
        bottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    footerBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
        paddingHorizontal: 4,
    },
    locationName: {
        fontWeight: 'bold',
        fontSize: 18,
        color: '#222',
        marginBottom: 2,
        maxWidth: CARD_WIDTH - 30,
    },
    locationProvince: {
        color: '#666',
        fontSize: 14,
        marginBottom: 2,
        maxWidth: CARD_WIDTH - 30,
    },
    priceText: {
        color: '#196EEE',
        fontWeight: 'bold',
        fontSize: 15,
        marginBottom: 2,
    },
    heartBox: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
    },
})