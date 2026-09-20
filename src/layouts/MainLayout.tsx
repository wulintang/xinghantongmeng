import React from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';

import Header from '@components/common/Header';
import SiteFooter from '@components/common/SiteFooter';

const { Content } = Layout;

const MainLayout: React.FC = () => {
    return (
        <Layout>
            <Header />
            <Content className="site-content">
                <div className="container">
                    <Outlet />
                </div>
            </Content>
            <SiteFooter />
        </Layout>
    );
};

export default MainLayout;
