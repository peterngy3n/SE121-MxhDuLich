import {useEffect, useState, useRef, useCallback, useMemo} from 'react';
import React from 'react';
import {View, Text, StyleSheet, TextInput, FlatList, SectionList, TouchableOpacity, Image, ImageBackground, Modal} from 'react-native'

import CategoryItem from "@/components/HomeScreen/CategoryItem";
import categoryData from '@/constants/category';

import PopularSection from '@/components/HomeScreen/PopularSection';
import RecommendedSection from '@/components/HomeScreen/RecommendedSection';
import DailySection from '@/components/HomeScreen/DailySection';
import { NativeStackNavigatorProps } from 'react-native-screens/lib/typescript/native-stack/types';
import styles from '../StyleSheet/HomeScreenStyles'; 
import axios from 'axios';
import { API_BASE_URL } from '@/constants/config';
import FilterLocation from '@/components/HomeScreen/FilterLocation';
import NewEventSection from '@/components/HomeScreen/NewEvent';

interface props {
    setFilterLocations: (filterLocations: any) => void;
}

// Define section and item types
interface SectionItem {
    id: string;
    [key: string]: any;
}

interface HomeSection {
    key: string;
    data: SectionItem[];
}

// --- Đặt các ref instance ngoài function component để giữ nguyên UI state ---
let popularSectionInstance: any = null;
let recommendedSectionInstance: any = null;
let newEventSectionInstance: any = null;
let dailySectionInstance: any = null;
let bannerSectionInstance: any = null;

export default function HomeScreen ({navigation} : {navigation : NativeStackNavigatorProps})
{
    const [selectedCategory, setSelectedCategory] = useState(categoryData.at(0));
    const [locations, setLocations] = useState([]);
    const [filterLocations, setFilterLocations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const sectionListRef = useRef(null);

    const handleSetCategory = (category: typeof categoryData[0]) => {
        setSelectedCategory(category); 
    };

    const fetchLocations = useCallback(async (searchQuery:string) => {
        if (!searchQuery) {
            setFilterLocations([]);  // If no search keyword, clear results list
            return;
        }
        try {
            const response = await axios.get(`${API_BASE_URL}/locationbyname?name=${searchQuery}`);
            setFilterLocations(response.data);
            setError(null);
            return response.data;
        } catch (err) {
            setError('Failed to fetch locations');
            return filterLocations;
        } 
    }, []);

    const handleTextChange = useCallback((text:string) => {
        setQuery(text.replace(/\s+/g, '-'));
        if (!text) {
            setModalVisible(true);
        }
    }, []);

    const handleSelectLocation = useCallback((location: any) => {
        navigation.navigate('detail-screen', { id: location._id})
    }, [navigation]);

    // Tạo ref cho từng section instance để giữ nguyên UI state
    const popularSectionRef = useRef<any>(null);
    const recommendedSectionRef = useRef<any>(null);
    const newEventSectionRef = useRef<any>(null);
    const dailySectionRef = useRef<any>(null);
    const bannerSectionRef = useRef<any>(null);

    // Khởi tạo instance một lần duy nhất ở module scope
    if (!popularSectionInstance) {
        popularSectionInstance = <PopularSection categoryId={selectedCategory?.id} navigation={navigation} />;
    }
    if (!recommendedSectionInstance) {
        recommendedSectionInstance = <RecommendedSection categoryId={selectedCategory?.id} navigation={navigation} />;
    }
    if (!newEventSectionInstance) {
        newEventSectionInstance = <NewEventSection categoryId={selectedCategory?.id} navigation={navigation} />;
    }
    if (!dailySectionInstance) {
        dailySectionInstance = <DailySection categoryId={selectedCategory?.id} navigation={navigation} />;
    }
    if (!bannerSectionInstance) {
        bannerSectionInstance = <Image style={{ width: '100%', height: 200 }} source={require('../assets/images/banner.png')} />;
    }

    // renderItem luôn trả về instance từ ref ngoài component
    const renderItem = useCallback(
      ({ item, section }: { item: SectionItem; section: HomeSection }) => {
        switch (section.key) {
          case 'popular':
            return popularSectionInstance;
          case 'recommended':
            return recommendedSectionInstance;
          case 'newEvent':
            return newEventSectionInstance;
          case 'daily':
            return dailySectionInstance;
          case 'banner':
            return bannerSectionInstance;
          default:
            return null;
        }
      },
      []
    );

    // Tối ưu: chỉ truyền data, không truyền renderItem vào từng section
    const homeSections = useMemo<HomeSection[]>(() => [
      {
        key: 'popular',
        data: [{ id: 'popular', categoryId: selectedCategory?.id }],
      },
      {
        key: 'recommended',
        data: [{ id: 'recommended', categoryId: selectedCategory?.id }],
      },
      {
        key: 'newEvent',
        data: [{ id: 'newEvent', categoryId: selectedCategory?.id }],
      },
      {
        key: 'daily',
        data: [{ id: 'daily', categoryId: selectedCategory?.id }],
      },
      {
        key: 'banner',
        data: [{ id: 'banner' }],
      },
    ], [selectedCategory]);

    // Performance optimizations for section list
    const keyExtractor = useCallback((item: SectionItem) => item.id, []);
    
    return (
    <ImageBackground
      source={require('../assets/icons/logo.png')}
      style={styles.backgroundImage} 
    >
        <View style={styles.container}>
            <View style={{alignItems:'center', width:'95%', flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 10}}>
                <View style={styles.search}>
                    <TouchableOpacity>
                        <Image source={require('../assets/icons/Search.png')} style={styles.icon} />
                    </TouchableOpacity>                   
                    <TextInput
                        style={styles.input}
                        placeholder="Tìm kiến"
                        value={query}
                        onChangeText={handleTextChange}
                        placeholderTextColor="#000000"
                    />
                    <Image source={require('../assets/icons/logoblue.png')} style={styles.logo}/>
                    {query && (
                        <View style={styles.dropdownContainer}>
                        <FilterLocation
                            query={query}
                            onSelect={handleSelectLocation}
                        />
                        </View>
                    )}
                </View>

                <TouchableOpacity onPress={() => navigation.navigate('chat-board-screen')} style={styles.messageButton}>
                    <Image style={{width:30, height:30}} source={require('../assets/icons/message.png')}></Image>
                    {/* <FontAwesome name="message" size={24} color="#FF4500" /> */}
                </TouchableOpacity>
                
            </View>
            <View style={styles.categoryContainer}>
                <FlatList
                    data={categoryData}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({item}) => (
                        <CategoryItem 
                            item={item}
                            selectedCategory={selectedCategory}
                            setSelectedCategory={setSelectedCategory}
                            setLocations={setLocations}
                        />
                    )}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.flatList}
                    removeClippedSubviews={true}
                    windowSize={5}
                    maxToRenderPerBatch={10}
                />
            </View>
           
            <SectionList
                ref={sectionListRef}
                sections={homeSections}
                renderSectionHeader={() => null}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                stickySectionHeadersEnabled={false}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                initialNumToRender={2}
                maxToRenderPerBatch={1}
                windowSize={7}
                updateCellsBatchingPeriod={100}
                onEndReachedThreshold={0.5}
                maintainVisibleContentPosition={{
                    minIndexForVisible: 0
                }}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </View>
    </ImageBackground>
    )
}
