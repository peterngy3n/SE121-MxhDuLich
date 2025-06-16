import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Image, View, StyleSheet, TouchableOpacity, Text, Dimensions, ActivityIndicator, FlatList } from 'react-native';
import locationData from '@/constants/location'
import * as Network from 'expo-network';
import { API_BASE_URL, API_RCM_URL } from '../../constants/config';
import { useUser } from '../../context/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window')
const CARD_WIDTH = width - 240;
const CARD_HEIGHT = 200;
const CARD_WIDTH_SPACING = CARD_WIDTH + 24;

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
    
    useEffect(() => {
        // Nếu userId không đổi và đã có cache, dùng cache thay vì gọi API
        if (cacheRef.userId === userId && cacheRef.data.length > 0) {
            setLocations(cacheRef.data);
            setLoading(false);
            setHasMore(cacheRef.data.length > 0);
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
            setLoading(true);
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
            // Gọi API Python realtime_recommend với user_id
            let url = `${API_RCM_URL}/realtime-recommend`;
            if (userId) {
                url += `?user_id=${userId}`;
                if (lastLocationId) {
                    url += `&product_id=${lastLocationId}&event_type=view`;
                }
            } else {
                url += `?top_n=10`;
            }
            const response = await fetchWithTimeout(url, {}, 10000); // 10s timeout
            // Đảm bảo response là Response trước khi gọi .json()
            if (!(response instanceof Response)) {
                throw new Error('Không nhận được phản hồi hợp lệ từ máy chủ.');
            }
            const data = await response.json();
            if (data.recommendations) {
                let newLocations: Location[];
                if (pageNumber === 1) {
                    newLocations = data.recommendations;
                    setLocations(newLocations);
                } else {
                    // Tránh trùng lặp
                    const newItems = data.recommendations as Location[];
                    newLocations = [
                        ...locations,
                        ...newItems.filter((item: Location) =>
                            !(locations as Location[]).some(l => (l._id || l.location_id) === (item._id || item.location_id))
                        )
                    ];
                    setLocations(newLocations);
                }
                // Cập nhật cache ngoài component
                cacheRef.userId = userId || null;
                cacheRef.data = newLocations;
                setHasMore(data.recommendations.length > 0);
                setPage(pageNumber + 1);
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

    const loadMoreData = useCallback(() => {
        if (!onEndReachedCalledDuringMomentum && !isFetchingMore && hasMore) {
            getRealtimeRecommendations(page);
            setOnEndReachedCalledDuringMomentum(true);
        }
    }, [page, isFetchingMore, hasMore, onEndReachedCalledDuringMomentum]);

    const renderItem = ({ item, index }: { item: Location, index: number }) => (
        <TouchableOpacity
            style={{
                marginLeft: 24,
                marginRight: index === locations.length - 1 ? 24 : 0,
                marginBottom: 15,
            }}
            onPress={() => navigation.navigate('detail-screen', { id: item._id })}
        >
            <View style={styles.card}>
                <View style={styles.imageBox}>
                    <Image
                        style={styles.image}
                        source={
                            item?.image?.[0]?.url
                                ? { uri: item.image[0].url }
                                : require('../../assets/images/bai-truoc-20.jpg')
                        }
                    />
                </View>
                <View style={styles.footer}>
                    <Text style={[styles.textStyle, { fontSize: 16 }]}>
                        {item?.name || 'Khách sạn mới'}
                    </Text>
                </View>
                <View style={styles.footer}>
                    <Text style={[styles.textStyle, { fontSize: 12 }]}>
                        {item?.province || 'Tỉnh/Thành phố'}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

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
                data={locations}
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
                onEndReached={loadMoreData}
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
        paddingHorizontal: 5,
        paddingBottom: 20,
    },
    titleText: {
        fontSize: 24,
        fontWeight: 'bold',
        left: 20,
        marginBottom: 10,
    },
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 1,
    },
    imageBox: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT - 60,
        borderRadius: 24,
        overflow: 'hidden',
    },
    image: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT - 60,
        resizeMode: 'cover',
    },
    textBox: {
        flexDirection: 'row',
        backgroundColor: '#4D5652',
        borderRadius: 20,
        alignItems: 'center',
        height: 30,
    },
    textStyle: {
        marginTop: 6,
        fontWeight: 'medium',
        color: 'black',
        marginLeft: 5,
        marginVertical: 2,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    }
})