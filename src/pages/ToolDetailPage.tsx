import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, Descriptions, Flex, Input, Modal, Space, Tag, Typography, message } from 'antd'
import AppTooltip from '@/components/common/AppTooltip';
import { Link, useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { DownloadOutlined } from '@ant-design/icons';

import { useSite } from '@/context/SiteContext';
import { PageHeader, AdSlotSkeleton } from '@components/common';
import { ToolDetailSkeleton } from '@components/common/skeleton';
import { usePageMeta } from '@/hooks/usePageMeta';
import { getTool, submitReport, toggleFavorite, readFaved, exportSkillUrl, type ToolItem } from '@/services/userCenter';
import { assetUrl, stripHtmlSuffix } from '@/utils/route';
import SkillChat from '@/components/common/SkillChat';
import ToolRenderer from '@/components/common/ToolRenderer';
import MdView from '@components/common/MdView';
import 'md-editor-rt/lib/preview.css';
import { getToken } from '@/utils/auth';

const { Title } = Typography;

// AI 技能（ai=1）走「独立字段表 + 一个聊天框」；
// 非 AI 的在线工具（MD5 / JS 美化 / 九宫格切图等）是本地功能工具，
// 必须恢复渲染后端自带的 config 工具页，绝不能一律塞进 AI 对话。
const isAiSkill = (item: ToolItem) => Number(item.ai) === 1;

const ToolDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const toolId = stripHtmlSuffix(id);
    const { site } = useSite();

    const [loading, setLoading] = useState(true);
    const [item, setItem] = useState<ToolItem | null>(null);
    const [error, setError] = useState('');
    const [reportOpen, setReportOpen] = useState(false);
    const [reportContent, setReportContent] = useState('');
    const [reporting, setReporting] = useState(false);
    const [faved, setFaved] = useState(false);

    usePageMeta({
        title: item?.title || '技能详情',
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

    // 导出交给后端生成标准 Agent Skill（SKILL.md），并按作者设置的 allow_export 校验
    const onExport = () => {
        if (!item) return;
        const a = document.createElement('a');
        a.href = exportSkillUrl(item.id);
        a.download = 'SKILL.md';
        document.body.appendChild(a);
        a.click();
        a.remove();
    };

    if (loading) return <ToolDetailSkeleton />;

    if (error || !item) {
        return (
            <Flex vertical gap={16}>
                <PageHeader
                    title="技能详情"
                    crumbs={[{ label: '首页', to: '/' }, { label: '技能广场', to: '/tools' }, { label: '详情' }]}
                />
                <Alert type="warning" showIcon message={error || '技能不存在'} />
                <div>
                    <Button onClick={() => navigate('/tools')}>返回技能广场</Button>
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
                    { label: '技能广场', to: '/tools' },
                    { label: item.title },
                ]}
                extra={
                    <Space>
                        <Button onClick={() => navigate('/tools')}>返回技能广场</Button>
                        <Button type={faved ? 'primary' : 'default'} onClick={onFav}>{faved ? '★' : '☆'} 收藏</Button>
                        <AppTooltip title="举报">
                            <Button onClick={() => setReportOpen(true)}>举报</Button>
                        </AppTooltip>
                        {/* 只有作者明确开启、且是 AI 技能，才允许导出 SKILL.md */}
                        {isAiSkill(item) && Number(item.allow_export) === 1 ? (
                            <AppTooltip title="导出为标准 Agent Skill（SKILL.md），可直接放进任意 AI 的技能目录">
                                <Button icon={<DownloadOutlined />} onClick={onExport}>导出技能</Button>
                            </AppTooltip>
                        ) : null}
                    </Space>
                }
            />

            <AdSlotSkeleton slot="detail_tool_top" />

            <Card>
                <Flex gap={20} align="flex-start" wrap>
                    {item.pic ? <img src={assetUrl(item.pic)} alt={item.title} className="tool-detail-ico" /> : null}
                    <Flex vertical gap={10} className="detail-main">
                        <Space size={[8, 8]} wrap>
                            {isAiSkill(item) ? <Tag color="purple">AI 技能</Tag> : <Tag color="blue">在线工具</Tag>}
                            {Number(item.rmb) > 0 ? <Tag color="gold">￥{item.rmb}</Tag> : <Tag color="green">免费</Tag>}
                            <Tag>标识 {item.alias}</Tag>
                        </Space>
                        <Title level={5} className="detail-subtitle">
                            技能说明
                        </Title>
                        <div className="detail-content md-content"><MdView id="tool-preview" modelValue={item.content || ''} /></div>
                    </Flex>
                </Flex>
            </Card>

            {/* AI 技能：全站一个通用字段表 + 一个聊天框；非 AI 工具：还原本地工具页 */}
            {isAiSkill(item) ? (
                <Card title="使用技能">
                    <SkillChat toolId={Number(item.id)} title={item.title} />
                </Card>
            ) : (
                <Card title="在线使用">
                    <ToolRenderer
                        config={item.config || ''}
                        ai={Number(item.ai)}
                        toolId={Number(item.id)}
                        token={getToken() || ''}
                    />
                </Card>
            )}

            <Card title="技能信息">
                <Descriptions column={{ xs: 1, sm: 2 }} size="small">
                    <Descriptions.Item label="技能名称">{item.title}</Descriptions.Item>
                    <Descriptions.Item label="调用标识">{item.alias}</Descriptions.Item>
                    <Descriptions.Item label="价格">
                        {Number(item.rmb) > 0 ? `￥${item.rmb}` : '免费'}
                    </Descriptions.Item>
                    <Descriptions.Item label="类型">{isAiSkill(item) ? 'AI 智能技能' : '在线工具'}</Descriptions.Item>
                    <Descriptions.Item label="作者">
                        {Number(item.uid) === 0 ? (
                            <Tag color="blue">
                                <Link to="/dan/about" style={{ color: 'inherit' }}>
                                    {site?.title || '官方'}
                                </Link>
                            </Tag>
                        ) : (
                            <Tag color="blue">
                                <Link to={`/user/${item.uid}`} style={{ color: 'inherit' }}>
                                    {item.author || `会员${item.uid}`}
                                </Link>
                            </Tag>
                        )}
                    </Descriptions.Item>
                    <Descriptions.Item label="排序">{item.px}</Descriptions.Item>
                    <Descriptions.Item label="发布时间">
                        {item.time ? dayjs.unix(item.time).format('YYYY-MM-DD HH:mm') : '-'}
                    </Descriptions.Item>
                </Descriptions>
            </Card>

            <AdSlotSkeleton slot="detail_tool_bottom" />

            <Modal
                title={`举报「${item?.title || '技能'}」`}
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
