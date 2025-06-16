import {Text, View, StyleSheet, TouchableOpacity} from 'react-native'
import * as React from 'react'
import { Button } from 'react-native-paper'
import * as Network from 'expo-network';
import {API_BASE_URL} from '../../constants/config';

interface item {
    id: string,
    name: string
}
interface props {
    item: item,
    selectedCategory: item | undefined; 
    setSelectedCategory: (category: item) => void;
    setLocations: (locations: any) => void;
}

export default function CategoryItem({item, selectedCategory, setSelectedCategory,setLocations } : props) {

    const handlePress = async () => {
        // const ipAddress = await Network.getIpAddressAsync();
        // console.log('Device IP Address:', ipAddress);
        setSelectedCategory(item);
        try {
            if (item.id === "all"){
                return;
            }

            const response = await fetch(`${API_BASE_URL}/locationbycategory/${item.id}`);
            const data = await response.json();
            if (data.isSuccess) {
                setLocations(data.data); 
            } else {
                console.error('API error:', data.error);
            }
        } catch (error) {
            console.error('Network errore:', error);
        }
    };

    return (
        <TouchableOpacity 
            onPress={handlePress}>
            <Button style = {[styles.text, 
                selectedCategory?.id == item.id ? null: null
            ]}
            labelStyle={{ 
                color: selectedCategory?.id === item.id ? '#196EEE' : '#000' // Đổi màu chữ khi được chọn
            }}>{item.name}</Button>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        borderRadius:20,
        
    },
    selectedItemText: {

        //backgroundColor: '#e6f7ff',
        color: '#196EEE',
        fontWeight: 'bold',
        borderRadius: 20,
    },
    text: {
        fontSize: 20,
        borderWidth:1,
        borderRadius:20,
        margin: 10,
        
        paddingHorizontal: 15,
        paddingVertical: 6
    }
})
    
