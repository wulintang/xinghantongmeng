import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';

import MainLayout from '@layouts/MainLayout';
import HomePage from '@pages/HomePage';
import BlogsPage from '@pages/BlogsPage';
import BlogPage from '@pages/BlogPage';
import DanPage from '@pages/DanPage';
import NotFoundPage from '@pages/NotFoundPage';
import LoginPage_ from '@pages/user/Login';
import RegisterPage from '@pages/user/Register';
import UserLayout from '@pages/user/UserLayout';
import ProfilePage from '@pages/user/Profile';
import FavoritesPage from '@pages/user/Favorites';
import CheckinPage from '@pages/user/Checkin';
import MessagesPage from '@pages/user/Messages';
import BalancePage from '@pages/user/Balance';
import OrdersPage from '@pages/user/Orders';
import ReportsPage from '@pages/user/Reports';
import SubmitSitePage from '@pages/user/SubmitSite';

const App: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<MainLayout />}>
                    <Route path="/" element={<Navigate to='/home' replace />} />
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/blogs" element={<BlogsPage />} />
                    <Route path="/blogs/:domain" element={<BlogPage />} />
                    <Route path="/dan/:alias" element={<DanPage />} />
                    <Route path="/login" element={<LoginPage_ />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/user" element={<UserLayout />}>
                        <Route index element={<ProfilePage />} />
                        <Route path="favorites" element={<FavoritesPage />} />
                        <Route path="checkin" element={<CheckinPage />} />
                        <Route path="messages" element={<MessagesPage />} />
                        <Route path="balance" element={<BalancePage />} />
                        <Route path="orders" element={<OrdersPage />} />
                        <Route path="reports" element={<ReportsPage />} />
                        <Route path="submit" element={<SubmitSitePage />} />
                    </Route>
                    <Route path="/404-not-found" element={<NotFoundPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
};

export default App;
