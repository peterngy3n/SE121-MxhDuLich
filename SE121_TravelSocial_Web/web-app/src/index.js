import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import store from "./store/store";

import "../src/styles/index.css";
import App from "./App";
import { useState } from "react";
import { LoadScript } from "@react-google-maps/api";
import reportWebVitals from "./reportWebVitals";
import LoginScreen from "./pages/LoginScreen";
import DashBoardScreen from "./pages/DashBoardScreen";
import SideBar from "./components/SideBar";
import Layout from "./pages/Layout";
import ListBusinessScreen from "./pages/ListBusinessScreen";
import ListLocationScreen from "./pages/ListLocationScreen";
import ListBookingScreen from "./pages/ListBookingScreen";
import StatisticScreen from "./pages/StatisticScreen";
import DetailBusinessScreen from "./pages/DetailbusinessScreen";
import DetailLocationScreen from "./pages/DetailLocationScreen";
import DetailBookingScreen from "./pages/DetailBookingScreen";
import RegistryScreen from "./pagesofbusiness/RegistryScreen";
import RegistryScreen2 from "./pagesofbusiness/RegistryScreen2";
import DashBoardBusinessScreen from "./pagesofbusiness/DashBoardBusinessScreen";
import ListBookingBusinessScreen from "./pagesofbusiness/ListBookingBusinessScreen";
import StatisticBusinessScreen from "./pagesofbusiness/StatisticBusinessScreen";
import ListLocationBusinessScreen from "./pagesofbusiness/ListLocationBusinessScreen";
import DetailLocationBusinessScreen from "./pagesofbusiness/DetailLocationBusinessScreen";
import AddLocationScreen from "./pagesofbusiness/AddLocationScreen";
import MessagingScreen from "./pages/MessagingScreen";
import ChatBusinessScreen from "./pagesofbusiness/ChatBusinessScreen";
import BusinessDetailBookingScreen from "./pagesofbusiness/BusinessDetailBookingScreen";
import VoucherBusinessScreen from "./pagesofbusiness/VoucherBusinessScreen";

import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

const link = document.createElement("link");
link.href = "https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.css";
link.rel = "stylesheet";
document.head.appendChild(link);
const API_KEY = "AIzaSyB5r8wTQT5ymTQ94CN1wxnk37sfC6Ar5sQ";
const MAP_ID = "1ab6cd1498fac6f9";
const root = ReactDOM.createRoot(document.getElementById("root"));

const AppWrapper = () => {
  const [mapLoaded, setMapLoaded] = useState(false);

  return (
    <LoadScript
      googleMapsApiKey={API_KEY}
      libraries={["places", "marker"]} // Thêm libraries marker nếu cần
      mapIds={[MAP_ID]}
      onLoad={() => setMapLoaded(true)}
    >
      <Router>
        <Routes>
          {/* Xác thực và Đăng ký */}
          <Route path="/" element={<LoginScreen />} />
          <Route path="/auth/register" element={<RegistryScreen />} />
          <Route path="/auth/register/step2" element={<RegistryScreen2 />} />

          {/* Layout chính cho các trang có sidebar */}
          <Route element={<Layout />}>
            {/* Dashboard */}
            <Route path="/dashboard/admin" element={<DashBoardScreen />} />
            <Route
              path="/dashboard/business"
              element={<DashBoardBusinessScreen />}
            />
            {/* Doanh nghiệp */}
            <Route path="/business/list" element={<ListBusinessScreen />} />
            <Route
              path="/business/detail/:id"
              element={<DetailBusinessScreen />}
            />
            <Route
              path="/business/statistic"
              element={<StatisticBusinessScreen />}
            />
            <Route path="/business/chat" element={<ChatBusinessScreen />} />
            {/* Booking */}
            <Route path="/booking/list" element={<ListBookingScreen />} />
            <Route
              path="/business/booking/list"
              element={<ListBookingBusinessScreen />}
            />
            <Route
              path="/business/booking/detail/:id"
              element={<BusinessDetailBookingScreen />}
            />{" "}
            <Route
              path="/booking/detail/:id"
              element={<DetailBookingScreen />}
            />
            {/* Địa điểm */}
            <Route path="/location/list" element={<ListLocationScreen />} />
            <Route
              path="/business/location/list"
              element={<ListLocationBusinessScreen />}
            />
            <Route
              path="/location/detail/:id"
              element={<DetailLocationScreen />}
            />
            <Route
              path="/business/location/detail/:id"
              element={<DetailLocationBusinessScreen mapLoaded={mapLoaded} />}
            />
            <Route path="/location/add" element={<AddLocationScreen />} />
            Thống kê
            <Route path="/statistic" element={<StatisticScreen />} />
            <Route path="/business/voucher" element={<VoucherBusinessScreen />} />
            <Route path="/messaging" element={<MessagingScreen />} />
          </Route>
        </Routes>
      </Router>
    </LoadScript>
  );
};

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <AppWrapper />
    </Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();