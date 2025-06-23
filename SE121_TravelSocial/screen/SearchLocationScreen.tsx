import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, Image, TouchableOpacity, TextInput, ScrollView, Alert, Platform, FlatList, ActivityIndicator } from 'react-native';
import { NativeStackNavigatorProps } from 'react-native-screens/lib/typescript/native-stack/types';
import FilterButton from '@/components/LocationScreen/FilterButton';
import { API_BASE_URL } from '../constants/config';

export default function SearchLocationScreen({ navigation }: { navigation: NativeStackNavigatorProps }) {
    const [filterData, setFilterData] = useState([]);
    const [locationList, setLocationList] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [minPrice, setMinPrice] = useState(0);
    const [isFiltering, setIsFiltering] = useState(false);



    const handleApplyFilter = (filters: any) => {
        setFilterData(filters);
        setIsFiltering(true);
        setPage(1);
        fetchFilteredLocations(filters);
    };
    

    const fetchAllLocations = async (pageNumber = 1, isLoadMore = false) => {
        try {
            if (isLoadMore && (isFetchingMore || !hasMore)) return;
            setIsFetchingMore(true);
    
            const response = await fetch(`${API_BASE_URL}/alllocation?page=${pageNumber}&limit=10`);
            const data = await response.json();
    
            if (data.isSuccess) {
                const newLocations = data.data.data;
                setLocationList(prev => {
                    const existingIds = new Set(prev.map(item => item._id));
                    const uniqueNewLocations = newLocations.filter((item: { _id: any; }) => !existingIds.has(item._id));
                    return isLoadMore ? [...prev, ...uniqueNewLocations] : newLocations;
                });
    
                setHasMore(newLocations.length > 0);
                setPage(prev => prev + 1);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Lỗi khi tải thêm all location:', error);
        } finally {
            setIsFetchingMore(false);
        }
    };
    
    

    const fetchFilteredLocations = async (filters: any) => {
        try {
            const hasFilter = Object.values(filters).some(value => value); // kiểm tra có ít nhất 1 filter không
            if (!hasFilter) {
                fetchAllLocations(); // không có filter thì load all
                return;
            }
    
            const query = new URLSearchParams(filters).toString();
            const response = await fetch(`${API_BASE_URL}/search?${query}`);
            console.log('Filter API URL:', `${API_BASE_URL}/search?${query}`); // Log URL để kiểm tra
            const data = await response.json();
    
            if (Array.isArray(data) && data.length > 0) {
                setLocationList(data);
                setHasMore(false);
                console.log('Filtered locations:', data);
            } else {
                setLocationList([]);
                Alert.alert('Không tìm thấy địa điểm phù hợp.');
            }
        } catch (error) {
            console.error("Lỗi khi gọi API bộ lọc:", error);
            Alert.alert('Lỗi', 'Không thể tải dữ liệu');
        }
    };

    useEffect(() => {
        fetchAllLocations(1,false);
    }, []);

    const handleLoadMore = () => {
        if (!isFetchingMore && hasMore && !isFiltering) {
            fetchAllLocations(page, true);
        }
    };

    const handleResetFilter = () => {
        setFilterData([]);
        setIsFiltering(false);
        setPage(1);
        setHasMore(true);             // ✅ Reset lại để cho phép load
        setIsFetchingMore(false);     // ✅ Đảm bảo cho phép fetch
        fetchAllLocations(1, false);  // Gọi lại hàm fetch
    };
    

    return (

        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.arrowleftbutton} onPress={() => navigation.goBack()}>
                    <Image source={require('../assets/icons/arrowleft.png')} style={styles.arrowlefticon} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Địa điểm</Text>
            </View>
            <View style={styles.filterContainer}>
               
                <FilterButton onApplyFilter={handleApplyFilter} />
                {isFiltering && (
                    <TouchableOpacity style={styles.clearFilterButton} onPress={handleResetFilter}>
                        <Text style={styles.clearFilterText}>Xóa lọc</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={locationList}
                
                keyExtractor={(item, index) => item._id || index.toString()}
                numColumns={2}
                contentContainerStyle={styles.resultContainer}
                columnWrapperStyle={{ justifyContent: 'space-between' }}
                renderItem={({ item }) => (
                    console.log(item), // Log the item to check its structure
                    <View style={styles.card}>
                        <View style={{width: '100%'}}>
                            

                            <View style={{position: 'absolute',backgroundColor:'#F1F1F1', zIndex: 1, padding: 4, top: 100, right: 0, borderRadius: 20}}>
                                <Text style={{fontSize: 14,fontWeight: '400', zIndex: 2, }}>{item?.province}</Text>
                            </View>
                        </View>
                        <View style={{width: '100%'}}>
                            <View style={{position: 'absolute',backgroundColor:'#F1F1F1', zIndex: 1, padding: 4, top: 100, left: 0, borderRadius: 20, flexDirection: 'row', alignItems: 'center'}}>
                                <Image source={require('../assets/icons/star.png')} style={{width: 16, height: 16, marginRight: 5}}/>
                                <Text style={{fontSize: 14,fontWeight: '400', zIndex: 2, }}>{item?.rating}</Text>
                            </View>
                        </View>
                        <Image
                            source={{ uri: item?.image?.[0]?.url || 'https://via.placeholder.com/150' }}
                            style={styles.image}
                        />
                        <Text style={styles.cardTitle}>{item.name}</Text>
                        {/* Hiển thị promotion nếu có */}
                        {item.promotions && item.promotions.length > 0 && (
                            <View style={styles.promotionContainer}>
                                <Image source={require('../assets/icons/discount.png')} style={styles.promotionIcon} />
                                <Text style={styles.promotionText} numberOfLines={1}>
                                    {item.promotions[0].name} {item.promotions[0].discount ? `- Giảm ${item.promotions[0].discount.amount}${item.promotions[0].discount.type === 'PERCENT' ? '%' : ' VND'}` : ''}
                                </Text>
                            </View>
                        )}
                        <Text style={{fontSize: 16, fontWeight: '400', marginTop: 5}}>{typeof item?.minPrice === 'number'
                        ? item.minPrice.toLocaleString('vi-VN') + ' VND'
                        : 'Giá không xác định'}</Text>
                        <Text style={{fontSize: 16, fontWeight: '300', marginTop: 0, marginBottom:10 }}>(Giá tham khảo)</Text>
                        {/* <Text style={styles.cardTitle}>{item?.province}</Text> */}
                        <TouchableOpacity style={{marginBottom: 10}} onPress={() => navigation.navigate('detail-screen', { id: item._id })}>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: '#007AFF' }}>Xem chi tiết</Text>
                        </TouchableOpacity>

                    </View>
                )}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                    isFetchingMore ? (
                        <ActivityIndicator size="small" color="#000" style={{ marginVertical: 10 }} />
                    ) : null
                }
            />

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
        width: '100%',
        position: 'relative',
        backgroundColor: '#ffffff',
        paddingHorizontal: 100,
        paddingVertical: 40,
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
    filterContainer: {
        paddingHorizontal: 20,
        marginBottom: 10,
      },
      resultContainer: {
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    card: {
        backgroundColor: '#f2f2f2',
        borderRadius: 20,
        padding: 0,
        marginBottom: 15,
        justifyContent: 'center',
        alignItems: 'center',
        width: '49%', // 2 cột
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    
    image: {
        width: '100%',
        height: 120,
        borderRadius: 20,
        marginBottom: 8,
    },
    
    cardTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
       // width: '90%',
    },

    clearFilterButton: {
        marginTop: 10,
        backgroundColor: '#e74c3c',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 10,
        alignSelf: 'flex-end',
    },
    
    clearFilterText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    promotionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF9C4',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginTop: 4,
        marginBottom: 2,
        alignSelf: 'flex-start',
    },
    promotionIcon: {
        width: 18,
        height: 18,
        marginRight: 6,
    },
    promotionText: {
        color: '#B8860B',
        fontWeight: 'bold',
        fontSize: 13,
        maxWidth: 120,
    },
});
