import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
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
        colorPrimary: '#8a2b1d',
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
                            <Route path="/" element={<Navigate to="/home" replace />} />
                            <Route path="/home" element={<HomePage />} />

                            {/* 后台导航下发的是后端伪静态地址，这里做等价跳转，保证直接打开也能用 */}
                            <Route path="/category.html" element={<Navigate to="/websites" replace />} />
                            <Route path="/article.html" element={<Navigate to="/articles" replace />} />
                            <Route path="/tool.html" element={<Navigate to="/tools" replace />} />
                            <Route path="/blog.html" element={<Navigate to="/blogs" replace />} />

                            <Route path="/websites" element={<WebsitesPage />} />
                            <Route path="/websites/:id" element={<WebsiteDetailPage />} />
                            <Route path="/category" element={<WebsitesPage />} />

                            <Route path="/articles" element={<ArticlesPage />} />
                            <Route path="/articles/:id" element={<ArticleDetailPage />} />

                            <Route path="/tools" element={<ToolsPage />} />
                            <Route path="/tools/:id" element={<ToolDetailPage />} />

                            <Route path="/blogs" element={<BlogsPage />} />
                            <Route path="/blogs/:domain" element={<BlogPage />} />

                            <Route path="/dan/:alias" element={<DanPage />} />

                            {/* 后端其它形态地址的兼容入口 */}
                            <Route path="/website/:id" element={<WebsiteDetailPage />} />
                            <Route path="/article/:id" element={<ArticleDetailPage />} />
                            <Route path="/tool/:id" element={<ToolDetailPage />} />

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

                            <Route path="*" element={<NotFoundPage />} />
                        </Route>
                    </Routes>
                </BrowserRouter>
            </SiteProvider>
        </ConfigProvider>
    );
};

export default App;
