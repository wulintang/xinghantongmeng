import React, { useState } from 'react';
import { Layout } from 'antd';
import { Outlet, useLocation } from 'react-router-dom';

import Header from '@components/common/Header';
import SiteFooter from '@components/common/SiteFooter';
import { PageHeroSlotContext } from '@/context/PageHeroContext';

const { Content } = Layout;

const MainLayout: React.FC = () => {
    const location = useLocation();
    const isArticleEdit = location.pathname.startsWith('/user/article/');
    // hero 插槽节点：DOM 上与 head(header)、container 三者平级。
    // 用 ref 回调拿到真实节点后，通过 Provider 传给各页 PageHeader 做 portal 挂载。
    const [heroSlot, setHeroSlot] = useState<HTMLElement | null>(null);

    return (
        <PageHeroSlotContext.Provider value={heroSlot}>
            <Layout className="site-layout">
                <Header />
                <div className="page-hero-slot" ref={setHeroSlot} />
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
        </PageHeroSlotContext.Provider>
    );
};

export default MainLayout;
