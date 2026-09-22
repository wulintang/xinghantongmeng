import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, Divider, Flex, Input, Modal, Space, Typography, message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';

import { PageHeader, AdSlotSkeleton } from '@components/common';
import { ArticleDetailSkeleton } from '@components/common/skeleton';
import { usePageMeta } from '@/hooks/usePageMeta';
import { getArticle, submitReport, toggleLike, toggleFavorite, readFaved, type ArticleItem } from '@/services/userCenter';
import { stripHtmlSuffix } from '@/utils/route';
import { markdownToHtml, sanitizeHtml } from '@/utils/CommonUtil';
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
    const [faved, setFaved] = useState(false);
    const [zan, setZan] = useState(0);
    const [liking, setLiking] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [reportContent, setReportContent] = useState('');
    const [reporting, setReporting] = useState(false);

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
                    setLiked(Number((r.data as any).liked) === 1);
                    readFaved(getToken(), Number(r.data.id), 'article').then(setFaved);
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
        if (!item || liking) return;
        setLiking(true);
        toggleLike(key, Number(item.id), 'article')
            .then((r) => {
                if (r.code === 1) {
                    const now = r.data?.liked === 1;
                    setLiked(now);
                    // 后端同步了业务表 zan 字段，直接用后端返回的最新值
                    if (typeof r.data?.zan === 'number') setZan(r.data.zan);
                    else setZan((v) => (now ? v + 1 : Math.max(0, v - 1)));
                    message.success(now ? '点赞成功' : '已取消点赞');
                } else {
                    message.error(r.msg || '操作失败');
                }
            })
            .catch((e) => message.error(e?.message || '网络错误'))
            .finally(() => setLiking(false));
    };
    const onFav = () => {
        const key = getToken();
        if (!key) {
            message.warning('请先登录后再收藏');
            navigate('/login');
            return;
        }
        if (!item) return;
        toggleFavorite(key, Number(item.id), 'article')
            .then((r) => {
                if (r.code === 1) {
                    const now = r.data?.faved === 1;
                    setFaved(now);
                    message.success(now ? '已收藏' : '已取消收藏');
                } else {
                    message.error(r.msg || '操作失败');
                }
            })
            .catch((e) => message.error(e?.message || '网络错误'));
    };

    const onReport = () => {
        const key = getToken();
        if (!key) {
            message.warning('请先登录后再举报');
            navigate('/login');
            return;
        }
        if (!item || !reportContent.trim()) {
            message.warning('请填写举报内容');
            return;
        }
        setReporting(true);
        submitReport(key, {
            tid: String(item.id),
            m: 'article',
            title: item.title || '',
            content: reportContent.trim(),
        })
            .then((r) => {
                if (r.code === 1) {
                    message.success(r.msg || '举报已提交');
                    setReportOpen(false);
                    setReportContent('');
                } else {
                    message.error(r.msg || '提交失败');
                }
            })
            .catch((e) => message.error(e?.message || '网络错误'))
            .finally(() => setReporting(false));
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
                            loading={liking}
                        >
                            点赞 {zan}
                        </Button>
                        <Button type={faved ? 'primary' : 'default'} onClick={onFav}>
                            {faved ? '★' : '☆'} 收藏
                        </Button>
                        <Button onClick={() => setReportOpen(true)}>举报</Button>
                        <Button onClick={() => navigate('/articles')}>返回列表</Button>
                    </Space>
                }
            />

            <AdSlotSkeleton />

            <Space split={<Divider type="vertical" />} wrap className="detail-meta">
                <Text type="secondary">{dayjs.unix(item.time).format('YYYY-MM-DD HH:mm')}</Text>
                <Text type="secondary">浏览 {item.view}</Text>
                <Text type="secondary">点赞 {zan}</Text>
            </Space>

            <Card>
                {item.description ? (
                    <Alert type="info" showIcon message={item.description} className="article-lead" />
                ) : null}
                {item.content ? (
                    <div
                        className="detail-content md-content"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(markdownToHtml(item.content)) }}
                    />
                ) : (
                    <Paragraph className="detail-content">暂无正文</Paragraph>
                )}
            </Card>

            <AdSlotSkeleton />

            <div>
                <Button onClick={() => navigate('/articles')}>返回文章资讯</Button>
            </div>

            <Modal
                title={`举报「${item.title}」`}
                open={reportOpen}
                onCancel={() => {
                    setReportOpen(false);
                    setReportContent('');
                }}
                onOk={onReport}
                okText="提交举报"
                confirmLoading={reporting}
            >
                <Input.TextArea
                    rows={4}
                    value={reportContent}
                    onChange={(e) => setReportContent(e.target.value)}
                    placeholder="请描述该文章的违规情况（如：虚假内容、侵权、垃圾信息等）"
                    maxLength={500}
                    showCount
                />
            </Modal>
        </Flex>
    );
};

export default ArticleDetailPage;
