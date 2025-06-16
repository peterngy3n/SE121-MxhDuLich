import { API_BASE_URL } from '@/constants/config';
import { RootStackParamList } from '@/types/navigation';
import { NavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, Modal, TextInput, ScrollView } from 'react-native';
import { Icon } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useUser } from '@/context/UserContext';

interface TicketProps {
  title: string;
  date: string;
  status: string;
  onCancel: () => void;
  imageUrl: string;
  bookingId: string;
  locationId: string;
}

const Ticket: React.FC<TicketProps> = ({ title, date, status, onCancel, imageUrl, bookingId, locationId }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { userId } = useUser();
  const [modalVisible, setModalVisible] = useState(false);
  const [rating, setRating] = useState('');
  const [review, setReview] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [reviewList, setReviewList] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingReview, setEditingReview] = useState<any>(null);
  const [editReviewText, setEditReviewText] = useState('');
  const [editRating, setEditRating] = useState('');
  const [editSelectedImages, setEditSelectedImages] = useState<string[]>([]);
  const [editReviewId, setEditReviewId] = useState<string | null>(null);
  const [showMyReviews, setShowMyReviews] = useState(false);

  const handleNavigate = () => {
    navigation.navigate('detail-booking-screen', {bookingId ,title, status}); 
    console.log(bookingId)// Truyền bookingId
    console.log(locationId)
    console.log(title)
    console.log(status)
  };

  // Hàm chọn nhiều ảnh
  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      // result.assets là mảng các ảnh được chọn
      setSelectedImages(result.assets.map((asset) => asset.uri));
    }
  };

  // Hàm chọn ảnh cho modal chỉnh sửa
  const pickEditImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setEditSelectedImages(result.assets.map((asset) => asset.uri));
    }
  };

  // Helper to extract file name and type from URI
  const getFilenameAndType = (uri: string) => {
    const uriParts = uri.split("/");
    const name = uriParts[uriParts.length - 1];
    const fileTypeParts = name.split(".");
    const fileType = fileTypeParts[fileTypeParts.length - 1];
    return { name, fileType };
  };

  // Sửa hàm gửi review để gửi kèm ảnh (upload trước, lấy kết quả, rồi post review)
  const handleSubmitBooking = async () => {
    try {
      let uploadedImages = [];
      // Bước 1: Upload ảnh nếu có
      if (selectedImages.length > 0) {
        const formData = new FormData();
        selectedImages.forEach((uri, idx) => {
          const { name, fileType } = getFilenameAndType(uri);
          formData.append('files', {
            uri,
            name,
            type: `image/${fileType}`,
          } as any);
        });
        const uploadResponse = await fetch(`${API_BASE_URL}/upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          credentials: 'include',
          body: formData,
        });
        const uploadResult = await uploadResponse.json();
        if (!uploadResult.isSuccess) {
          alert(uploadResult.message || 'Không thể upload ảnh.');
          return;
        }
        // Giả sử uploadResult.data là [{url: "...", publicId: "..."}, ...]
        uploadedImages = uploadResult.data.map((img: any) => img.url);
        console.log('Uploaded images:', uploadedImages);
      }
      // Bước 2: Gửi review với image là mảng object
      const reviewData = {
        locationId,
        rating,
        review,
        image: uploadedImages,
      };
      const response = await fetch(`${API_BASE_URL}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });
      const result = await response.json();
      if (result.isSuccess) {
        alert('Đánh giá đã được gửi!');
        setModalVisible(false);
        setSelectedImages([]);
        setReview('');
        setRating('');
      } else {
        alert(result.message || 'Không thể gửi đánh giá.');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Lỗi khi gửi đánh giá.');
    }
  };

  const handleRateBooking = () =>{
    setModalVisible(true)
  }

  const handleRebook = () => {
    // navigation.navigate('rebook-screen', { bookingId }); // Điều hướng tới màn hình đặt lại
  };

  const handleStarPress = (value:any) => {
    setRating(value);
  };

  const handleCancelBooking = () => {
    Alert.alert(
      'Xác nhận hủy',
      'Bạn có chắc chắn muốn hủy booking này?',
      [
        {
          text: 'Không',
          style: 'cancel',
        },
        {
          text: 'Có',
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/booking/update/${bookingId}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: 'canceled' }), // Truyền trạng thái mới
              });
  
              const result = await response.json();
  
              if (result.isSuccess) {
                Alert.alert('Thành công', 'Booking đã được hủy.');
                onCancel(); // Cập nhật danh sách sau khi hủy
              } else {
                Alert.alert('Lỗi', result.message || 'Không thể hủy booking.');
              }
            } catch (error) {
              console.error('Error canceling booking:', error);
              Alert.alert('Lỗi', 'Không thể kết nối với máy chủ.');
            }
          },
        },
      ],
      { cancelable: true } // Cho phép hủy bỏ thông báo bằng cách nhấn ra ngoài
    );
  };
  

  // Hàm gọi API update review
  const handleUpdateReview = async () => {
    try {
      let uploadedImages = [];
      if (editSelectedImages.length > 0) {
        const formData = new FormData();
        editSelectedImages.forEach((uri, idx) => {
          const { name, fileType } = getFilenameAndType(uri);
          formData.append('files', {
            uri,
            name,
            type: `image/${fileType}`,
          } as any);
        });
        const uploadResponse = await fetch(`${API_BASE_URL}/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'multipart/form-data' },
          credentials: 'include',
          body: formData,
        });
        const uploadResult = await uploadResponse.json();
        if (!uploadResult.isSuccess) {
          alert(uploadResult.message || 'Không thể upload ảnh.');
          return;
        }
        uploadedImages = uploadResult.data.map((img: any) => img.url);
      }
      // Gửi request update review
      const reviewData = {
        rating: editRating,
        review: editReviewText,
        image: uploadedImages.length > 0 ? uploadedImages : editingReview.image,
      };
      const response = await fetch(`${API_BASE_URL}/review/${editReviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewData }),
      });
      const result = await response.json();
      if (result.isSuccess) {
        alert('Cập nhật đánh giá thành công!');
        setEditModalVisible(false);
        setEditSelectedImages([]);
        setEditReviewText('');
        setEditRating('');
        setEditReviewId(null);
        // Reload reviews
        fetchReviews();
      } else {
        alert(result.message || 'Không thể cập nhật đánh giá.');
      }
    } catch (error) {
      console.error('Error updating review:', error);
      alert('Lỗi khi cập nhật đánh giá.');
    }
  };

  // Hàm mở modal chỉnh sửa
  const handleEditReview = (review: any) => {
    setEditingReview(review);
    setEditReviewText(review.review);
    setEditRating(review.rating.toString());
    setEditSelectedImages([]);
    setEditReviewId(review._id);
    setEditModalVisible(true);
  };

  // Hàm fetch lại reviews (giả sử đã có hàm fetchReviews)
  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const res = await fetch(`${API_BASE_URL}/review/location/${locationId}`);
      const data = await res.json();
      if (data.isSuccess) {
        // Lọc chỉ review của user hiện tại
        const userReviews = data.data.filter((review: any) => review.senderId === userId);
        setReviewList(userReviews);
      }
    } catch (e) {}
    setLoadingReviews(false);
  };

  useEffect(() => {
    fetchReviews();
  }, [locationId]);

  let statusText = '';
  let statusColor = '#000';
  let buttonText = '';
  let buttonAction: () => void = handleNavigate;
  let buttonColor = '#000';

  switch (status) {
    case 'pending':
      statusText = 'Chờ duyệt';
      statusColor = '#F4C726';
      buttonText = 'Hủy';
      buttonColor = '#F45B69';
      buttonAction = handleCancelBooking;
      break;
    case 'confirm':
      statusText = 'Đã xác nhận';
      statusColor = '#F4C726';
      buttonText = 'Hủy';
      buttonColor = '#F45B69';
      buttonAction = handleCancelBooking;
      break;
    case 'complete':
      statusText = 'Hoàn tất';
      statusColor = '#3FC28A';
      buttonText = 'Đánh giá';
      buttonColor = '#007AFF'; // Xanh dương đậm
      buttonAction = handleRateBooking;
      break;
    case 'canceled':
      statusText = 'Đã hủy';
      statusColor = '#F45B69';
      buttonText = 'Đặt lại';
      buttonColor = '#007AFF';
      buttonAction = handleRebook;
      break;
    default:
      statusText = 'Không xác định';
      statusColor = '#666';
      buttonText = '';
      buttonAction = () => {};
      buttonColor = '#666';
      break;
  }
  
  return (
    <TouchableOpacity onPress={handleNavigate}>
      <View style={styles.body}>
        <View style={{ flexDirection: 'row' }}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUrl }} style={styles.image} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.title2}>{date}</Text>
            <View style={styles.detailsContainer}>
              <View style={styles.ratingBox}>
                <Text style={{ color: '#666', fontSize: 14 }}>Trạng thái: </Text>
                <Text  style={[styles.stateText, { color: statusColor }]}>{statusText}</Text>
              </View>
              <TouchableOpacity style={[styles.featureBox]} onPress={buttonAction}>
                <Text style={[styles.boxText, {color:buttonColor}]}>{buttonText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Viết đánh giá</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập đánh giá"
              value={review}
              onChangeText={setReview}
              multiline
            />
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => handleStarPress(star)}>
                  <Image
                    source={
                      star <= parseFloat(rating)
                        ? require('../../assets/icons/star.png')
                        : require('../../assets/icons/emptystar.png')
                    }
                    style={styles.star}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {/* Nút chọn ảnh và hiển thị ảnh đã chọn */}
            <TouchableOpacity style={{marginVertical: 10}} onPress={pickImages}>
              <Text style={{color: '#196EEE', fontWeight: 'bold'}}>Chọn ảnh đánh giá</Text>
            </TouchableOpacity>
            <View style={{flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10}}>
              {selectedImages.map((uri, idx) => (
                <Image key={idx} source={{ uri }} style={{ width: 60, height: 60, margin: 3, borderRadius: 8 }} />
              ))}
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.buttonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmitBooking}>
                <Text style={styles.buttonText}>Gửi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Modal chỉnh sửa review */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chỉnh sửa đánh giá</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập đánh giá"
              value={editReviewText}
              onChangeText={setEditReviewText}
              multiline
            />
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setEditRating(star.toString())}>
                  <Image
                    source={
                      star <= parseFloat(editRating)
                        ? require('../../assets/icons/star.png')
                        : require('../../assets/icons/emptystar.png')
                    }
                    style={styles.star}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={{marginVertical: 10}} onPress={pickEditImages}>
              <Text style={{color: '#196EEE', fontWeight: 'bold'}}>Chọn ảnh mới (nếu muốn thay)</Text>
            </TouchableOpacity>
            <View style={{flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10}}>
              {editSelectedImages.map((uri, idx) => (
                <Image key={idx} source={{ uri }} style={{ width: 60, height: 60, margin: 3, borderRadius: 8 }} />
              ))}
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditModalVisible(false)}>
                <Text style={styles.buttonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleUpdateReview}>
                <Text style={styles.buttonText}>Cập nhật</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Hiển thị danh sách review */}
      <View style={{marginHorizontal: 20, marginTop: 10}}>
        <TouchableOpacity
          style={{alignSelf: 'flex-end', marginBottom: 8, backgroundColor: '#196EEE', padding: 8, borderRadius: 8}}
          onPress={() => setShowMyReviews((prev) => !prev)}
        >
          <Text style={{color: 'white', fontWeight: 'bold'}}>
            {showMyReviews ? 'Ẩn đánh giá của bản thân' : 'Xem đánh giá của bản thân'}
          </Text>
        </TouchableOpacity>
        {showMyReviews && (
          loadingReviews ? (
            <></>
          ) : reviewList.length === 0 ? (
            <></>
          ) : (
            reviewList.map((item, idx) => (
              <View key={item._id || idx} style={{marginBottom: 16, backgroundColor: '#f7f7f7', borderRadius: 10, padding: 10}}>
                <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 4}}>
                  <Image source={item.senderAvatar?.url ? { uri: item.senderAvatar.url } : require('../../assets/images/avt.png')} style={{width: 32, height: 32, borderRadius: 16, marginRight: 8}} />
                  <Text style={{fontWeight: 'bold'}}>{item.senderName || 'Ẩn danh'}</Text>
                  <View style={{flexDirection: 'row', marginLeft: 8}}>
                    {[...Array(5)].map((_, i) => (
                      <Image
                        key={i}
                        source={i < (item.rating || 0) ? require('../../assets/icons/star.png') : require('../../assets/icons/emptystar.png')}
                        style={{ width: 15, height: 15, marginRight: 2 }}
                      />
                    ))}
                  </View>
                  {item.senderId === userId && (
                    <TouchableOpacity style={{marginLeft: 10}} onPress={() => handleEditReview(item)}>
                      <Text style={{color: '#196EEE', fontWeight: 'bold'}}>Chỉnh sửa</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={{marginBottom: 4}}>{item.review || 'Không có nhận xét.'}</Text>
                {item.image && item.image.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                    {item.image.map((img: any, idx: number) => (
                      <Image
                        key={img?.url + idx}
                        source={{ uri: img }}
                        style={{ width: 90, height: 70, borderRadius: 8, marginRight: 8, resizeMode: 'cover' }}
                      />
                    ))}
                  </ScrollView>
                )}
              </View>
            ))
          ))}

      </View>
    </TouchableOpacity>

    
  );
};

const styles = StyleSheet.create({
  body: {
    marginTop: 20,
  },
  imageContainer: {
    marginLeft: 20,
    width: 130,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    overflow: 'hidden',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  star: {
    width:40,
    height:40,
    marginHorizontal: 5,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  textContainer: {
    flex: 1,
    marginLeft: 10,
  },
  stateText: {
    color: '#F8D675',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  title2: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: '300',
    flexShrink: 1,
    flexWrap: 'wrap',
    marginLeft: 2,
  },
  detailsContainer: {
    position: 'absolute',
    flexDirection: 'row',
    bottom: 0,
  },
  ratingBox: {
    flexDirection: 'row',
    backgroundColor: '#F1F1F1',
    padding: 10,
    borderRadius: 20,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureBox: {
    flexDirection: 'row',
    borderRadius: 20,
    backgroundColor: '#F1F1F1',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxText: {
    fontWeight: '600',
    color: '#F00',
  },
  rateButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
  },
  rateButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    backgroundColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#196EEE',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default Ticket;
