import React from 'react';
import Sidebar from '../components/SideBar.js'; 
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/Header.js';

const titleMap = [
  { path: /^\/dashboard\/admin$/, main: 'Bảng Điều Khiển', sub: null },
  { path: /^\/business\/list$/, main: 'Danh Sách Doanh Nghiệp', sub: null },
  { path: /^\/business\/detail\/[^/]+$/, main: 'Danh Sách Doanh Nghiệp', sub: 'Chi Tiết Doanh Nghiệp' },
  { path: /^\/location\/list$/, main: 'Danh Sách Địa Điểm', sub: null },
  { path: /^\/location\/detail\/[^/]+$/, main: 'Danh Sách Địa Điểm', sub: 'Chi Tiết Địa Điểm' },
  { path: /^\/booking\/list$/, main: 'Danh Sách Đặt Chỗ', sub: null },
  { path: /^\/booking\/detail\/[^/]+$/, main: 'Danh Sách Đặt Chỗ', sub: 'Chi Tiết Đặt Chỗ' },
  { path: /^\/statistic$/, main: 'Thống Kê', sub: null },

  { path: /^\/dashboard\/business$/, main: 'Bảng Điều Khiển', sub: null },
  { path: /^\/business\/booking\/list$/, main: 'Danh Sách Đặt Chỗ', sub: null },
  { path: /^\/business\/booking\/detail\/[^/]+$/, main: 'Danh Sách Đặt Chỗ', sub: 'Chi Tiết Đặt Chỗ' },
  { path: /^\/business\/location\/list$/, main: 'Danh Sách Địa Điểm', sub: null },
  { path: /^\/business\/location\/detail\/[^/]+$/, main: 'Danh Sách Địa Điểm', sub: 'Chi Tiết Địa Điểm' },
  { path: /^\/business\/chat$/, main: 'Chăm sóc khách hàng', sub: null },
  { path: /^\/business\/chat\/conversation\/[^/]+$/, main: 'Chăm sóc khách hàng', sub: 'Cuộc hội thoại' },
  { path: /^\/business\/voucher$/, main: 'Voucher', sub: null },
  { path: /^\/business\/statistic$/, main: 'Thống Kê', sub: null },
];



const Layout = ({ children }) => {
const userRole = 'business';

const location =useLocation();
const { pathname } = location;
const { main, sub } = titleMap.find(({ path }) => path.test(pathname)) || { 
  main: 'Trang Không Tồn Tại', 
  sub: null 
};

  return (
    <div style={{ display: 'flex' }}>
      <div style = {{ marginLeft: 10, marginTop: 0,}}>
        <Sidebar role={userRole}/>
      </div>
      <div class="container">
      <div class="containerformobile" >
      <Header mainTitle={main} subTitle={sub}/>
      <Outlet/>
      </div>
      </div>
    </div>
  );
};

export default Layout;