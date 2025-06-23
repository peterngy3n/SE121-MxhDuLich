import React from 'react';
import '../styles/DetailBookingScreen.css';
import { FaBell, FaCalendar, FaEnvelope, FaMoneyBill } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import pagination from '../components/Pagination';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhoneAlt, faEnvelope, faUser, faMapMarkerAlt, faMemo, faLocation } from '@fortawesome/free-solid-svg-icons';
import moment from 'moment';



const BusinessDetailBookingScreen = () => {

  const { id: bookingId } = useParams();
  const [currentTab, setCurrentTab] = useState('customerinfo');
  const [userData, setUserData] = useState(null);
  const [locationData, setLocationData] = useState(null);
  const [userOfBookingId, setUserOfBookingId] = useState(null);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // const onCancel = () => {
  //     if (window.confirm('Bạn có chắc muốn hủy?')) {
  //       console.log('Đã hủy');
  //     }
  // };

  const formattedDate = booking?.dateBooking
    ? moment(booking?.dateBooking).format('DD/MM/YYYY HH:mm:ss')
    : 'Chưa có ngày đặt';

  const handleCustomerInfoClick = () => {
    setCurrentTab('customerinfo');
  }

  const handleLocationInfoClick = () => {
    setCurrentTab('locationinfo')
  }
  const handleBookingInfoClick = () => {
    setCurrentTab('bookinginfo')

  }


  const fetchUserData = async () => {
    try {
      setLoading(true);

      const response = await fetch(`http://localhost:3000/user/getbyid/${booking.userId._id}`);
      const data = await response.json();

      if (response.ok) {
        setUserData(data.data);

      } else {
        setError(data.message || 'Không thể lấy thông tin người dùng');
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi gọi API');
    } finally {
      setLoading(false);
    }
  };

  const fetchLocationData = async () => {
    try {
      setLoading(true);
      console.log('booking.locationId: ', booking);
      const response = await fetch(`http://localhost:3000/locationbyid/${booking.locationId}`);
      const data = await response.json();

      if (response.ok) {
        setLocationData(data.data);
        console.log('data of detail booking: ', data.data);
      } else {
        setError(data.message || 'Không thể lấy thông tin người dùng');
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi gọi API');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Lấy dữ liệu từ localStorage chỉ khi bookingId thay đổi
    const fetchData = async () => {
      const storedBooking = localStorage.getItem('selectedBooking');
      if (storedBooking) {
        const bookingObj = JSON.parse(storedBooking);
        setBooking(bookingObj);
        if (bookingObj.userId) {
          setUserOfBookingId(bookingObj.userId.toString());
        }
      }
      const response = await fetch(`http://localhost:3000/booking/getbyid/${bookingId}`);
      const result = await response.json();
      if (result.isSuccess) {
        setBooking(result.data);
        console.log('Booking data:', result.data);
      }
    };
    fetchData();
  }, [bookingId]);


  useEffect(() => {
    if (userOfBookingId && typeof userOfBookingId === 'string') {
      fetchUserData();
    }
  }, [userOfBookingId]);

  // Fetch location khi booking thay đổi và có locationId hợp lệ
  useEffect(() => {
    if (booking && booking.locationId) {
      fetchLocationData();
    }
  }, [booking]);

  const handleUpdateBooking = async () => {
    const userConfirmed = window.confirm('Bạn có chắc chắn muốn xác nhận đơn đặt này?');

    if (userConfirmed) {
      console.log('log toi day');
      try {
        const response = await fetch(`http://localhost:3000/booking/update/${bookingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'confirm' }),
        });

        const result = await response.json();

        if (result.isSuccess) {
          window.alert('Booking đã được xác nhận.');
          await fetchLocationData();
          //onCancel(); // Cập nhật danh sách sau khi hủy
        } else {
          window.alert(result.message || 'Không thể cập nhật booking.');
        }
      } catch (error) {
        console.error('Error update booking:', error);
        window.alert('Không thể kết nối với máy chủ.');
      }
    }
  };



  // useEffect(() => {
  //     if (bookingId) {
  //         fetchUserData();
  //     }
  // }, [bookingId]);

  useEffect(() => {
    if (userOfBookingId) {
      fetchUserData();
    }
    if (booking) {
      fetchLocationData();
    }
  }, [userOfBookingId, booking, booking?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div>
        <div>
          <div class="max-w-4xl mx-auto mt-10 bg-white rounded-lg shadow-md p-6">
            <div class="flex items-center">
              <img alt="Profile picture of a person" class="w-20 h-20 rounded-full mr-4" height="80" src="https://storage.googleapis.com/a1aa/image/0FPVWfLJ1m0nJS9YfULFrbvezZsDHus5bXhqxVDA6tO9UMKnA.jpg" width="80" />
              <div>
                <h1 class="text-xl font-bold">
                  {booking?.locationName}
                </h1>
                <div class="flex items-center text-gray-600 mt-2">
                  <FaCalendar class="mr-2" />

                  <span>{moment(booking?.checkinDate).format('DD/MM/YYYY HH:mm:ss')} - {moment(booking?.checkoutDate).format('DD/MM/YYYY HH:mm:ss')}</span>
                </div>
                <div class="flex items-center mt-2">
                  <FaMoneyBill class="mr-2 w-5" />

                  <span class="text-green-500 ml-2">{booking?.totalPriceAfterTax?.toLocaleString('vi-VN')} đ</span>

                  {/* <span class="text-green-500 ml-2">34,000,000 đ</span>
                                        <span class="text-green-500 ml-2 status-label-2">- 50%</span> */}

                </div>
                <div class="flex items-center text-gray-500 mt-1 ">
                  <FaEnvelope class="mr-2" />

                  <div class="text-gray-500">
                    Đặt lúc {formattedDate}
                  </div>
                </div>
              </div>
            </div>
            <div class="mt-6">
              <div class="flex">
                <button onClick={handleBookingInfoClick} className={`flex items-center px-4 py-2 ${currentTab === 'bookinginfo' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'} rounded-t-lg`}>
                  <i class="fas fa-user mr-2">
                  </i>
                  <span>
                    <FontAwesomeIcon icon={faUser} className="mr-2" />
                    Thông tin booking
                  </span>

                </button>
                <button onClick={handleCustomerInfoClick} className={`flex items-center px-4 py-2 ${currentTab === 'customerinfo' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'} rounded-t-lg ml-2`}>

                  <i class="fas fa-user mr-2">
                  </i>
                  <span>
                    <FontAwesomeIcon icon={faUser} className="mr-2" />
                    Thông tin khách hàng
                  </span>
                </button>
                <button onClick={handleLocationInfoClick} class={`flex items-center px-4 py-2 ${currentTab === 'locationinfo' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'} rounded-t-lg ml-2`}>
                  <i class="fas fa-map-marker-alt mr-2">
                  </i>
                  <span>
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2" />
                    Thông tin địa điểm
                  </span>
                </button>
              </div>
              {currentTab === 'bookinginfo' && (
                <div class="border border-gray-200 rounded-b-lg p-4">
                  {/* Section: Booking & Customer Summary */}
                  <div class="flex flex-wrap justify-between items-start mb-6">
                    <div class="mb-4 mr-8">
                      <div class="text-gray-500 font-semibold">Mã Booking:</div>
                      <div class="font-bold text-lg mb-2">{booking?._id}</div>
                      <div class="text-gray-500">Trạng thái:</div>
                      <div className={`status-label${booking.status === 'canceled' ? '' : booking.status === 'complete' ? '-2' : '-1'} font-bold mb-2`}>
                        {booking.status === 'pending' && 'Chờ duyệt'}
                        {booking.status === 'confirm' && 'Đã xác nhận'}
                        {booking.status === 'canceled' && 'Đã hủy'}
                        {booking.status === 'complete' && 'Hoàn thành'}
                        {booking.status !== 'pending' && booking.status !== 'confirm' && booking.status !== 'canceled' && booking.status !== 'complete' && booking.status}
                      </div>
                      <div class="text-gray-500">Ngày đặt:</div>
                      <div class="mb-2">{moment(booking?.dateBooking).format('DD/MM/YYYY HH:mm:ss')}</div>
                      <div class="text-gray-500">Ngày checkin:</div>
                      <div class="mb-2">{moment(booking?.checkinDate).format('DD/MM/YYYY')}</div>
                      <div class="text-gray-500">Ngày checkout:</div>
                      <div>{moment(booking?.checkoutDate).format('DD/MM/YYYY')}</div>
                    </div>
                    <div class="mb-4">
                      <div class="text-gray-500 font-semibold">Khách hàng</div>
                      <div class="font-bold">{userData?.userName}</div>
                      <div class="text-gray-500">SĐT: <span class="font-normal">{userData?.userPhoneNumber}</span></div>
                      <div class="text-gray-500">Email: <span class="font-normal">{userData?.userEmail}</span></div>
                    </div>
                    <div class="mb-4">
                      <div class="text-gray-500 font-semibold">Thanh toán</div>
                      <div class="mb-1">Tổng tiền gốc: <span class="font-bold text-blue-700">{booking?.totalPrice?.toLocaleString('vi-VN')} đ</span></div>
                      <div class="mb-1 text-green-600">Giảm giá sự kiện: <span class="font-bold">- {booking?.promotionDiscount ? booking.promotionDiscount.toLocaleString('vi-VN') : '0'} đ</span></div>
                      <div class="mb-1 text-green-600">Giảm giá voucher: <span class="font-bold">- {booking?.voucherDiscount ? booking.voucherDiscount.toLocaleString('vi-VN') : '0'} đ</span></div>
                      <div class="mb-1">Tổng sau giảm: <span class="font-bold">{booking?.totalAfterDiscount?.toLocaleString('vi-VN')} đ</span></div>
                      <div class="mb-1">Thuế: <span class="font-bold">{booking?.tax?.toLocaleString('vi-VN')} đ</span></div>
                      <div class="mb-1 text-green-700">Tổng tiền sau thuế: <span class="font-bold">{booking?.totalPriceAfterTax?.toLocaleString('vi-VN')} đ</span></div>
                      <div class="mb-1">Số tiền đã trả: <span class="font-bold">{booking?.amountPaid?.toLocaleString('vi-VN')} đ</span></div>
                      <div class="mb-1">Còn lại phải thu: <span class="font-bold text-red-600">{((booking?.totalPriceAfterTax || 0) - (booking?.amountPaid || 0)).toLocaleString('vi-VN')} đ</span></div>
                      {booking?.voucherId && (
                        <div class="mb-1">Mã voucher: <span class="font-bold">{booking.voucherId}</span></div>
                      )}
                    </div>
                  </div>
                  {/* Section: Room Table */}
                  <div class="mb-4 border rounded-lg bg-gray-50 p-4">
                    <h2 class="font-bold mb-2 border-b pb-1">Danh sách phòng</h2>
                    <table class="min-w-full text-sm">
                      <thead>
                        <tr class="bg-gray-100">
                          <th class="px-2 py-1 text-left">Phòng</th>
                          <th class="px-2 py-1 text-left">Số lượng</th>
                          <th class="px-2 py-1 text-left">Giá/phòng</th>
                          <th class="px-2 py-1 text-left">Số đêm</th>
                          <th class="px-2 py-1 text-left">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {booking?.items?.map((item, idx) => (
                          <tr key={idx} class="border-b">
                            <td class="px-2 py-1">{item.roomId?.name || item.roomId}</td>
                            <td class="px-2 py-1">{item.quantity}</td>
                            <td class="px-2 py-1">{item.price?.toLocaleString('vi-VN')} đ</td>
                            <td class="px-2 py-1">{item.nights}</td>
                            <td class="px-2 py-1">{(item.price * item.quantity * item.nights)?.toLocaleString('vi-VN')} đ</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Section: Special Notes */}
                  {booking?.specialNote && (
                    <div class="mb-4 border rounded-lg bg-yellow-50 p-4">
                      <div class="font-bold text-yellow-700 mb-1">Ghi chú đặc biệt</div>
                      <div>{booking.specialNote}</div>
                    </div>
                  )}
                  {/* Section: Action Buttons */}
                  <div class="flex items-center justify-end mt-4">
                    {booking?.status !== 'confirm' && (
                      <button
                        onClick={handleUpdateBooking}
                        class="bg-blue-500 text-white px-6 py-2 rounded-full shadow-md hover:bg-blue-600"
                      >
                        Xác nhận Booking
                      </button>
                    )}
                    {/* You can add more manager actions here if needed */}
                  </div>
                </div>
              )}
              {currentTab === 'customerinfo' && (
                <div class="border border-gray-200 rounded-b-lg p-4">
                  <div class="grid grid-cols-2 gap-4">
                    <div class="border rounded-lg bg-gray-50 p-4 mb-4">
                      <div class="mb-2 text-gray-500 font-semibold border-b pb-1">Thông tin khách hàng</div>
                      <div class="mb-2"><span class="text-gray-500">Mã khách hàng:</span> <span class="font-bold">{userData?._id}</span></div>
                      <div class="mb-2"><span class="text-gray-500">Số điện thoại:</span> {userData?.userPhoneNumber}</div>
                      <div class="mb-2"><span class="text-gray-500">Ngày sinh:</span> {userData?.userDateOfBirth}</div>
                      <div class="mb-2"><span class="text-gray-500">Tên liên hệ:</span> {userData?.userName}</div>
                      <div class="mb-2"><span class="text-gray-500">Giới tính:</span> {userData?.gender === 'male' ? 'Nam' : 'Nữ'}</div>
                    </div>
                    <div class="border rounded-lg bg-gray-50 p-4 mb-4">
                      <div class="mb-2 text-gray-500 font-semibold border-b pb-1">Thông tin liên hệ</div>
                      <div class="mb-2"><span class="text-gray-500">Họ và tên:</span> {userData?.userName}</div>
                      <div class="mb-2"><span class="text-gray-500">Địa chỉ email:</span> {userData?.userEmail}</div>
                      <div class="mb-2"><span class="text-gray-500">Số điện thoại liên hệ:</span> {userData?.userPhoneNumber}</div>
                      <div class="mb-2"><span class="text-gray-500">Địa chỉ:</span> {userData?.userPhoneNumber}</div>
                    </div>
                  </div>
                </div>
              )}
              {currentTab === 'locationinfo' && (
                <div class="border border-gray-200 rounded-b-lg p-4">
                  <div class="grid grid-cols-2 gap-4">
                    <div class="border rounded-lg bg-gray-50 p-4 mb-4">
                      <div class="mb-2 text-gray-500 font-semibold border-b pb-1">Thông tin địa điểm</div>
                      <div class="mb-2"><span class="text-gray-500">Mã địa điểm:</span> <span class="font-bold">{booking._id}</span></div>
                      <div class="mb-2"><span class="text-gray-500">Loại:</span> {
                        locationData?.category?.id === 'hotel' ? 'Khách sạn' :
                          locationData?.category?.id === 'homestay' ? 'Homestay' :
                            locationData?.category?.id === 'guest_home' ? 'Nhà nghỉ' :
                              'Danh mục không xác định'
                      }</div>
                    </div>
                    <div class="border rounded-lg bg-gray-50 p-4 mb-4">
                      <div class="mb-2 text-gray-500 font-semibold border-b pb-1">Địa chỉ & ngày đăng ký</div>
                      <div class="mb-2"><span class="text-gray-500">Tên địa điểm:</span> {locationData?.name}
                        {locationData?.address && (
                          <FontAwesomeIcon
                            icon={faMapMarkerAlt}
                            className="ml-2 text-blue-500 cursor-pointer"
                            title="Xem trên bản đồ"
                            onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationData.address)}`, '_blank')}
                          />
                        )}
                      </div>
                      <div class="mb-2"><span class="text-gray-500">Địa chỉ:</span> {locationData?.address}</div>
                      <div class="mb-2"><span class="text-gray-500">Ngày đăng ký kinh doanh:</span> {moment(locationData?.dateCreated).format('DD/MM/YYYY HH:mm:ss')}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

  );

};
export default BusinessDetailBookingScreen;