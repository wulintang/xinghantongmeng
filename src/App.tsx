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
import AbstractPage from '@pages/AbstractPage';
import UserLayout from '@pages/user/UserLayout';
import ProfilePage from '@pages/user/Profile';
import UserHomePage from '@pages/user/UserHomePage';
import FavoritesPage from '@pages/user/Favorites';
import CheckinPage from '@pages/user/Checkin';
import MessagesPage from '@pages/user/Messages';
import BalancePage from '@pages/user/Balance';
import OrdersPage from '@pages/user/Orders';
import ReportsPage from '@pages/user/Reports';
import SubmitSitePage from '@pages/user/SubmitSite';
import MySitesPage from '@pages/user/MySites';
import AdBuyPage from '@pages/user/AdBuyPage';
import AdMyPage from '@pages/user/AdMyPage';
import GridPage from '@pages/GridPage';
import AdPricesPage from '@pages/AdPricesPage';
import LinksPage from '@pages/LinksPage';
import { SiteProvider } from '@/context/SiteContext';
import { getCustomConfig } from '@/services/userCenter';

/** 路由切换后回到页面顶部，否则从长页面跳转会停在半空 */
function ScrollToTop(): null {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }, [pathname]);
    return null;
}

/** 自定义 Head 代码注入：读取后台自定义配置，把 head_code 注入到全站 <head>（管理员专属） */
function CustomHead(): null {
    useEffect(() => {
        let alive = true;
        getCustomConfig()
            .then((r: any) => {
                if (!alive || !r || r.code !== 1 || !r.data?.head_code) return;
                if (document.getElementById('custom-head-code')) return;
                const doc = new DOMParser().parseFromString(
                    `<!DOCTYPE html><html><head>${r.data.head_code}</head><body></body></html>`,
                    'text/html'
                );
                const fragment = document.createDocumentFragment();
                doc.head.childNodes.forEach((node: ChildNode) => {
                    const clone = document.importNode(node, true);
                    if (clone.nodeType === 1 && (clone as HTMLElement).tagName === 'SCRIPT') {
                        const s = document.createElement('script');
                        const src = (clone as HTMLScriptElement).getAttribute('src');
                        if (src) s.src = src;
                        else s.textContent = (clone as HTMLScriptElement).textContent;
                        s.async = false;
                        fragment.appendChild(s);
                    } else {
                        fragment.appendChild(clone);
                    }
                });
                // 用 <meta> 占位作去重标记，真正的 <link>/<script>/<style> 直接追加到 document.head
                const marker = document.createElement('meta');
                marker.id = 'custom-head-code';
                document.head.appendChild(marker);
                document.head.appendChild(fragment);
            })
            .catch(() => {});
        return () => {
            alive = false;
        };
    }, []);
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
                    <CustomHead />
                    <Routes>
                        <Route element={<MainLayout />}>
                            <Route path="/" element={<HomePage />} />

                            <Route path="/websites" element={<WebsitesPage />} />

                            <Route path="/articles" element={<ArticlesPage />} />
                            <Route path="/articles/:id" element={<ArticleDetailPage />} />

                            <Route path="/tools" element={<ToolsPage />} />
                            <Route path="/tools/:id" element={<ToolDetailPage />} />

                            <Route path="/feed" element={<BlogsPage />} />

                            <Route path="/links" element={<LinksPage />} />

                            <Route path="/grid" element={<GridPage />} />
                            <Route path="/dan/ad" element={<AdPricesPage />} />

                            <Route path="/abstract" element={<AbstractPage />} />

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
                            <Route path="mysites" element={<MySitesPage />} />
                            <Route path="ad/buy" element={<AdBuyPage />} />
                            <Route path="ad/my" element={<AdMyPage />} />
                        </Route>

                            {/* 公开会员主页：/user/:id（与 /user/* 子路由并存，静态子路由优先，不冲突） */}
                            <Route path="/user/:id" element={<UserHomePage />} />

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
