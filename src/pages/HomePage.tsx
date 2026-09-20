import React, { useEffect, useState } from 'react';
import { Flex, Typography, Empty } from 'antd';
import { Link } from 'react-router-dom';

import { Meta, SearchBox, MainContentHeader } from '@components/common';
import { HomeSkeleton } from '@components/common/skeleton';
import { getWebsites, getSite, type WebsiteItem, type SiteConfig } from '@/services/userCenter';

const { Text } = Typography;

const siteDomain = (w: WebsiteItem): string => w.www || w.domain || (w.url ? w.url.replace(/^https?:\/\//, '').replace(/\/.*$/, '') : '') || '';

const HomePage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [sites, setSites] = useState<WebsiteItem[]>([]);
    const [site, setSite] = useState<SiteConfig | null>(null);

    useEffect(() => {
        Promise.all([getWebsites(), getSite()])
            .then(([w, s]) => {
                if (w.code === 1 && w.data) setSites(w.data);
                if (s.code === 1 && s.data) setSite(s.data);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <>
                <Meta />
                <HomeSkeleton />
            </>
        );
    }

    const heroDesc = site?.description || '兴汉同盟是博客人的专属朋友圈！我们深信每个博客背后都是一个独特的灵魂，让我们跨越山海彼此相连，一起用文字打败时间！';

    return (
        <>
            <Meta />
            <Flex vertical gap={16}>
                <div className="home-hero">
                    <div className="home-hero-title">{site?.title || '兴汉同盟'}</div>
                    <div className="home-hero-desc">{heroDesc}</div>
                </div>
                <SearchBox placeholder="搜索站点 ↵" gotoPage="/blogs" />
                <MainContentHeader content="收录的博客站点" />
                {sites.length === 0 ? (
                    <Empty description="暂无收录站点" />
                ) : (
                    <div className="website-grid">
                        {sites.map((w) => {
                            const domain = siteDomain(w);
                            return (
                                <Link to={`/blogs/${domain}`} key={w.id ?? domain} className="website-card">
                                    <div className="website-card-head">
                                        {w.ico || w.pic ? (
                                            <img className="website-card-ico" src={w.ico || w.pic} alt={w.title || w.name || ''} />
                                        ) : null}
                                        <span className="website-card-title">{w.title || w.name || '未命名站点'}</span>
                                    </div>
                                    {w.keywords ? <div className="website-card-keywords">{w.keywords}</div> : null}
                                    <div className="website-card-meta">
                                        <span>浏览 {w.view ?? 0}</span>
                                        <span>点赞 {w.zan ?? 0}</span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </Flex>
            <div className="home-declare">
                <Text type="secondary">
                    特别声明：包含政治、色情、赌博、暴力以及全 AI 生成内容的博客，一经发现，将被永久移出收录名单！
                </Text>
            </div>
        </>
    );
};

export default HomePage;
