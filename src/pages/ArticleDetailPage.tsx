import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, Divider, Flex, Space, Typography, message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';

import { PageHeader } from '@components/common';
import { ArticleDetailSkeleton } from '@components/common/skeleton';
import { usePageMeta } from '@/hooks/usePageMeta';
import { getArticle, toggleLike, type ArticleItem } from '@/services/userCenter';
import { stripHtmlSuffix } from '@/utils/route';
import { getToken } from '@/utils/auth';

const { Text, Paragraph } = Typography;

const ArticleDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const articleId = stripHtmlSuffix(id);

    const [loading, setLoading] = useState(true);
    const [item, setItem] = useState<ArticleItem | null>(null);
    const [error, setError] = useState('');
    const [liked, setLiked] = useState(false);
    const [zan, setZan] = useState(0);

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
        getArticle(articleId, getToken(), 1)
            .then((r) => {
                if (!alive) return;
                if (r.code === 1 && r.data) {
                    setItem(r.data);
                    setZan(Number(r.data.zan) || 0);
                } else setError(r.msg || '文章不存在');
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

    const onLike = () => {
        const key = getToken();
        if (!key) {
            message.warning('请先登录后再点赞');
            navigate('/login');
            return;
        }
        if (!item) return;
        toggleLike(key, Number(item.id), 'article')
            .then((r) => {
                if (r.code === 1) {
                    const now = r.data?.liked === 1;
                    setLiked(now);
                    // 后端同步了业务表 zan 字段，直接用后端返回的最新值
                    if (typeof r.data?.zan === 'number') setZan(r.data.zan);
                    else setZan((v) => (now ? v + 1 : Math.max(0, v - 1)));
                } else {
                    message.error(r.msg || '操作失败');
                }
            })
            .catch(() => message.error('网络错误'));
    };

    if (loading) return <ArticleDetailSkeleton />;

    if (error || !item) {
        return (
            <Flex vertical gap={16}>
                <PageHeader
                    title="文章详情"
                    crumbs={[{ label: '首页', to: '/' }, { label: '文章资讯', to: '/articles' }, { label: '详情' }]}
                />
                <Alert type="warning" showIcon message={error || '文章不存在'} />
                <div>
                    <Button onClick={() => navigate('/articles')}>返回文章资讯</Button>
                </div>
            </Flex>
        );
    }

    return (
        <Flex vertical gap={20}>
            <PageHeader
                title={item.title}
                crumbs={[
                    { label: '首页', to: '/' },
                    { label: '文章资讯', to: '/articles' },
                    { label: item.title },
                ]}
                extra={
                    <Space wrap>
                        <Button
                            icon={liked ? '♥' : '♡'}
                            type={liked ? 'primary' : 'default'}
                            onClick={onLike}
                        >
                            点赞 {zan}
                        </Button>
                        <Button onClick={() => navigate('/articles')}>返回列表</Button>
                    </Space>
                }
            />

            <Space split={<Divider type="vertical" />} wrap className="detail-meta">
                <Text type="secondary">{dayjs.unix(item.time).format('YYYY-MM-DD HH:mm')}</Text>
                <Text type="secondary">浏览 {item.view}</Text>
                <Text type="secondary">点赞 {zan}</Text>
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
