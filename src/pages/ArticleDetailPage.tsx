import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, Divider, Flex, Space, Typography } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';

import { PageHeader } from '@components/common';
import { ArticleDetailSkeleton } from '@components/common/skeleton';
import { usePageMeta } from '@/hooks/usePageMeta';
import { getArticle, type ArticleItem } from '@/services/userCenter';
import { stripHtmlSuffix } from '@/utils/route';

const { Text, Paragraph } = Typography;

const ArticleDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const articleId = stripHtmlSuffix(id);

    const [loading, setLoading] = useState(true);
    const [item, setItem] = useState<ArticleItem | null>(null);
    const [error, setError] = useState('');

    usePageMeta({
        title: item?.title || '文章详情',
        keywords: item?.keywords || undefined,
        description: item?.description || undefined,
    });

    useEffect(() => {
        let alive = true;
        setLoading(true);
        setError('');
        setItem(null);
        getArticle(articleId)
            .then((r) => {
                if (!alive) return;
                if (r.code === 1 && r.data) setItem(r.data);
                else setError(r.msg || '文章不存在');
            })
            .catch(() => {
                if (alive) setError('文章加载失败');
            })
            .finally(() => {
                if (alive) setLoading(false);
            });
        return () => {
            alive = false;
        };
    }, [articleId]);

    if (loading) return <ArticleDetailSkeleton />;

    if (error || !item) {
        return (
            <Flex vertical gap={16}>
                <PageHeader
                    title="文章详情"
                    crumbs={[{ label: '首页', to: '/home' }, { label: '文章资讯', to: '/articles' }, { label: '详情' }]}
                />
                <Alert type="warning" showIcon message={error || '文章不存在'} />
                <div>
                    <Button onClick={() => navigate('/articles')}>返回文章资讯</Button>
                </div>
            </Flex>
        );
    }

    return (
        <Flex vertical gap={20} className="article-detail">
            <PageHeader
                title={item.title}
                crumbs={[
                    { label: '首页', to: '/home' },
                    { label: '文章资讯', to: '/articles' },
                    { label: item.title },
                ]}
                extra={
                    <Space>
                        <Button onClick={() => navigate('/articles')}>返回列表</Button>
                    </Space>
                }
            />

            <Space split={<Divider type="vertical" />} wrap className="detail-meta">
                <Text type="secondary">{dayjs.unix(item.time).format('YYYY-MM-DD HH:mm')}</Text>
                <Text type="secondary">浏览 {item.view}</Text>
                <Text type="secondary">点赞 {item.zan}</Text>
            </Space>

            <Card>
                {item.description ? (
                    <Alert type="info" showIcon message={item.description} className="article-lead" />
                ) : null}
                <Paragraph className="detail-content">{item.content || '暂无正文'}</Paragraph>
            </Card>

            <div>
                <Button onClick={() => navigate('/articles')}>返回文章资讯</Button>
            </div>
        </Flex>
    );
};

export default ArticleDetailPage;
