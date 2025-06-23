import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Image, View, StyleSheet, TouchableOpacity, Text, Dimensions, ActivityIndicator, FlatList } from 'react-native';
import locationData from '@/constants/location'
import * as Network from 'expo-network';
import { API_BASE_URL, API_RCM_URL } from '../../constants/config';
import { useUser } from '../../context/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window')
const CARD_WIDTH = width - 80; // Tăng chiều rộng thẻ
const CARD_HEIGHT = 240; // Tăng chiều cao thẻ
const CARD_WIDTH_SPACING = CARD_WIDTH + 24;
const PAGE_SIZE = 10; // Số lượng location hiển thị mỗi lần lazy load

interface DailySectionProps {
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
const dailySectionCacheRef = { userId: null as string | null, data: [] as Location[] };

const DailySectionComponent = React.memo(function DailySection({ categoryId, navigation }: DailySectionProps) {
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [onEndReachedCalledDuringMomentum, setOnEndReachedCalledDuringMomentum] = useState(false);
    const flatListRef = useRef(null);
    const { userId } = useUser();
    // Sử dụng cacheRef ngoài component
    const cacheRef = dailySectionCacheRef;
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [allLocations, setAllLocations] = useState<Location[]>([]); // Lưu toàn bộ danh sách location
    const [displayedLocations, setDisplayedLocations] = useState<Location[]>([]); // Danh sách location đang hiển thị
    
    useEffect(() => {
        // Nếu userId không đổi và đã có cache, dùng cache thay vì gọi API
        if (cacheRef.userId === userId && cacheRef.data.length > 0) {
            setAllLocations(cacheRef.data);
            setDisplayedLocations(cacheRef.data.slice(0, PAGE_SIZE));
            setLoading(false);
            setHasMore(cacheRef.data.length > PAGE_SIZE);
            return;
        }
        getRealtimeRecommendations(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    // Hàm fetch có timeout
    const fetchWithTimeout = (url: string, options = {}, timeout = 10000) => {
        return Promise.race([
            fetch(url, options),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout')), timeout)
            )
        ]);
    };

    const getRealtimeRecommendations = async (pageNumber: number) => {
        try {
            setLoading(pageNumber === 1);
            setErrorMsg(null);
            // Kiểm tra kết nối mạng trước khi fetch
            const networkState = await Network.getNetworkStateAsync();
            let lastLocationId = await AsyncStorage.getItem('lastViewedLocationId');
            if (!networkState.isConnected) {
                setErrorMsg('Không có kết nối mạng. Vui lòng kiểm tra lại.');
                setLoading(false);
                setIsFetchingMore(false);
                return;
            }
            let url = `${API_RCM_URL}/realtime-recommend`;
            if (userId) {
                url += `?user_id=${userId}`;
                if (lastLocationId) {
                    url += `&product_id=${lastLocationId}&event_type=view`;
                }
            } else {
                url += `?top_n=10`;
            }
            // Thêm phân trang nếu API hỗ trợ, ví dụ: &page=2
            url += `&page=${pageNumber}`;

            const response = await fetchWithTimeout(url, {}, 10000); // 10s timeout
            if (!(response instanceof Response)) {
                throw new Error('Không nhận được phản hồi hợp lệ từ máy chủ.');
            }
            const data = await response.json();
            if (data.recommendations) {
                const locationIds = data.recommendations.map((item: any) => item._id || item.location_id).filter(Boolean);
                if (locationIds.length === 0) {
                    if (pageNumber === 1) setLocations([]);
                    setHasMore(false);
                    setLoading(false);
                    return;
                }
                const promoRes = await fetchWithTimeout(
                    `${API_BASE_URL}/locations-with-promotion-by-ids`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ locationIds })
                    },
                    10000
                );
                if (!(promoRes instanceof Response)) {
                    throw new Error('Không nhận được phản hồi hợp lệ từ máy chủ (promotion).');
                }
                const promoData = await promoRes.json();
                if (promoData.isSuccess && Array.isArray(promoData.data)) {
                    const newLocations = promoData.data;
                    setAllLocations(newLocations);
                    setDisplayedLocations(newLocations.slice(0, PAGE_SIZE));
                    setHasMore(newLocations.length > PAGE_SIZE);
                } else {
                    setAllLocations([]);
                    setDisplayedLocations([]);
                }
                // Cập nhật cache ngoài component chỉ khi pageNumber === 1
                if (pageNumber === 1) {
                    cacheRef.userId = userId || null;
                    cacheRef.data = promoData.data || [];
                }
                setPage(2); // Bắt đầu từ page 2 cho lazy load FE
            } else {
                setHasMore(false);
            }
        } catch (error: any) {
            setHasMore(false);
            if (error instanceof TypeError && String(error).includes('Network request failed')) {
                setErrorMsg('Không thể kết nối tới máy chủ. Vui lòng kiểm tra mạng hoặc thử lại sau.');
            } else if (error.message === 'Request timeout') {
                setErrorMsg('Kết nối tới máy chủ quá lâu. Vui lòng thử lại sau.');
            } else {
                setErrorMsg('Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại.');
            }
            console.log('Realtime Recommend API error:', error);
        } finally {
            setIsFetchingMore(false);
            setLoading(false);
        }
    };

    // Hàm xử lý khi cuộn tới cuối danh sách (lazy load)
    const handleLoadMore = () => {
        if (isFetchingMore || !hasMore) return;
        setIsFetchingMore(true);
        setTimeout(() => {
            const nextPage = page + 1;
            const startIdx = (nextPage - 1) * PAGE_SIZE;
            const endIdx = startIdx + PAGE_SIZE;
            const nextLocations = allLocations.slice(startIdx, endIdx);
            if (nextLocations.length > 0) {
                setDisplayedLocations(prev => [...prev, ...nextLocations]);
                setPage(nextPage);
                setHasMore(allLocations.length > endIdx);
            } else {
                setHasMore(false);
            }
            setIsFetchingMore(false);
        }, 300); // Giả lập delay
    };

    const renderItem = ({ item, index }: { item: Location, index: number }) => {
        const hasPromotion = Array.isArray(item.promotions) && item.promotions.length > 0;
        const promotion = hasPromotion ? item.promotions[0] : null;
        return (
            <TouchableOpacity
                style={{
                    flex: 1,
                    margin: 8, // Giảm margin để tiết kiệm không gian
                    minWidth: CARD_WIDTH / 2,
                    maxWidth: CARD_WIDTH,
                }}
                onPress={() => navigation.navigate('detail-screen', { id: item._id })}
                activeOpacity={0.85}
            >
                <View style={styles.cardImproved}>
                    <View style={styles.imageBoxImproved}>
                        <Image
                            style={styles.imageImproved}
                            source={
                                item?.image?.[0]?.url
                                    ? { uri: item.image[0].url }
                                    : require('../../assets/images/bai-truoc-20.jpg')
                            }
                        />
                        {hasPromotion && (
                            <View style={styles.promotionBadgeImproved}>
                                <Image source={require('../../assets/icons/discount.png')} style={{width:16, height:16, marginRight:4}} />
                                <Text style={styles.promotionTextImproved} numberOfLines={1}>
                                    {promotion.name} {promotion.discount ? `- Giảm ${promotion.discount.amount}${promotion.discount.type === 'PERCENT' ? '%' : ' VND'}` : ''}
                                </Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.infoBox}>
                        <Text style={styles.locationName} numberOfLines={1}>{item?.name || 'Khách sạn mới'}</Text>
                        <View style={styles.infoRow}>
                            <Text style={styles.provinceText} numberOfLines={1}>{item?.province || 'Tỉnh/Thành phố'}</Text>
                            <View style={styles.ratingBox}>
                                <Image source={require('../../assets/icons/star.png')} style={styles.ratingIcon} />
                                <Text style={styles.ratingText}>{typeof item?.rating === 'number' ? item.rating.toFixed(1) : '--'}</Text>
                            </View>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.priceText}>
                                {typeof item?.minPrice === 'number' ? item.minPrice.toLocaleString('vi-VN') + ' VND' : 'Giá không xác định'}
                            </Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading && locations.length === 0) {
        return (
            <View style={{ padding: 20 }}>
                <Text style={styles.titleText}>Gợi ý hằng ngày</Text>
                <ActivityIndicator size="large" color="#0000ff" />
                {errorMsg && <Text style={{ color: 'red', marginTop: 10 }}>{errorMsg}</Text>}
            </View>
        );
    }
    if (errorMsg && locations.length === 0) {
        return (
            <View style={{ padding: 20 }}>
                <Text style={styles.titleText}>Gợi ý hằng ngày</Text>
                <Text style={{ color: 'red', marginTop: 10 }}>{errorMsg}</Text>
                <TouchableOpacity onPress={() => getRealtimeRecommendations(1)} style={{ marginTop: 10, backgroundColor: '#176FF2', padding: 10, borderRadius: 8 }}>
                    <Text style={{ color: 'white', textAlign: 'center' }}>Thử lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View>
            <Text style={styles.titleText}>Gợi ý hằng ngày</Text>
            <FlatList
                ref={flatListRef}
                data={displayedLocations}
                horizontal={false}
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, index) =>
                  (item?._id?.toString?.() ||
                   item?.location_id?.toString?.() ||
                   index.toString())
                }
                contentContainerStyle={styles.container}
                renderItem={renderItem}
                numColumns={2}
                onEndReached={handleLoadMore}
                onMomentumScrollBegin={() => setOnEndReachedCalledDuringMomentum(false)}
                onEndReachedThreshold={0.2}
                ListFooterComponent={
                    isFetchingMore ? (
                        <ActivityIndicator size="small" color="#000" style={{ marginHorizontal: 24 }} />
                    ) : null
                }
                removeClippedSubviews={true}
                maxToRenderPerBatch={6}
                initialNumToRender={4}
                windowSize={5}
                updateCellsBatchingPeriod={50}
                getItemLayout={(data, index) => ({
                    length: CARD_HEIGHT + 15,  // Item height + margin
                    offset: (CARD_HEIGHT + 15) * Math.floor(index / 2),
                    index,
                })}
            />
        </View>
    );
});

