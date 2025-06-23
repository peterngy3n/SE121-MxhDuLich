import React, { useState } from "react";
import { FaAngleRight, FaBell, FaEye } from "react-icons/fa";
import Chart from "react-apexcharts";
import "../styles/StatisticScreen.css";
import { useEffect } from "react";

const StatisticBusinessScreen = () => {
  const userId = localStorage.getItem("userId");
  const [bookings, setBookings] = useState([]);
  const [seriesData, setSeriesData] = useState([
    { name: "Doanh thu", data: [] },
  ]);
  const [years, setYears] = useState(new Date().getFullYear() - 1);
  const [statusStats, setStatusStats] = useState({
    pending: 0,
    confirm: 0,
    complete: 0,
    canceled: 0,
  });

  // Thêm các biến thống kê tổng quan
  const [totalBooking, setTotalBooking] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [avgRevenuePerBooking, setAvgRevenuePerBooking] = useState(0);
  const [avgRevenuePerMonth, setAvgRevenuePerMonth] = useState(0);
  const [uniqueCustomers, setUniqueCustomers] = useState(0);

  const chartOptions = {
    chart: {
      type: "line",
      height: 350,
    },
    xaxis: {
      categories: [
        "Tháng 1",
        "Tháng 2",
        "Tháng 3",
        "Tháng 4",
        "Tháng 5",
        "Tháng 6",
        "Tháng 7",
        "tháng 8",
        "tháng 9",
        "tháng 10",
        "tháng 11",
        "tháng 12",
      ],
    },
    title: {
      text: "Doanh thu theo tháng",
      align: "center",
    },
  };

  useEffect(() => {
    const fetchSuccessRate = async () => {
      try {
        // Sử dụng API mới trả về đầy đủ thông tin
        const response = await fetch(
          `http://localhost:3000/booking/getfullbybusinessid/${userId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch bookings data.");
        }

        const result = await response.json();
        const bookings = result.data || []; // Danh sách các booking
        console.log("chart:", bookings);

        // Lọc booking theo năm được chọn
        const filteredBookings = bookings.filter((booking) => {
          const bookingYear = new Date(booking.dateBooking).getFullYear();
          return bookingYear === parseInt(years);
        });

        // Tính toán số lượng trạng thái
        const totalBookings = filteredBookings.length;
        const completedBookings = filteredBookings.filter(
          (booking) => booking.status === "complete"
        ).length;
        const canceledBookings = totalBookings - completedBookings;

        // Cập nhật tỷ lệ thành công
        const successRate2 =
          totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;
        setSuccessRate(successRate2);

        setChartData({
          ...chartData,
          series: [successRate2, 100 - successRate2],
        });
      } catch (error) {
        console.error("Error fetching bookings data:", error);
      }
    };

    fetchSuccessRate();
  }, [userId, years]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/booking/getbybusinessid/${userId}`
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        console.log("list booking: ", data.data);

        const bookingsWithDetails = await Promise.all(
          data.data.map(async (booking) => {
            const userResponse = await fetch(
              `http://localhost:3000/user/getbyid/${booking.userId}`
            );
            const userData = await userResponse.json();
            const userName = userData.data.userName;

            const roomResponse = await fetch(
              `http://localhost:3000/room/getbyid/${booking.items?.[0].roomId}`
            );
            const roomData = await roomResponse.json();
            const locationId = roomData.data.locationId;
            console.log("location: ", locationId);

            const locationResponse = await fetch(
              `http://localhost:3000/locationbyid/${locationId}`
            );
            const locationData = await locationResponse.json();
            const locationName = locationData.data.name;
            return {
              ...booking,
              userName,
              locationId,
              locationName,
            };
          })
        );

        const locationMap = {};
        bookingsWithDetails.forEach((booking) => {
          if (booking.locationName) {
            const locationName = booking.locationName;
            locationMap[locationName] = (locationMap[locationName] || 0) + 1;
          }
        });

        const totalBookings = bookingsWithDetails.length;
        const labels = Object.keys(locationMap);
        const series = labels.map((label) =>
          ((locationMap[label] / totalBookings) * 100).toFixed(2)
        );

        setChartData2({
          ...chartData2,
          series: series.map(Number),
          options: {
            ...chartData2.options,
            labels: labels,
          },
        });

        setBookings(bookingsWithDetails);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      }
    };

    fetchBookings();
  }, [userId, years]);

  // const seriesData = [{
  //     name: 'Doanh thu',
  //     data: [30, 40, 35, 50, 49, 60, 70, 1, 60, 45, 35, 30]
  // }];

  const [successRate, setSuccessRate] = useState(0);
  const failureRate = 100 - successRate;

  const [chartData, setChartData] = useState({
    series: [successRate, failureRate],
    options: {
      chart: {
        type: "donut",
      },
      labels: ["Thành công", "Thất bại"],
      colors: ["#69c0ff", "rgba(244,91,105,0.6)"],
      plotOptions: {
        pie: {
          donut: {
            size: "70%",
            labels: {
              show: true,
              total: {
                show: true,
                label: "Thành công",
                formatter: () => `${successRate}%`,
              },
            },
          },
        },
      },
      dataLabels: {
        enabled: false,
      },
      legend: {
        position: "bottom",
        horizontalAlign: "center",
        markers: {
          width: 12,
          height: 12,
        },
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 300,
            },
            legend: {
              position: "bottom",
            },
          },
        },
      ],
    },
  });

  const [chartData2, setChartData2] = useState({
    series: [40, 30, 20],
    options: {
      chart: {
        type: "donut",
      },
      labels: ["Khách sạn Hương Việt", "Nhà hàng", "Tour du lịch"],
      colors: ["#69c0ff", "#00E396", "#FEB019", "rgba(244,91,105,0.6)"],
      plotOptions: {
        pie: {
          donut: {
            size: "70%",
            labels: {
              show: true,
              total: {
                show: true,
                label: "Tổng số",
                formatter: () => "100%",
              },
            },
          },
        },
      },
      dataLabels: {
        enabled: true,
        formatter: function (val) {
          return `${val}%`;
        },
      },
      legend: {
        position: "bottom",
        horizontalAlign: "center",
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 300,
            },
            legend: {
              position: "bottom",
            },
          },
        },
      ],
    },
  });

  useEffect(() => {
    const fetchYearlyRevenue = async () => {
      try {
        // Lấy năm hiện tại
        const monthlyData = [];

        // Gọi API cho từng tháng (1 -> 12)
        for (let month = 1; month <= 12; month++) {
          const response = await fetch(
            `http://localhost:3000/bookings/revenue/${userId}?month=${month}&year=${years}`
          );
          if (!response.ok) {
            throw new Error(`Failed to fetch revenue for month ${month}`);
          }
          const result = await response.json();
          monthlyData.push(result.data.totalRevenue || 0); // Nếu không có dữ liệu, dùng 0
        }
        console.log(monthlyData);

        setSeriesData([{ name: "Doanh thu", data: monthlyData }]); // Cập nhật dữ liệu biểu đồ
      } catch (error) {
        console.error("Error fetching yearly revenue:", error);
      }
    };

    // const fetchBookingSuccessRate = async () => {
    //   try {
    //     const response = await fetch(`http://localhost:3000/bookings/success-rate/${userId}?year=${years}`);
    //     if (!response.ok) {
    //       throw new Error('Failed to fetch booking success rate');
    //     }
    //     const result = await response.json();
    //     const completed = result.data.completed || 0;
    //     const canceled = result.data.canceled || 0;
    //     const totalBookings = completed + canceled;
    //     const successRate = totalBookings > 0 ? (completed / totalBookings) * 100 : 0;
    //     const failureRate = 100 - successRate;

    //     setChartData({
    //       series: [successRate, failureRate],
    //       options: {
    //         chart: { type: 'donut' },
    //         labels: ['Thành công', 'Thất bại'],
    //         colors: ['#69c0ff', 'rgba(244,91,105,0.6)'],
    //         plotOptions: {
    //           pie: {
    //             donut: {
    //               size: '70%',
    //               labels: {
    //                 show: true,
    //                 total: {
    //                   show: true,
    //                   label: 'Thành công',
    //                   formatter: () => `${successRate.toFixed(2)}%`,
    //                 },
    //               },
    //             },
    //           },
    //         },
    //         dataLabels: { enabled: false },
    //         legend: { position: 'bottom', horizontalAlign: 'center' },
    //       }
    //     });
    //   } catch (error) {
    //     console.error('Error fetching booking success rate:', error);
    //   }
    // };

    // const fetchServiceBookingRates = async () => {
    //   try {
    //     const response = await fetch(`http://localhost:3000/bookings/service-rates/${userId}?year=${years}`);
    //     if (!response.ok) {
    //       throw new Error('Failed to fetch service booking rates');
    //     }
    //     const result = await response.json();
    //     const serviceData = result.data || [];
    //     const totalBookings = serviceData.reduce((sum, service) => sum + service.bookings, 0);

    //     const formattedData = serviceData.map(service => ({
    //       name: service.name,
    //       bookingsPercentage: totalBookings > 0 ? (service.bookings / totalBookings) * 100 : 0,
    //     }));

    //     setChartData2({
    //       series: formattedData.map(service => service.bookingsPercentage),
    //       options: {
    //         chart: { type: 'donut' },
    //         labels: formattedData.map(service => service.name),
    //         colors: ['#69c0ff', '#00E396', '#FEB019', 'rgba(244,91,105,0.6)'],
    //         plotOptions: {
    //           pie: {
    //             donut: {
    //               size: '70%',
    //               labels: {
    //                 show: true,
    //                 total: {
    //                   show: true,
    //                   label: 'Tổng số',
    //                   formatter: () => '100%',
    //                 },
    //               },
    //             },
    //           },
    //         },
    //         dataLabels: { enabled: true, formatter: val => `${val.toFixed(2)}%` },
    //         legend: { position: 'bottom', horizontalAlign: 'center' },
    //       }
    //     });
    //   } catch (error) {
    //     console.error('Error fetching service booking rates:', error);
    //   }
    // };

    fetchYearlyRevenue();
    // fetchBookingSuccessRate();
    // fetchServiceBookingRates();
  }, [userId, years]);

  // Tính toán các thống kê tổng quan khi bookings thay đổi
  useEffect(() => {
    if (!bookings || bookings.length === 0) {
      setTotalBooking(0);
      setTotalRevenue(0);
      setAvgRevenuePerBooking(0);
      setAvgRevenuePerMonth(0);
      setUniqueCustomers(0);
      return;
    }
    setTotalBooking(bookings.length);
    const revenue = bookings.reduce((sum, b) => sum + (b.totalPriceAfterTax || 0), 0);
    setTotalRevenue(revenue);
    setAvgRevenuePerBooking(bookings.length > 0 ? Math.round(revenue / bookings.length) : 0);
    setAvgRevenuePerMonth(Math.round(revenue / 12));
    const customerSet = new Set(bookings.map(b => b.userId));
    setUniqueCustomers(customerSet.size);
  }, [bookings]);

  const handleYearChange = (event) => {
    setYears(event.target.value); // Cập nhật năm
  };

  return (
    <div >
      <div>
        <div style={{ marginBottom: "20px" }}>
          <label htmlFor="yearSelect">Chọn năm: </label>
          <select id="yearSelect" value={years} onChange={handleYearChange}>
            {/* Thêm các năm vào đây, ví dụ từ 2020 đến năm hiện tại */}
            {[2020, 2021, 2022, 2023, 2024, 2025].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <div>
          {/* Thống kê tổng quan */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-700">{totalBooking}</div>
              <div className="text-gray-600 mt-1">Tổng số booking</div>
            </div>
            <div className="bg-green-50 border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-700">{totalRevenue.toLocaleString('vi-VN')} đ</div>
              <div className="text-gray-600 mt-1">Tổng doanh thu</div>
            </div>
            <div className="bg-yellow-50 border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-700">{avgRevenuePerBooking.toLocaleString('vi-VN')} đ</div>
              <div className="text-gray-600 mt-1">Doanh thu TB/Booking</div>
            </div>
            <div className="bg-purple-50 border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-700">{avgRevenuePerMonth.toLocaleString('vi-VN')} đ</div>
              <div className="text-gray-600 mt-1">Doanh thu TB/Tháng</div>
            </div>
            <div className="bg-pink-50 border rounded-lg p-4 text-center col-span-2 md:col-span-1">
              <div className="text-2xl font-bold text-pink-700">{uniqueCustomers}</div>
              <div className="text-gray-600 mt-1">Khách hàng duy nhất</div>
            </div>
          </div>
          <Chart
            options={chartOptions}
            series={seriesData}
            type="line"
            height={350}
          />
          <div className="chartcontainer">
            <div className="staticchart">
              <h3 style={{ textAlign: "center" }}>
                Tỉ lệ Thành công của Booking
              </h3>

              <Chart
                className="piechart"
                options={chartData.options}
                series={chartData.series}
                type="donut"
                width="380"
              />
            </div>

            <div className="staticchart">
              <h3 style={{ textAlign: "center" }}>Tỉ lệ Đặt các Dịch vụ</h3>
              <Chart
                className="piechart"
                options={chartData2.options}
                series={chartData2.series}
                type="donut"
                width="380"
              />
            </div>
          </div>
          <div className="mt-8">
          <h2 className="text-xl font-bold mb-2">
            Thống kê trạng thái booking ({years})
          </h2>
          <table className="min-w-[350px] bg-white rounded shadow border mb-6">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 border">Trạng thái</th>
                <th className="px-4 py-2 border">Số lượng</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-2 border">Chờ duyệt</td>
                <td className="px-4 py-2 border text-center">
                  {statusStats.pending}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 border">Đã xác nhận</td>
                <td className="px-4 py-2 border text-center">
                  {statusStats.confirm}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 border">Hoàn thành</td>
                <td className="px-4 py-2 border text-center">
                  {statusStats.complete}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 border">Đã hủy</td>
                <td className="px-4 py-2 border text-center">
                  {statusStats.canceled}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        </div>
        
      </div>
    </div>
  );
};

export default StatisticBusinessScreen;