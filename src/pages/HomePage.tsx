import React, { useEffect, useState } from 'react';
import {
    Alert,
    Avatar,
    Button,
    Card,
    Col,
    Flex,
    List,
    Row,
    Space,
    Tag,
    Typography,
} from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

import { SearchBox, AdSlotSkeleton } from '@components/common';
import { HomeSkeleton } from '@components/common/skeleton';
import { useSite } from '@/context/SiteContext';
import { usePageMeta } from '@/hooks/usePageMeta';
import { getArticles, getWebsites, type ArticleItem, type WebsiteItem } from '@/services/userCenter';
import { getPosts } from '@/services/postService';
import type { PostData } from '@/types/post';
import { domainOf, normalizeDomain, jumpUrl } from '@/utils/route';

const { Title, Text, Paragraph } = Typography;

const HOME_SITE_LIMIT = 12;
const HOME_SIDE_LIMIT = 6;

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const { site, cates, loading: siteLoading } = useSite();
    const [loading, setLoading] = useState(true);
    const [sites, setSites] = useState<WebsiteItem[]>([]);
    const [articles, setArticles] = useState<ArticleItem[]>([]);
    const [posts, setPosts] = useState<PostData[]>([]);
    const [siteIdByDomain, setSiteIdByDomain] = useState<Map<string, number>>(new Map());

    usePageMeta({});

    useEffect(() => {
        Promise.all([
            getWebsites({ page: 1, limit: 100 }),
            getArticles({ page: 1, limit: HOME_SIDE_LIMIT }),
            getPosts(),
        ])
            .then(([w, a, p]) => {
                if (w.code === 1 && w.data?.list) {
                    setSites(w.data.list.slice(0, HOME_SITE_LIMIT));
                    const map = new Map<string, number>();
                    w.data.list.forEach((s) => map.set(normalizeDomain(domainOf(s)), s.id));
                    setSiteIdByDomain(map);
                }
                if (a.code === 1 && a.data?.list) setArticles(a.data.list);
                setPosts(p.slice(0, HOME_SIDE_LIMIT));
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    if (loading || siteLoading) return <HomeSkeleton />;

    const heroTitle = site?.titles || site?.title || '兴汉同盟';
    const heroDesc =
        site?.description ||
        '我们深信每个博客背后都是一个独特的灵魂，让我们跨越山海彼此相连，一起用文字打败时间！';

    return (
        <Flex vertical gap={28}>
            <div className="home-hero">
                <Title level={2} className="home-hero-title">
                    {heroTitle}
                </Title>
                <Paragraph type="secondary" className="home-hero-desc">
                    {heroDesc}
                </Paragraph>
                <div className="home-hero-search">
                    <SearchBox placeholder="搜索收录的站点" gotoPage="/websites" />
                </div>
                {cates.length > 0 ? (
                    <Space size={[8, 8]} wrap className="home-hero-cates">
                        <Text type="secondary">网址分类：</Text>
                        {cates.map((c) => (
                            <Link key={c.id} to={`/websites?cate=${c.id}`}>
                                <Tag color="processing">{c.name}</Tag>
                            </Link>
                        ))}
                    </Space>
                ) : null}
            </div>

            <AdSlotSkeleton slot="home_top" />

            <section>
                <Flex className="section-head" justify="space-between" align="center">
                    <Title level={4} className="section-title">
                        最新收录站点
                    </Title>
                    <Button type="link" onClick={() => navigate('/websites')}>
                        查看全部
                    </Button>
                </Flex>
                {sites.length === 0 ? (
                    <Alert type="info" showIcon message="暂无收录站点" />
                ) : (
                    <Row gutter={[16, 16]}>
                        {sites.map((w) => (
                            <Col key={w.id} xs={24} sm={12} md={8} lg={6}>
                                <Card className="site-card" size="small">
                                    <Flex vertical gap={10}>
                                        <Flex align="center" gap={10}>
                                            <Avatar shape="square" size={40} src={w.ico || w.pic || undefined}>
                                                {(w.title || w.name || '?').slice(0, 1)}
                                            </Avatar>
                                            <Link to={`/${domainOf(w)}`} className="site-card-name">
                                                {w.title || w.name}
                                            </Link>
                                        </Flex>
                                        <Paragraph type="secondary" ellipsis={{ rows: 2 }} className="site-card-desc">
                                            {w.keywords || w.content || w.domain}
                                        </Paragraph>
                                        <Flex justify="space-between" align="center">
                                            <Text type="secondary" className="site-card-meta">
                                                浏览 {w.view} · 点赞 {w.zan}
                                            </Text>
                                            {w.url ? (
                                                <Link to={`/${domainOf(w)}`} className="site-card-visit">
                                                    <Button type="link" size="small">
                                                        访问
                                                    </Button>
                                                </Link>
                                            ) : null}
                                        </Flex>
                                    </Flex>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </section>

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={12}>
                    <Flex className="section-head" justify="space-between" align="center">
                        <Title level={4} className="section-title">
                            站内动态
                        </Title>
                        <Button type="link" onClick={() => navigate('/articles')}>
                            更多
                        </Button>
                    </Flex>
                    {articles.length === 0 ? (
                        <Alert type="info" showIcon message="暂无文章" />
                    ) : (
                        <List
                            size="small"
                            className="home-list"
                            dataSource={articles}
                            rowKey={(a) => a.id}
                            renderItem={(a) => (
                                <List.Item>
                                    <List.Item.Meta
                                        title={<Link to={`/articles/${a.id}`}>{a.title}</Link>}
                                        description={
                                            <Text type="secondary">
                                                {dayjs.unix(a.time).format('YYYY-MM-DD')} · 浏览 {a.view}
                                            </Text>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    )}
                </Col>

                <Col xs={24} lg={12}>
                    <Flex className="section-head" justify="space-between" align="center">
                        <Title level={4} className="section-title">
                            最新文章
                        </Title>
                        <Button type="link" onClick={() => navigate('/feed')}>
                            更多
                        </Button>
                    </Flex>
                    {posts.length === 0 ? (
                        <Alert type="info" showIcon message="暂无聚合文章" />
                    ) : (
                        <List
                            size="small"
                            className="home-list"
                            dataSource={posts}
                            rowKey={(p) => p.link || p.title}
                            renderItem={(p) => (
                                <List.Item>
                                    <List.Item.Meta
                                        title={
                                            <a href={jumpUrl(p.link)} target="_blank" rel="noreferrer" title={p.title}>
                                                {p.title}
                                            </a>
                                        }
                                        description={
                                            <Text type="secondary">
                                                <Link to={`/${domainOf(p)}`}>
                                                    {p.blogName || domainOf(p)}
                                                </Link>
                                                {' · '}
                                                {p.publishedAt ? dayjs(p.publishedAt).format('YYYY-MM-DD') : ''}
                                            </Text>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    )}
                </Col>
            </Row>

            <Alert
                type="warning"
                showIcon
                message="特别声明"
                description="包含政治、色情、赌博、暴力以及全 AI 生成内容的站点，一经发现将被永久移出收录名单。"
            />

            <section className="home-grid-section">
                <div className="home-grid-header">
                    <span className="home-grid-title">格子广告</span>
                    <span className="home-grid-meta">120 × 12 格，每格 10 px，框选申请</span>
                </div>
                <AdSlotSkeleton variant="grid" page="home" label="广告位（格子）" />
                <div className="home-grid-footer">
                    <Link to="/grid" className="home-grid-more">查看更多格子广告 &raquo;</Link>
                </div>
            </section>
        </Flex>
    );
};

export default HomePage;
