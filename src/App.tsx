import React, { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';

import MainLayout from '@layouts/MainLayout';
import HomePage from '@pages/HomePage';
import WebsitesPage from '@pages/WebsitesPage';
import WebsiteDetailPage from '@pages/WebsiteDetailPage';
import ArticlesPage from '@pages/ArticlesPage';
import ArticleDetailPage from '@pages/ArticleDetailPage';
import ToolsPage from '@pages/ToolsPage';
import ToolDetailPage from '@pages/ToolDetailPage';
import BlogsPage from '@pages/BlogsPage';
import DanPage from '@pages/DanPage';
import NotFoundPage from '@pages/NotFoundPage';
import LoginPage_ from '@pages/user/Login';
import RegisterPage from '@pages/user/Register';
import JumpPage from '@pages/JumpPage';
import UserLayout from '@pages/user/UserLayout';
import ProfilePage from '@pages/user/Profile';
import FavoritesPage from '@pages/user/Favorites';
import CheckinPage from '@pages/user/Checkin';
import MessagesPage from '@pages/user/Messages';
import BalancePage from '@pages/user/Balance';
import OrdersPage from '@pages/user/Orders';
import ReportsPage from '@pages/user/Reports';
import SubmitSitePage from '@pages/user/SubmitSite';
import { SiteProvider } from '@/context/SiteContext';

/** 路由切换后回到页面顶部，否则从长页面跳转会停在半空 */
function ScrollToTop(): null {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }, [pathname]);
    return null;
}

const theme = {
    token: {
        borderRadius: 8,
    },
};

const App: React.FC = () => {
    return (
        <ConfigProvider locale={zhCN} theme={theme}>
            <SiteProvider>
                <BrowserRouter>
                    <ScrollToTop />
                    <Routes>
                        <Route element={<MainLayout />}>
                            <Route path="/" element={<HomePage />} />

                            <Route path="/websites" element={<WebsitesPage />} />

                            <Route path="/articles" element={<ArticlesPage />} />
                            <Route path="/articles/:id" element={<ArticleDetailPage />} />

                            <Route path="/tools" element={<ToolsPage />} />
                            <Route path="/tools/:id" element={<ToolDetailPage />} />

                            <Route path="/feed" element={<BlogsPage />} />

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

                            {/* 站点内页：/域名 直达收录站点的详情，置于路由表最末 */}
                            <Route path="/jump" element={<JumpPage />} />
                            <Route path="/:id" element={<WebsiteDetailPage />} />

                            <Route path="*" element={<NotFoundPage />} />
                        </Route>
                    </Routes>
                </BrowserRouter>
            </SiteProvider>
        </ConfigProvider>
    );
};

export default App;
