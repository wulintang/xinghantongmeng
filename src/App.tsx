import React, { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';

import MainLayout from '@layouts/MainLayout';
import HomePage from '@pages/HomePage';
import WebsitesPage from '@pages/WebsitesPage';
import WebsiteDetailPage from '@pages/WebsiteDetailPage';
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
import UpdatePage from '@pages/UpdatePage';
import ColumnsPage from '@pages/ColumnsPage';
import ColumnDetailPage from '@pages/ColumnDetailPage';
import ColumnArticleDetailPage from '@pages/ColumnArticleDetailPage';
import MyColumnsPage from '@pages/user/MyColumnsPage';
import MyColumnDetailPage from '@pages/user/MyColumnDetailPage';
import MyToolsPage from '@pages/user/MyTools';
import ArticleEditPage from '@pages/user/ArticleEditPage';
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
                    // 原样保留：后台写的 <link>/<script>/<style>/<meta> 等标签及其全部属性（defer、data-*、crossorigin...）
                    const clone = document.importNode(node, true);
                    fragment.appendChild(clone);
                });
                // 用 <meta> 占位作去重标记，真正的节点直接追加到 document.head
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

/** 全局错误边界：捕获渲染期异常，避免整页白屏，提供返回首页出口 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; msg: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, msg: '' };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, msg: error?.message || String(error) };
  }
  componentDidCatch(error: any, info: any) {
    console.error('页面渲染出错：', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 'var(--space-10)', textAlign: 'center' }}>
          <h2 style={{ marginBottom: 'var(--space-3)' }}>页面出现了一点问题</h2>
          <p style={{ color: 'var(--c-text-3)', marginBottom: 'var(--space-5)' }}>{this.state.msg}</p>
          <button
            onClick={() => {
              window.location.href = '/';
            }}
            style={{
              padding: '6px 18px',
              borderRadius: 14,
              border: '1px solid var(--c-border)',
              background: 'var(--c-link)',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            返回首页
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const theme = {
    token: {
        borderRadius: 14,
    },
};

const App: React.FC = () => {
    return (
        <ConfigProvider locale={zhCN} theme={theme}>
            <SiteProvider>
                <BrowserRouter>
                    <ScrollToTop />
                    <CustomHead />
                    <ErrorBoundary>
                    <Routes>
                        <Route element={<MainLayout />}>
                            <Route path="/" element={<HomePage />} />

                            <Route path="/websites" element={<WebsitesPage />} />

                            <Route path="/article/detail/:id" element={<ColumnArticleDetailPage />} />
                            <Route path="/article" element={<ColumnsPage />} />
                            <Route path="/article/:id" element={<ColumnDetailPage />} />

                            <Route path="/tools" element={<ToolsPage />} />
                            <Route path="/tools/:id" element={<ToolDetailPage />} />

                            <Route path="/feed" element={<BlogsPage />} />

                            <Route path="/links" element={<LinksPage />} />
                            <Route path="/dan/update" element={<UpdatePage />} />

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
                            <Route path="columns" element={<MyColumnsPage />} />
                            <Route path="columns/:id" element={<MyColumnDetailPage />} />
                            <Route path="ad/buy" element={<AdBuyPage />} />
                            <Route path="ad/my" element={<AdMyPage />} />
                            <Route path="tools" element={<MyToolsPage />} />
                        </Route>

                            <Route path="/user/article/create" element={<ArticleEditPage />} />
                            <Route path="/user/article/edit/:id" element={<ArticleEditPage />} />

                            {/* 公开会员主页：/user/:id（与 /user/* 子路由并存，静态子路由优先，不冲突） */}
                            <Route path="/user/:id" element={<UserHomePage />} />

                            {/* 站点内页：/域名 直达收录站点的详情，置于路由表最末 */}
                            <Route path="/jump" element={<JumpPage />} />
                            <Route path="/:id" element={<WebsiteDetailPage />} />

                            <Route path="*" element={<NotFoundPage />} />
                        </Route>
                    </Routes>
                    </ErrorBoundary>
                </BrowserRouter>
            </SiteProvider>
        </ConfigProvider>
    );
};

export default App;
