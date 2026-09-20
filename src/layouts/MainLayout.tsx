import React from 'react';
import { Layout } from 'antd';
import { Outlet, useLocation } from 'react-router-dom';

import Header from '@components/common/Header';
import SiteFooter from '@components/common/SiteFooter';

const { Content } = Layout;

const MainLayout: React.FC = () => {
    const location = useLocation();

    return (
        <Layout className="site-layout">
            <Header />
            <Content className="site-content">
                <div className="container">
                    {/* 以路径为 key 强制重挂，保证切换页面一定重新取数、不留上一页状态 */}
                    <Outlet key={location.pathname} />
                </div>
            </Content>
            <SiteFooter />
        </Layout>
    );
};

export default MainLayout;
