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
import { getWebsite, type WebsiteItem } from '@/services/userCenter';
import { stripHtmlSuffix, domainOf } from '@/utils/route';

const { Text, Paragraph, Title } = Typography;

const WebsiteDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const siteId = stripHtmlSuffix(id);

    const [loading, setLoading] = useState(true);
    const [item, setItem] = useState<WebsiteItem | null>(null);
    const [error, setError] = useState('');

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
        getWebsite(siteId)
            .then((r) => {
                if (!alive) return;
                if (r.code === 1 && r.data) setItem(r.data);
                else setError(r.msg || '站点不存在');
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
    }, [siteId]);

    if (loading) return <WebsiteDetailSkeleton />;

    if (error || !item) {
        return (
            <Flex vertical gap={16}>
                <PageHeader title="站点详情" crumbs={[{ label: '首页', to: '/home' }, { label: '网址导航', to: '/websites' }, { label: '详情' }]} />
                <Alert type="warning" showIcon message={error || '站点不存在'} />
                <div>
                    <Button onClick={() => navigate('/websites')}>返回网址导航</Button>
                </div>
            </Flex>
        );
    }

    const related = Array.isArray(item.related) ? item.related : [];
    const domain = domainOf(item);

    return (
        <Flex vertical gap={20}>
            <PageHeader
                title={item.title || item.name}
                crumbs={[
                    { label: '首页', to: '/home' },
                    { label: '网址导航', to: '/websites' },
                    { label: item.title || item.name },
                ]}
                extra={
                    <Space wrap>
                        {item.feed_url ? (
                            <Link to={`/blogs/${domain}`}>
                                <Button>查看博文</Button>
                            </Link>
                        ) : null}
                        {item.url ? (
                            <Button type="primary" href={item.url} target="_blank" rel="noreferrer">
                                访问网站
                            </Button>
                        ) : null}
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
                </Flex>
            </Card>

            <Card title="站点信息">
                <Descriptions column={{ xs: 1, sm: 2 }} size="small">
                    <Descriptions.Item label="域名">{item.domain || item.www || '-'}</Descriptions.Item>
                    <Descriptions.Item label="访问地址">
                        {item.url ? (
                            <a href={item.url} target="_blank" rel="noreferrer">
                                {item.url}
                            </a>
                        ) : (
                            '-'
                        )}
                    </Descriptions.Item>
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
                            <a href={item.feed_url} target="_blank" rel="noreferrer">
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

            {item.pic ? (
                <Card title="站点截图">
                    <img src={item.pic} alt={item.title || item.name} className="detail-shot" />
                </Card>
            ) : null}

            {related.length > 0 ? (
                <Card title="相关站点">
                    <Row gutter={[16, 16]}>
                        {related.map((r) => (
                            <Col key={r.id} xs={24} sm={12} md={8}>
                                <List.Item>
                                    <List.Item.Meta
                                        avatar={<Avatar shape="square" src={r.ico || r.pic || undefined} />}
                                        title={<Link to={`/websites/${r.id}`}>{r.title || r.name}</Link>}
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
