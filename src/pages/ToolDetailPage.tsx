import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, Descriptions, Flex, Input, Modal, Space, Tag, Typography, message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';

import { PageHeader, AdSlotSkeleton } from '@components/common';
import { ToolDetailSkeleton } from '@components/common/skeleton';
import { usePageMeta } from '@/hooks/usePageMeta';
import { getTool, submitReport, toggleFavorite, readFaved, type ToolItem } from '@/services/userCenter';
import { assetUrl, stripHtmlSuffix, toolPageUrl } from '@/utils/route';
import { markdownToHtml, sanitizeHtml } from '@/utils/CommonUtil';
import { getToken } from '@/utils/auth';

const { Text, Title } = Typography;

const ToolDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const toolId = stripHtmlSuffix(id);

    const [loading, setLoading] = useState(true);
    const [item, setItem] = useState<ToolItem | null>(null);
    const [error, setError] = useState('');
    const [reportOpen, setReportOpen] = useState(false);
    const [reportContent, setReportContent] = useState('');
    const [reporting, setReporting] = useState(false);
    const [faved, setFaved] = useState(false);

    usePageMeta({
        title: item?.title || '工具详情',
        description: item?.content || undefined,
    });

    useEffect(() => {
        let alive = true;
        setLoading(true);
        setError('');
        setItem(null);
        getTool(toolId, getToken())
            .then((r) => {
                if (!alive) return;
                if (r.code === 1 && r.data) {
                    setItem(r.data);
                    readFaved(getToken(), Number(r.data.id), 'tool').then(setFaved);
                } else setError(r.msg || '工具不存在');
            })
            .catch(() => {
                if (alive) setError('工具加载失败');
            })
            .finally(() => {
                if (alive) setLoading(false);
            });
        return () => {
            alive = false;
        };
    }, [toolId]);

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
            m: 'tool',
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
    const onFav = () => {
        const key = getToken();
        if (!key) { message.warning('请先登录后再收藏'); navigate('/login'); return; }
        if (!item) return;
        toggleFavorite(key, Number(item.id), 'tool')
            .then((r) => { if (r.code === 1) { setFaved(r.data?.faved === 1); message.success(r.data?.faved === 1 ? '已收藏' : '已取消收藏'); } else message.error(r.msg || '操作失败'); })
            .catch((e) => message.error(e?.message || '网络错误'));
    };

    if (loading) return <ToolDetailSkeleton />;

    if (error || !item) {
        return (
            <Flex vertical gap={16}>
                <PageHeader
                    title="工具详情"
                    crumbs={[{ label: '首页', to: '/' }, { label: '常用工具', to: '/tools' }, { label: '详情' }]}
                />
                <Alert type="warning" showIcon message={error || '工具不存在'} />
                <div>
                    <Button onClick={() => navigate('/tools')}>返回常用工具</Button>
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
                    { label: '常用工具', to: '/tools' },
                    { label: item.title },
                ]}
                extra={
                    <Space>
                        <Button onClick={() => navigate('/tools')}>返回列表</Button>
                        <Button type={faved ? 'primary' : 'default'} onClick={onFav}>{faved ? '★' : '☆'} 收藏</Button>
                        <Button onClick={() => setReportOpen(true)}>举报</Button>
                        <Button type="primary" href={toolPageUrl(item.alias)} target="_blank" rel="noreferrer">
                            打开工具
                        </Button>
                    </Space>
                }
            />

            <AdSlotSkeleton />

            <Card>
                <Flex gap={20} align="flex-start" wrap>
                    {item.pic ? <img src={assetUrl(item.pic)} alt={item.title} className="tool-detail-ico" /> : null}
                    <Flex vertical gap={10} className="detail-main">
                        <Space size={[8, 8]} wrap>
                            {item.ai === 1 ? <Tag color="purple">AI 工具</Tag> : <Tag color="blue">在线工具</Tag>}
                            {Number(item.rmb) > 0 ? <Tag color="gold">￥{item.rmb}</Tag> : <Tag color="green">免费</Tag>}
                            <Tag>标识 {item.alias}</Tag>
                        </Space>
                        <Title level={5} className="detail-subtitle">
                            工具说明
                        </Title>
                        <div className="detail-content md-content" dangerouslySetInnerHTML={{ __html: sanitizeHtml(markdownToHtml(item.content || '')) }} />
                    </Flex>
                </Flex>
            </Card>

            <Card title="工具信息">
                <Descriptions column={{ xs: 1, sm: 2 }} size="small">
                    <Descriptions.Item label="工具名称">{item.title}</Descriptions.Item>
                    <Descriptions.Item label="调用标识">{item.alias}</Descriptions.Item>
                    <Descriptions.Item label="价格">
                        {Number(item.rmb) > 0 ? `￥${item.rmb}` : '免费'}
                    </Descriptions.Item>
                    <Descriptions.Item label="类型">{item.ai === 1 ? 'AI 智能工具' : '在线工具'}</Descriptions.Item>
                    <Descriptions.Item label="排序">{item.px}</Descriptions.Item>
                    <Descriptions.Item label="发布时间">
                        {item.time ? dayjs.unix(item.time).format('YYYY-MM-DD HH:mm') : '-'}
                    </Descriptions.Item>
                </Descriptions>
            </Card>

            <Alert
                type="info"
                showIcon
                message="工具在后台运行"
                description={
                    <Flex vertical gap={8}>
                        <Text type="secondary">
                            该工具的交互界面与运行脚本由后台工具箱提供，前端只做入口。点击「打开工具」在新窗口中使用。
                        </Text>
                        <div>
                            <Button href={toolPageUrl(item.alias)} target="_blank" rel="noreferrer" type="link">
                                {toolPageUrl(item.alias)}
                            </Button>
                        </div>
                    </Flex>
                }
            />

            <AdSlotSkeleton />

            <Modal
                title={`举报「${item?.title || '工具'}」`}
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
                    placeholder="请描述该工具的违规情况（如：虚假信息、恶意代码、诈骗等）"
                    maxLength={500}
                    showCount
                />
            </Modal>
        </Flex>
    );
};

export default ToolDetailPage;
