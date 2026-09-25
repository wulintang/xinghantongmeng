import React, { useEffect, useState } from 'react';
import {
    Alert,
    Avatar,
    Button,
    Card,
    Col,
    Descriptions,
    Flex,
    Input,
    List,
    Modal,
    Row,
    Space,
    Tag,
    Tooltip,
    Typography,
    message,
} from 'antd';
import { Link, useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';

import { PageHeader, AdSlotSkeleton } from '@components/common';
import { WebsiteDetailSkeleton } from '@components/common/skeleton';
import { MdPreview } from 'md-editor-rt';
import 'md-editor-rt/lib/preview.css';
import { usePageMeta } from '@/hooks/usePageMeta';
import {
    getWebsiteByDomain,
    submitReport,
    toggleLike,
    toggleFavorite,
    readFaved,
    type WebsiteItem,
} from '@/services/userCenter';
import { getPosts } from '@/services/postService';
import type { PostData } from '@/types/post';
import { domainOf, jumpUrl, normalizeDomain } from '@/utils/route';
import { getToken } from '@/utils/auth';

const { Text, Title } = Typography;

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
    const [liking, setLiking] = useState(false);
    const [faved, setFaved] = useState(false);
    // 认领状态 / 认领中 / 举报弹窗
    const [claimed, setClaimed] = useState(false);
    const [claiming, setClaiming] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [reportContent, setReportContent] = useState('');
    const [reporting, setReporting] = useState(false);

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
        // feed 失败不影响站点详情本身，单独兜底成空列表
        Promise.all([
            getWebsiteByDomain(domain, 1, getToken()),
            getPosts().catch(() => [] as PostData[]),
        ])
            .then(([r, posts]) => {
                if (!alive) return;
                if (r.code === 1 && r.data) {
                    setItem(r.data);
                    setZan(Number(r.data.zan) || 0);
                    setLiked(Number((r.data as any).liked) === 1);
                    setClaimed(Number((r.data as any).uid) > 0);
                    readFaved(getToken(), Number(r.data.id), 'website').then(setFaved);
                } else {
                    setError(r.msg || '站点不存在');
                }
                setAllPosts(posts);
            })
            .catch((e: any) => {
                // 不要把真实错误吞掉，否则任何异常都被糊成「站点加载失败」，无法定位
                if (alive) setError('站点加载失败：' + (e?.message || String(e)));
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
        if (!item || liking) return;
        setLiking(true);
        toggleLike(key, Number(item.id), 'website')
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
        toggleFavorite(key, Number(item.id), 'website')
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

    const onClaim = () => {
        const key = getToken();
        if (!key) {
            message.warning('请先登录后再认领');
            navigate('/login');
            return;
        }
        if (!item) return;
        navigate('/user/submit?mode=claim&siteId=' + item.id);
    };

    const onReport = () => {
        const key = getToken();
        if (!key) {
            message.warning('请先登录后再举报');
            navigate('/login');
            return;
        }
        if (!reportContent.trim()) {
            message.warning('请填写举报内容');
            return;
        }
        setReporting(true);
        submitReport(key, {
            tid: String(item?.id || ''),
            m: 'website',
            title: item?.title || '',
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
            .catch(() => message.error('网络错误'))
            .finally(() => setReporting(false));
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
        (p) => normalizeDomain(domainOf(p)) === normalizeDomain(siteDomain)
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
                        <Button type={liked ? 'primary' : 'default'} onClick={onLike} loading={liking}>
                            {liked ? '♥' : '♡'} 点赞 {zan}
                        </Button>
                        <Button type={faved ? 'primary' : 'default'} onClick={onFav}>
                            {faved ? '★' : '☆'} 收藏
                        </Button>
                        <Tooltip title="举报">
                            <Button onClick={() => setReportOpen(true)}>举报</Button>
                        </Tooltip>
                    </Space>
                }
            />

            <AdSlotSkeleton slot="detail_website_top" />

            <Card>
                <Flex gap={20} align="flex-start" wrap>
                    <Avatar shape="square" size={72} src={item.ico || item.pic || undefined}>
                        {(item.title || item.name || '?').slice(0, 1)}
                    </Avatar>
                    <Flex vertical gap={10} className="detail-main">
                        <Space size={[8, 8]} wrap>
                            <Tag color={claimed ? 'green' : 'orange'}>{claimed ? '已认领' : '未认领'}</Tag>
                            {claimed && item.owner ? (
                                <Tag color="blue">
                                    <Link to={`/user/${item.uid}`} style={{ color: 'inherit' }}>
                                        站长：{item.owner}
                                    </Link>
                                </Tag>
                            ) : null}
                            {claimed && item.qq ? (
                                <Button
                                    size="small"
                                    type="link"
                                    href={`tencent://Message/?uin=${item.qq}&Site=&Menu=yes`}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    联系站长
                                </Button>
                            ) : null}
                            {!claimed ? (
                                <Button size="small" type="link" loading={claiming} onClick={onClaim}>
                                    认领该站点
                                </Button>
                            ) : null}
                        </Space>
                        {item.keywords ? (
                            <Space size={[8, 8]} wrap>
                                {item.keywords.split(',').filter(Boolean).map((k) => (
                                    <Tag key={k}>{k.trim()}</Tag>
                                ))}
                            </Space>
                        ) : null}
                        <div className="detail-content md-content"><MdPreview id="website-preview" modelValue={item.content || ''} /></div>
                    </Flex>
                    {item.pic ? (
                        <img src={item.pic} alt={item.title || item.name} className="detail-shot-side" />
                    ) : null}
                </Flex>
            </Card>

            <Card title="站点信息">
                <Descriptions column={{ xs: 1, sm: 2 }} size="small">
                    <Descriptions.Item label="域名">{item.domain || item.www || '-'}</Descriptions.Item>
                    <Descriptions.Item label="站长">
                        {claimed && item.owner ? <Link to={`/user/${item.uid}`}>{item.owner}</Link> : '未认领'}
                    </Descriptions.Item>
                    <Descriptions.Item label="浏览">{item.view}</Descriptions.Item>
                    <Descriptions.Item label="收录时间">
                        {item.time ? dayjs.unix(item.time).format('YYYY-MM-DD HH:mm') : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="更新时间">
                        {item.times ? dayjs.unix(item.times).format('YYYY-MM-DD HH:mm') : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="RSS" span={2}>
                        {item.feed_url ? (
                            <Tooltip title="RSS 订阅">
                                <a href={jumpUrl(item.feed_url)} target="_blank" rel="noreferrer">
                                    {item.feed_url}
                                </a>
                            </Tooltip>
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

            <Card title="最新文章">
                {sitePosts.length === 0 ? (
                    <Alert type="info" showIcon message="该站点暂无聚合文章" />
                ) : (
                    <List
                        size="small"
                        dataSource={sitePosts.slice(0, 10)}
                        rowKey={(p) => p.link || p.title}
                        renderItem={(p) => (
                            <List.Item>
                                <List.Item.Meta
                                    title={
                                        <Tooltip title={p.title}>
                                            <a href={jumpUrl(p.link)} target="_blank" rel="noreferrer">
                                                {p.title || '无标题'}
                                            </a>
                                        </Tooltip>
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
                                <Tooltip title={r.name || r.title}>
                                    <Link to={`/${domainOf(r)}`} className="related-site-card">
                                    <Avatar
                                        shape="square"
                                        size={48}
                                        src={r.ico || r.pic || undefined}
                                        className="related-site-avatar"
                                    >
                                        {(r.title || r.name || '?').slice(0, 1)}
                                    </Avatar>
                                    <div className="related-site-body">
                                        <div className="related-site-title">{r.title || r.name}</div>
                                        <div className="related-site-desc">
                                            {r.content ? r.content.replace(/<[^>]+>/g, '').slice(0, 60) + '……' : '暂无描述'}
                                        </div>
                                        <div className="related-site-url">{r.domain || r.www || r.url}</div>
                                    </div>
                                </Link>
                                </Tooltip>
                            </Col>
                        ))}
                    </Row>
                </Card>
            ) : null}

            <AdSlotSkeleton slot="detail_website_bottom" />

            <div>
                <Button onClick={() => navigate('/websites')}>返回网址导航</Button>
            </div>

            <Modal
                title={`举报「${item.title || item.name}」`}
                open={reportOpen}
                onCancel={() => setReportOpen(false)}
                onOk={onReport}
                okText="提交举报"
                confirmLoading={reporting}
            >
                <Input.TextArea
                    rows={4}
                    value={reportContent}
                    onChange={(e) => setReportContent(e.target.value)}
                    placeholder="请描述该站点的违规情况（如：虚假内容、恶意软件、垃圾信息等）"
                    maxLength={500}
                    showCount
                />
            </Modal>
        </Flex>
    );
};

export default WebsiteDetailPage;