export default DailySectionComponent;

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 10, // Giảm padding ngang
        paddingBottom: 20,
    },
    titleText: {
        fontSize: 24,
        fontWeight: 'bold',
        left: 20,
        marginBottom: 10,
    },
    cardImproved: {
        backgroundColor: '#fff',
        borderRadius: 18, // Tăng nhẹ border radius
        borderWidth: 1,
        borderColor: '#e0e0e0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 10, // Tăng margin dưới một chút
        overflow: 'hidden',
    },
    imageBoxImproved: {
        width: '100%',
        height: CARD_HEIGHT - 70,
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        overflow: 'hidden',
        backgroundColor: '#f2f2f2',
    },
    imageImproved: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    infoBox: {
        padding: 12,
    },
    locationName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#222',
        marginBottom: 4,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    provinceText: {
        fontSize: 13,
        color: '#666',
        flex: 1,
    },
    ratingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
    },
    ratingIcon: {
        width: 15,
        height: 15,
        marginRight: 2,
    },
    ratingText: {
        fontSize: 13,
        color: '#B8860B',
        fontWeight: 'bold',
    },
    priceText: {
        fontSize: 15,
        color: '#176FF2',
        fontWeight: 'bold',
    },
    promotionBadgeImproved: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: '#FFF9C4',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        zIndex: 2,
        maxWidth: '90%',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    promotionTextImproved: {
        color: '#B22222',
        fontWeight: 'bold',
        fontSize: 13,
        flexShrink: 1,
    },
})