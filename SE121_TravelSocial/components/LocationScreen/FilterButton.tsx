import React, { useEffect, useState } from 'react';
import {
    View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, TextInput, Image
} from 'react-native';

// import CheckBox from '@react-native-community/checkbox';
import Checkbox from 'expo-checkbox';
import { withDecay } from 'react-native-reanimated';
import category from '@/constants/category';

const services = ['WiFi miễn phí', 'Giặt là', 'Đưa đón sân bay', 'Cho thuê xe hơi'];

const FilterButton = ({ onApplyFilter }: any) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [provinces, setProvinces] = useState<{ label: string; value: string }[]>([]);
    const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [rating, setRating] = useState(1);
    const [costMin, setCostMin] = useState('');
    const [costMax, setCostMax] = useState('');
    const [provinceDropdownOpen, setProvinceDropdownOpen] = useState(false);
    const [provinceModalVisible, setProvinceModalVisible] = useState(false);
    const [serviceModalVisible, setServiceModalVisible] = useState(false);


    //const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);

    useEffect(() => {
        const fetchProvinces = async () => {
            try {
                const response = await fetch('https://esgoo.net/api-tinhthanh/1/0.htm');

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();

                if (data && data.data && Array.isArray(data.data)) {
                    const formattedProvinces = data.data.map((province: { id: string; name: string }) => ({
                        label: province.name,
                        value: province.id,
                    }));
                    setProvinces(formattedProvinces);
                } else {
                    console.error('Data format is incorrect:', data);
                }
            } catch (error) {
                console.error('Error fetching provinces:', error);
            }
        };

        fetchProvinces();
    }, []);

    const toggleProvince = (province: string) => {
        setSelectedProvinces(prev =>
            prev.includes(province) ? prev.filter(p => p !== province) : [...prev, province]
        );
    };

    const toggleService = (service: string) => {
        setSelectedServices(prev =>
            prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
        );
    };

    const handleApply = () => {
        onApplyFilter({
            //selectedProvinces,
            rating,
            costMin: Number(costMin),
            costMax: Number(costMax),
            //category,
        });
        setModalVisible(false);
    };

    return (
        <View style={{ marginTop: -20, width: '100%' }}>
            <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
                <Image style={{width: 22, height: 22, marginRight: 5}} source={require('../../assets/icons/filter.png')}></Image>
                <Text style={styles.buttonText}>Bộ lọc</Text>
            </TouchableOpacity>

            <Modal transparent={true} visible={modalVisible} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <View style={styles.modalContent}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={styles.title}>Bộ lọc</Text>
                                <TouchableOpacity style={{ backgroundColor: '#196EEE', width: 30, height: 30, marginBottom: 18, borderRadius: 5, justifyContent: 'center', alignItems: 'center' }} onPress={() => setModalVisible(false)}>
                                    <Text style={{ color: 'white', fontSize: 18 }}>X</Text>
                                </TouchableOpacity>
                                
                            </View>
                            

                            {/* Provinces */}
                           
                            <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'space-between' }}>
                                <TouchableOpacity
                                    style={[styles.dropdownButton, { flex: 1 }]}
                                    onPress={() => setProvinceModalVisible(true)}
                                >
                                    <Text style={styles.dropdownText}>
                                        {selectedProvinces.length === 0
                                            ? 'Khu vực'
                                            : selectedProvinces.length === 1
                                                ? provinces.find(p => p.value === selectedProvinces[0])?.label
                                                : `${selectedProvinces.length} tỉnh`}
                                    </Text>
                                    <Text style={{ color: 'purple' }}>▼</Text>
                                </TouchableOpacity>
                                {/* Dropdown dịch vụ */}
                                <TouchableOpacity
                                    style={[styles.dropdownButton, { flex: 1 }]}
                                    onPress={() => setServiceModalVisible(true)}
                                >
                                    <Text style={styles.dropdownText}>
                                        {selectedServices.length === 0
                                            ? 'Dịch vụ'
                                            : selectedServices.length === 1
                                                ? selectedServices[0]
                                                : `${selectedServices.length} dịch vụ`}
                                    </Text>
                                    <Text style={{ color: 'purple' }}>▼</Text>
                                </TouchableOpacity>
                            </View>


                            <Modal transparent={true} visible={provinceModalVisible} animationType="slide">
                                <View style={styles.modalOverlay}>
                                    <View style={styles.modalBox}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Text style={styles.title}>Chọn tỉnh</Text>
                                            <TouchableOpacity style={{ backgroundColor: '#196EEE', width: 30, height: 30, marginBottom: 18, borderRadius: 5, justifyContent: 'center', alignItems: 'center' }} onPress={() => setProvinceModalVisible(false)}>
                                                <Text style={{ color: 'white', fontSize: 18 }}>X</Text>
                                            </TouchableOpacity>

                                        </View>
                                        <ScrollView style={styles.modalContent}>

                                            {provinces.map((province, idx) => (
                                                <TouchableOpacity
                                                    key={idx}
                                                    style={styles.checkboxContainer}
                                                    onPress={() => toggleProvince(province.value)}
                                                >
                                                    <Checkbox
                                                        value={selectedProvinces.includes(province.value)}
                                                        onValueChange={() => toggleProvince(province.value)}
                                                        color={selectedProvinces.includes(province.value) ? '#007bff' : undefined}
                                                    />
                                                    <View style={{ width: '100%' }}>
                                                        <Text style={{ fontSize: 16, fontWeight: '500', marginLeft: 5, marginTop: 5 }}>{province.label}</Text>
                                                    </View>

                                                </TouchableOpacity>
                                            ))}

                                            <TouchableOpacity
                                                style={[styles.applyButton, { marginTop: 0, marginBottom: 30 }]}
                                                onPress={() => setProvinceModalVisible(false)}
                                            >
                                                <Text style={styles.applyButtonText}>Xong</Text>
                                            </TouchableOpacity>
                                        </ScrollView>
                                    </View>
                                </View>
                            </Modal>
                            {/* Service Modal */}
                            <Modal transparent={true} visible={serviceModalVisible} animationType="slide">
                                <View style={styles.modalOverlay}>
                                    <View style={styles.modalBox}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Text style={styles.title}>Chọn dịch vụ</Text>
                                            <TouchableOpacity
                                                style={{
                                                    backgroundColor: '#196EEE',
                                                    width: 30,
                                                    height: 30,
                                                    marginBottom: 18,
                                                    borderRadius: 5,
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                }}
                                                onPress={() => setServiceModalVisible(false)}
                                            >
                                                <Text style={{ color: 'white', fontSize: 18 }}>X</Text>
                                            </TouchableOpacity>
                                        </View>

                                        <ScrollView style={styles.modalContent}>
                                            {services.map((service, idx) => (
                                                <TouchableOpacity
                                                    key={idx}
                                                    style={styles.checkboxContainer}
                                                    onPress={() => toggleService(service)}
                                                >
                                                    <Checkbox
                                                        value={selectedServices.includes(service)}
                                                        onValueChange={() => toggleService(service)}
                                                        color={selectedServices.includes(service) ? '#007bff' : undefined}
                                                    />
                                                    <Text style={{ fontSize: 16, fontWeight: '500', marginLeft: 5, marginTop: 5 }}>
                                                        {service}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}

                                            <TouchableOpacity
                                                style={[styles.applyButton, { marginTop: 0, marginBottom: 30 }]}
                                                onPress={() => setServiceModalVisible(false)}
                                            >
                                                <Text style={styles.applyButtonText}>Xong</Text>
                                            </TouchableOpacity>
                                        </ScrollView>
                                    </View>
                                </View>
                            </Modal>
                            {/* Rating */}
                            <Text style={styles.sectionTitle}>Đánh giá tối thiểu</Text>
                            <View style={styles.ratingRow}>
                                {[1, 2, 3, 4, 5].map(r => (
                                    <TouchableOpacity key={r} onPress={() => setRating(r)} style={styles.starItem}>
                                        <Text style={{ fontSize: 25, color: r <= rating ? 'orange' : 'gray' }}>★</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Price range */}
                            <Text style={styles.sectionTitle}>Khoảng giá (VND)</Text>
                            <View style={styles.priceRow}>
                                <TextInput
                                    placeholder="Tối thiểu"
                                    keyboardType="numeric"
                                    value={costMin}
                                    onChangeText={setCostMin}
                                    style={styles.input}
                                />
                                <Text style={{ marginHorizontal: 5 }}>-</Text>
                                <TextInput
                                    placeholder="Tối đa"
                                    keyboardType="numeric"
                                    value={costMax}
                                    onChangeText={setCostMax}
                                    style={styles.input}
                                />
                            </View>

                            {/* Apply button */}
                            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
                                <Text style={styles.applyButtonText}>Áp dụng bộ lọc</Text>
                            </TouchableOpacity>

                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: 'grey',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        alignSelf: 'flex-start',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    modalBox: {
        width: '90%',
        height: 400,
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 10,
    },

    dropdownButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 10,
        padding: 10,
        marginBottom: 10,
    },

    dropdownText: {
        fontSize: 16,
    },

    dropdownList: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 10,
        backgroundColor: '#fff',
        marginBottom: 10,
        height: 400,
    },

    dropdownItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    buttonText: {
        fontSize: 16,
        color: 'black',
        fontWeight: '600',
    },
    modalContent: {
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    sectionTitle: {
        fontWeight: '600',
        marginTop: 15,
        marginBottom: 5,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    ratingRow: {
        flexDirection: 'row',
        marginVertical: 10,
    },
    starItem: {
        marginHorizontal: 5,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 6,
        borderRadius: 6,
        flex: 1,
    },
    applyButton: {
        backgroundColor: '#196EEE',
        padding: 12,
        borderRadius: 8,
        marginTop: 20,
    },
    applyButtonText: {
        color: 'white',
        fontWeight: '600',
        textAlign: 'center',
    },
});

export default FilterButton;
