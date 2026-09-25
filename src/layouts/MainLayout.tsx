import React from 'react';
import { Layout } from 'antd';
import { Outlet, useLocation } from 'react-router-dom';

import Header from '@components/common/Header';
import SiteFooter from '@components/common/SiteFooter';

const { Content } = Layout;

const MainLayout: React.FC = () => {
    const location = useLocation();
    const isArticleEdit = location.pathname.startsWith('/user/article/');

    return (
        <Layout className="site-layout">
            <Header />
            <Content className="site-content">
                {isArticleEdit ? (
                    <Outlet key={location.pathname} />
                ) : (
                    <div className="container">
                        <Outlet key={location.pathname} />
                    </div>
                )}
            </Content>
            <SiteFooter />
        </Layout>
    );
};

export default MainLayout;
