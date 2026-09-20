import React, { useEffect, useState } from 'react';
import {
    Alert,
    Avatar,
    Button,
    Card,
    Col,
    Descriptions,
    Flex,
    List,
    Row,
    Space,
    Tag,
    Typography,
} from 'antd';
import { Link, useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';

import { PageHeader } from '@components/common';
import { WebsiteDetailSkeleton } from '@components/common/skeleton';
import { usePageMeta } from '@/hooks/usePageMeta';
import { getWebsiteByDomain, toggleLike, type WebsiteItem } from '@/services/userCenter';
import { getPosts } from '@/services/postService';
import type { PostData } from '@/types/post';
import { domainOf, jumpUrl } from '@/utils/route';
import { getToken } from '@/utils/auth';
import { message } from 'antd';

const { Text, Paragraph, Title } = Typography;

const WebsiteDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const domain = (id || '').trim();

    const [loading, setLoading] = useState(true);
    const [item, setItem] = useState<WebsiteItem | null>(null);
    const [allPosts, setAllPosts] = useState<PostData[]>([]);
    const [error, setError] = useState('');
    const [liked, setLiked] = useState(false);
    const [zan, setZan] = useState(0);

    usePageMeta({
        title: item?.title || item?.name || '站点详情',
        keywords: item?.keywords || undefined,
        description: item?.content || undefined,
    });

    useEffect(() => {
        let alive = true;
        setLoading(true);
        setError('');
        setItem(null);
        Promise.all([getWebsiteByDomain(domain), getPosts()])
            .then(([r, posts]) => {
                if (!alive) return;
                if (r.code === 1 && r.data) {
                    setItem(r.data);
                    setZan(Number(r.data.zan) || 0);
                } else {
                    setError(r.msg || '站点不存在');
                }
                setAllPosts(posts);
            })
            .catch(() => {
                if (alive) setError('站点加载失败');
            })
            .finally(() => {
                if (alive) setLoading(false);
            });
        return () => {
            alive = false;
        };
    }, [domain]);

    const onLike = () => {
        const key = getToken();
        if (!key) {
            message.warning('请先登录后再点赞');
            navigate('/login');
            return;
        }
        if (!item) return;
        toggleLike(key, Number(item.id), 'website')
            .then((r) => {
                if (r.code === 1) {
                    const now = r.data?.liked === 1;
                    setLiked(now);
                    setZan((v) => (now ? v + 1 : Math.max(0, v - 1)));
                } else {
                    message.error(r.msg || '操作失败');
                }
            })
            .catch(() => message.error('网络错误'));
    };

    if (loading) return <WebsiteDetailSkeleton />;

    if (error || !item) {
        return (
            <Flex vertical gap={16}>
                <PageHeader title="站点详情" crumbs={[{ label: '首页', to: '/' }, { label: '网址导航', to: '/websites' }, { label: '详情' }]} />
                <Alert type="warning" showIcon message={error || '站点不存在'} />
                <div>
                    <Button onClick={() => navigate('/websites')}>返回网址导航</Button>
                </div>
            </Flex>
        );
    }

    const related = Array.isArray(item.related) ? item.related : [];
    const siteDomain = domainOf(item);
    const sitePosts = allPosts.filter(
        (p) => domainOf(p) === siteDomain
    );

    return (
        <Flex vertical gap={20}>
            <PageHeader
                title={item.title || item.name}
                crumbs={[
                    { label: '首页', to: '/' },
                    { label: '网址导航', to: '/websites' },
                    { label: item.title || item.name },
                ]}
                extra={
                    <Space wrap>
                        {item.url ? (
                            <Button type="primary" href={jumpUrl(item.url)} target="_blank" rel="noreferrer">
                                访问网站
                            </Button>
                        ) : null}
                        <Button
                            icon={liked ? '♥' : '♡'}
                            type={liked ? 'primary' : 'default'}
                            onClick={onLike}
                        >
                            点赞 {zan}
                        </Button>
                    </Space>
                }
            />

            <Card>
                <Flex gap={20} align="flex-start" wrap>
                    <Avatar shape="square" size={72} src={item.ico || item.pic || undefined}>
                        {(item.title || item.name || '?').slice(0, 1)}
                    </Avatar>
                    <Flex vertical gap={10} className="detail-main">
                        {item.keywords ? (
                            <Space size={[8, 8]} wrap>
                                {item.keywords.split(',').filter(Boolean).map((k) => (
                                    <Tag key={k}>{k.trim()}</Tag>
                                ))}
                            </Space>
                        ) : null}
                        <Paragraph className="detail-content">
                            {item.content || '暂无站点简介'}
                        </Paragraph>
                    </Flex>
                    {item.pic ? (
                        <img src={item.pic} alt={item.title || item.name} className="detail-shot-side" />
                    ) : null}
                </Flex>
            </Card>

            <Card title="站点信息">
                <Descriptions column={{ xs: 1, sm: 2 }} size="small">
                    <Descriptions.Item label="域名">{item.domain || item.www || '-'}</Descriptions.Item>
                    <Descriptions.Item label="浏览">{item.view}</Descriptions.Item>
                    <Descriptions.Item label="点赞">{item.zan}</Descriptions.Item>
                    <Descriptions.Item label="收录时间">
                        {item.time ? dayjs.unix(item.time).format('YYYY-MM-DD HH:mm') : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="更新时间">
                        {item.times ? dayjs.unix(item.times).format('YYYY-MM-DD HH:mm') : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="RSS" span={2}>
                        {item.feed_url ? (
                            <a href={jumpUrl(item.feed_url)} target="_blank" rel="noreferrer">
                                {item.feed_url}
                            </a>
                        ) : (
                            '未提供'
                        )}
                    </Descriptions.Item>
                    {item.tips ? (
                        <Descriptions.Item label="备注" span={2}>
                            <Text type="secondary">{item.tips}</Text>
                        </Descriptions.Item>
                    ) : null}
                </Descriptions>
            </Card>

            <Card title="站点文章">
                {sitePosts.length === 0 ? (
                    <Alert type="info" showIcon message="该站点暂无聚合文章" />
                ) : (
                    <List
                        size="small"
                        dataSource={sitePosts.slice(0, 5)}
                        rowKey={(p) => p.link || p.title}
                        renderItem={(p) => (
                            <List.Item>
                                <List.Item.Meta
                                    title={
                                        <a href={jumpUrl(p.link)} target="_blank" rel="noreferrer">
                                            {p.title || '无标题'}
                                        </a>
                                    }
                                    description={
                                        <Text type="secondary">
                                            {p.publishedAt ? dayjs(p.publishedAt).format('YYYY-MM-DD') : ''}
                                        </Text>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                )}
            </Card>

            {related.length > 0 ? (
                <Card title="相关站点">
                    <Row gutter={[16, 16]}>
                        {related.map((r) => (
                            <Col key={r.id} xs={24} sm={12} md={8}>
                                <List.Item>
                                    <List.Item.Meta
                                        avatar={<Avatar shape="square" src={r.ico || r.pic || undefined} />}
                                        title={<Link to={`/${domainOf(r)}`}>{r.title || r.name}</Link>}
                                        description={<Text type="secondary">{r.domain || r.www}</Text>}
                                    />
                                </List.Item>
                            </Col>
                        ))}
                    </Row>
                </Card>
            ) : null}

            <div>
                <Button onClick={() => navigate('/websites')}>返回网址导航</Button>
            </div>
        </Flex>
    );
};

export default WebsiteDetailPage;
