import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, Flex, Input, Modal, Space, Tooltip, Typography, message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';

import { PageHeader, AdSlotSkeleton } from '@components/common';
import { DanSkeleton } from '@components/common/skeleton';
import { usePageMeta } from '@/hooks/usePageMeta';
import { getDan, submitReport, toggleFavorite, readFaved, type DanItem } from '@/services/userCenter';
import { markdownToHtml, sanitizeHtml } from '@/utils/CommonUtil';
import { normalizeAlias } from '@/utils/route';
import { getToken } from '@/utils/auth';

const { Text, Paragraph } = Typography;

const DanPage: React.FC = () => {
    const navigate = useNavigate();
    // 后台导航下发的是 /dan/about.html，路由参数会带上 .html，这里统一归一化
    const { alias } = useParams<{ alias: string }>();
    const key = normalizeAlias(alias);

    const [loading, setLoading] = useState(true);
    const [dan, setDan] = useState<DanItem | null>(null);
    const [error, setError] = useState('');
    const [reportOpen, setReportOpen] = useState(false);
    const [reportContent, setReportContent] = useState('');
    const [reporting, setReporting] = useState(false);
    const [faved, setFaved] = useState(false);

    usePageMeta({ title: dan?.title || '单页' });

    useEffect(() => {
        let alive = true;
        setLoading(true);
        setError('');
        setDan(null);
        getDan(key, 1, getToken())
            .then((r) => {
                if (!alive) return;
                if (r.code === 1 && r.data) {
                    setDan(r.data);
                    readFaved(getToken(), Number(r.data.id), 'dan').then(setFaved);
                } else setError(r.msg || '页面不存在');
            })
            .catch(() => {
                if (alive) setError('页面加载失败');
            })
            .finally(() => {
                if (alive) setLoading(false);
            });
        return () => {
            alive = false;
        };
    }, [key]);

    const onReport = () => {
        const key = getToken();
        if (!key) {
            message.warning('请先登录后再举报');
            navigate('/login');
            return;
        }
        if (!dan || !reportContent.trim()) {
            message.warning('请填写举报内容');
            return;
        }
        setReporting(true);
        submitReport(key, {
            tid: String(dan.id),
            m: 'dan',
            title: dan.title || '',
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
    const onFav = () => {
        const key = getToken();
        if (!key) { message.warning('请先登录后再收藏'); navigate('/login'); return; }
        if (!dan) return;
        toggleFavorite(key, Number(dan.id), 'dan')
            .then((r) => { if (r.code === 1) { setFaved(r.data?.faved === 1); message.success(r.data?.faved === 1 ? '已收藏' : '已取消收藏'); } else message.error(r.msg || '操作失败'); })
            .catch((e) => message.error(e?.message || '网络错误'));
    };

    if (loading) return <DanSkeleton />;

    if (error || !dan) {
        return (
            <Flex vertical gap={16}>
                <PageHeader title="单页" crumbs={[{ label: '首页', to: '/' }, { label: '单页', to: '/dan' }]} />
                <Alert type="warning" showIcon message={error || '页面不存在'} />
                <div>
                    <Button onClick={() => navigate('/')}>返回首页</Button>
                </div>
            </Flex>
        );
    }

    const raw = dan.content || '';
    const isHtml = /<[a-z][\s\S]*>/i.test(raw);

    return (
        <Flex vertical gap={20} className="dan-wrap">
            <PageHeader
                title={dan.title || key}
                crumbs={[{ label: '首页', to: '/' }, { label: dan.title || key }]}
                extra={
                    <Space>
                        <Button type={faved ? 'primary' : 'default'} onClick={onFav}>{faved ? '★' : '☆'} 收藏</Button>
                        <Tooltip title="举报">
                            <Button onClick={() => setReportOpen(true)}>举报</Button>
                        </Tooltip>
                    </Space>
                }
            />

            <AdSlotSkeleton slot="detail_dan_top" />

            <Space split="·" wrap className="detail-meta">
                <Text type="secondary">浏览 {dan.view}</Text>
                <Text type="secondary">
                    {dan.time ? dayjs.unix(dan.time).format('YYYY-MM-DD HH:mm') : ''}
                </Text>
            </Space>

            <Card>
                {isHtml ? (
                    <div
                        className="detail-content"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(raw) }}
                    />
                ) : (
                    <div
                        className="detail-content md-content"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(markdownToHtml(raw || '')) }}
                    />
                )}
            </Card>

            <AdSlotSkeleton slot="detail_dan_bottom" />

            <div>
                <Button onClick={() => navigate('/')}>返回首页</Button>
            </div>

            <Modal
                title={`举报「${dan?.title || '单页'}」`}
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
                    placeholder="请描述该页面的违规情况（如：虚假内容、侵权、垃圾信息等）"
                    maxLength={500}
                    showCount
                />
            </Modal>
        </Flex>
    );
};

export default DanPage;
