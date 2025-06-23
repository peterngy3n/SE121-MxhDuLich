import React from "react";
import "../styles/DetailBookingScreen.css";
import { FaEnvelope, FaMoneyBill } from "react-icons/fa";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {

  faUser,
  faMapMarkerAlt,
} from "@fortawesome/free-solid-svg-icons";
import { useParams } from "react-router-dom";

import { formatDate, formatDateTime } from "../utils/dateUtils";
import { formatCurrency } from "../utils/formatCurrency";
import moment from "moment";

const DetailBookingScreen = () => {
  const [currentTab, setCurrentTab] = useState("customerinfo");
  const [setError] = useState(null);
  const [booking, setBooking] = useState([]);
  const [locationData, setLocationData] = useState(null);
  const [userData, setUserData] = useState([]);
  const [userOfBookingId, setUserOfBookingId] = useState(null);
  const [setLoading] = useState(true);

  const { id: bookingId } = useParams();

  // useEffect(() => {
  //   const fetchLocations = async () => {
  //     setIsLoading(true);
  //     try {
  //       const response = await fetch(
  //         `http://localhost:3000/booking/getbyid/${id}`
  //       );
  //       const result = await response.json();
  //       if (result.isSuccess) {
  //         setBooking(result.data);

  //         const roomResponse = await fetch(
  //           `http://localhost:3000/room/getbyid/${result.data?.item?.[0].roomId}`
  //         );

  //         const roomResult = await roomResponse.json();

  //         if (roomResult.isSuccess) {
  //           setRoom(roomResult.data);
  //         }

  //         const locationResponse = await fetch(
  //           `http://localhost:3000/locationbyid/${roomResult.data.locationId}`
  //         );

  //         const locationResult = await locationResponse.json();

  //         if (locationResult.isSuccess) {
  //           setLocation(locationResult.data);
  //         }

  //         if (result.data.userId) {
  //           const customerResponse = await fetch(
  //             `http://localhost:3000/user/getbyid/${result.data.userId}`
  //           );
  //           const customerResult = await customerResponse.json();
  //           if (customerResult.isSuccess) {
  //             setCustomer(customerResult.data);
  //           }
  //         }

  //         if (locationResult.data.ownerId) {
  //           const ownerResponse = await fetch(
  //             `http://localhost:3000/user/getbyid/${locationResult.data.ownerId}`
  //           );
  //           const ownerResult = await ownerResponse.json();
  //           if (ownerResult.isSuccess) {
  //             setOwner(ownerResult.data);
  //           }
  //         }
  //       }
  //     } catch (err) {
  //       setError("An error occurred while fetching location.");
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };
  //   fetchLocations();
  // }, [id]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3000/user/getbyid/${userOfBookingId}`
      );
      const data = await response.json();

      if (response.ok) {
        setUserData(data.data);
        console.log("data of detail booking: ", data.data);
      } else {
        setError(data.message || "Không thể lấy thông tin người dùng");
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi gọi API");
    } finally {
      setLoading(false);
    }
  };

  const fetchLocationData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3000/locationbyid/${booking.locationId}`
      );
      const data = await response.json();

      if (response.ok) {
        const locationResponse = await fetch(
          `http://localhost:3000/user/getbyid/${data.data.ownerId}`
        );
        const locationData = await locationResponse.json();
        // setLocationData(data.data);
        console.log("data of detail booking: ", data.data);
        if (locationResponse.ok) {
          setLocationData({
            ...data.data,
            ownerName: locationData?.data?.userName || "Unknown Location",
          });
          console.log("Location detail:", {
            ...data.data,
            ownerName: locationData?.data?.userName || "Unknown Location",
          });
        } else {
          setError(locationData.message || "Không thể lấy thông tin location");
        }
      } else {
        setError(data.message || "Không thể lấy thông tin người dùng");
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi gọi API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userOfBooking = localStorage.getItem("userOfBookingId");
    if (userOfBooking) {
      console.log("get booking from localstorage: ", userOfBooking);
      setUserOfBookingId(userOfBooking);
    }
    const storedBooking = localStorage.getItem("selectedBooking");
    if (storedBooking) {
      console.log("get booking from localstorage: ", JSON.parse(storedBooking));
      setBooking(JSON.parse(storedBooking));
    }
  }, [bookingId, booking?.status]);

  useEffect(
    () => {
      if (userOfBookingId) {
        fetchUserData();
      }
      if (booking) {
        fetchLocationData();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userOfBookingId],
    [booking, booking?.status]
  );

  const handleCustomerInfoClick = () => {
    setCurrentTab("customerinfo");
  };

  const handleLocationInfoClick = () => {
    setCurrentTab("locationinfo");
  };

  const handleBookingInfoClick = () => {
    setCurrentTab("bookinginfo");
  };

  return (
    <div class="container">
      <div class="containerformobile">
        <div class="containerlistbusiness widthlistbusiness">
          <div class="max-w-4xl mx-auto mt-10 bg-white rounded-lg shadow-md p-6">
            <div class="flex items-center">
              <img
                alt="Profile picture of a person"
                class="w-20 h-20 rounded-full mr-4"
                height="80"
                src="https://storage.googleapis.com/a1aa/image/0FPVWfLJ1m0nJS9YfULFrbvezZsDHus5bXhqxVDA6tO9UMKnA.jpg"
                width="80"
              />
              <div>
                <h1 class="text-xl font-bold">{locationData?.ownerName}</h1>
                {/* <div class="flex items-center text-gray-600 mt-2">
                  <FaCalendar class="mr-2" />

                  <span>04/08/2024</span>
                </div> */}
                <div class="flex items-center mt-2">
                  <FaMoneyBill class="mr-2 w-5" />

                  {/* <span class="line-through text-gray-400">68,000,000 đ</span> */}
                  <span class="text-green-500 ml-2">
                    {formatCurrency(Number(booking.totalPrice))}
                  </span>
                  {/* <span class="text-green-500 ml-2 status-label-2">- 50%</span> */}
                </div>
                <div class="flex items-center text-gray-500 mt-1 ">
                  <FaEnvelope class="mr-2" />

                  <div class="text-gray-500">
                    Đặt lúc {formatDateTime(booking.dateBooking)}
                  </div>
                </div>
              </div>
            </div>
            <div class="mt-6">
              <div class="flex">
                <button
                  onClick={handleBookingInfoClick}
                  className={`flex items-center px-4 py-2 ${
                    currentTab === "bookinginfo"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-600"
                  } rounded-t-lg`}
                >
                  <i class="fas fa-user mr-2"></i>
                  <span>
                    <FontAwesomeIcon icon={faUser} className="mr-2" />
                    Thông tin booking
                  </span>
                </button>
                <button
                  onClick={handleCustomerInfoClick}
                  className={`flex items-center px-4 py-2 ${
                    currentTab === "customerinfo"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-600"
                  } rounded-t-lg ml-2`}
                >
                  <i class="fas fa-user mr-2"></i>
                  <span>
                    <FontAwesomeIcon icon={faUser} className="mr-2" />
                    Thông tin khách hàng
                  </span>
                </button>
                <button
                  onClick={handleLocationInfoClick}
                  class={`flex items-center px-4 py-2 ${
                    currentTab === "locationinfo"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-600"
                  } rounded-t-lg ml-2`}
                >
                  <i class="fas fa-map-marker-alt mr-2"></i>
                  <span>
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2" />
                    Thông tin địa điểm
                  </span>
                </button>
              </div>
              {currentTab === "bookinginfo" && (
                <div class="border border-gray-200 rounded-b-lg p-4">
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <div class="mb-2 text-gray-500">Mã Booking</div>
                      <div class="mb-4">{booking?._id}</div>
                      <div class="mb-2 text-gray-500">Ngày checkin</div>
                      <div class="mb-4">
                        {moment(booking?.checkinDate).format(
                          "DD/MM/YYYY HH:mm:ss"
                        )}
                      </div>
                      <div class="mb-2 text-gray-500">Tổng tiền gốc</div>
                      <div class="mb-4">{formatCurrency(Number(booking?.totalPrice))}</div>
                      <div class="mb-2 text-gray-500">Khuyến mãi (Sự kiện địa điểm)</div>
                      <div class="mb-4 text-green-600">-
                        {formatCurrency(Number(booking?.promotionDiscount || 0))}
                      </div>
                      <div class="mb-2 text-gray-500">Voucher giảm giá</div>
                      <div class="mb-4 text-green-600">-
                        {formatCurrency(Number(booking?.voucherDiscount || 0))}
                      </div>
                      <div class="mb-2 text-gray-500 font-bold">Tổng tiền sau giảm giá</div>
                      <div class="mb-4 font-bold text-blue-600">
                        {formatCurrency(Number(booking?.totalPriceAfterDiscount || (booking?.totalPrice - (booking?.promotionDiscount || 0) - (booking?.voucherDiscount || 0))))}
                      </div>
                      <div class="mb-2 text-gray-500">Tổng tiền sau thuế</div>
                      <div class="mb-4">{formatCurrency(Number(booking?.totalPriceAfterTax))}</div>
                    </div>
                    <div>
                      <div class="mb-2 text-gray-500">Ngày đặt</div>
                      <div class="mb-4">
                        {moment(booking?.dateBooking).format(
                          "DD/MM/YYYY HH:mm:ss"
                        )}
                      </div>
                      <div class="mb-2 text-gray-500">Ngày checkout</div>
                      <div class="mb-4">
                        {moment(booking?.checkoutDate).format(
                          "DD/MM/YYYY HH:mm:ss"
                        )}
                      </div>
                      <div class="mb-2 text-gray-500">Số tiền đã trả</div>
                      <div class="mb-4">{formatCurrency(Number(booking?.amountPaid))}</div>
                    </div>
                    <div class="mb-4">
                      <h2 class="font-bold mb-2">Phòng:</h2>

                      <div className="flex flex-wrap gap-2">
                        {booking?.items.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center bg-gray-200 rounded-full px-3 py-1"
                          >
                            {/* {getFacilityIcon(item.roomId)} */}
                            <span class="mr-2">Số lượng: </span>
                            <span class="font-bold">{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center justify-between">
                    <div className="flex items-center justify-center mt-2">
                      <h2 class="text-black font-bold mr-2">Trạng thái</h2>
                      <span
                        className={`status-label${
                          booking.status === "canceled"
                            ? ""
                            : booking.status === "complete"
                            ? "-2"
                            : "-1"
                        }`}
                      >
                        {booking.status === "pending" && "Chờ duyệt"}
                        {booking.status === "confirm" && "Đã xác nhận"}
                        {booking.status === "canceled" && "Đã hủy"}
                        {booking.status === "complete" && "Hoàn thành"}
                        {booking.status !== "pending" &&
                          booking.status !== "confirm" &&
                          booking.status !== "canceled" &&
                          booking.status !== "complete" &&
                          booking.status}
                      </span>
                      {/* <input 
                                                                  name="pricePerNight"
                                                          
                                                                   type="number" className="w-48 p-3 border border-gray-300 rounded-lg"></input> */}
                    </div>

                    <div class="flex"></div>
                  </div>
                </div>
              )}
              {currentTab === "customerinfo" && (
                <div class="border border-gray-200 rounded-b-lg p-4">
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <div class="mb-2 text-gray-500">Mã khách hàng</div>
                      <div class="mb-4">{userData._id}</div>
                      <div class="mb-2 text-gray-500">Số điện thoại</div>
                      <div class="mb-4">{userData.userPhoneNumber}</div>
                      <div class="mb-2 text-gray-500">Ngày sinh</div>
                      <div class="mb-4">
                        {formatDate(userData.userDateOfBirth)}
                      </div>
                      {/* <div class="mb-2 text-gray-500">Tên liên hệ</div>
                      <div class="mb-4">Lê Bảo Như</div> */}
                      {/* <div class="mb-2 text-gray-500">Giới tính</div>
                      <div class="mb-4">Nữ</div> */}
                    </div>
                    <div>
                      <div class="mb-2 text-gray-500">Họ và tên</div>
                      <div class="mb-4">{userData.userName}</div>
                      <div class="mb-2 text-gray-500">Địa chỉ email</div>
                      <div class="mb-4">{userData.userEmail}</div>
                      {/* <div class="mb-2 text-gray-500">Số CMND/CCCD</div>
                      <div class="mb-4">079303041653</div> */}
                      {/* <div class="mb-2 text-gray-500">
                        Số điện thoại liên hệ
                      </div>
                      <div class="mb-4">0386441295</div> */}
                      <div class="mb-2 text-gray-500">Địa chỉ</div>
                      <div class="mb-4">{userData.userAddress}</div>
                    </div>
                  </div>
                </div>
              )}
              {currentTab === "locationinfo" && (
                <div class="border border-gray-200 rounded-b-lg p-4">
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <div class="mb-2 text-gray-500">Mã địa điểm</div>
                      <div class="mb-4">{locationData?._id}</div>
                      <div class="mb-2 text-gray-500">Tên chủ sở hữu</div>
                      <div class="mb-4">{locationData?.ownerName}</div>
                      <div class="mb-2 text-gray-500">Loại</div>
                      <div className="mb-4">
                        {locationData?.category?.id === "hotel"
                          ? "Khách sạn"
                          : locationData?.category?.id === "homestay"
                          ? "Homestay"
                          : locationData?.category?.id === "guest_home"
                          ? "Nhà nghỉ"
                          : "Danh mục không xác định"}
                      </div>
                    </div>

                    <div>
                      <div class="mb-2 text-gray-500">Tên địa điểm</div>
                      <div class="mb-4">{locationData?.name}</div>
                      <div class="mb-2 text-gray-500">Địa chỉ</div>
                      <div class="mb-4">{locationData?.address}</div>
                      <div class="mb-2 text-gray-500">
                        Ngày đăng ký kinh doanh
                      </div>
                      <div class="mb-4">
                        {moment(locationData?.dateCreated).format(
                          "DD/MM/YYYY HH:mm:ss"
                        )}
                      </div>
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

export default DetailBookingScreen;