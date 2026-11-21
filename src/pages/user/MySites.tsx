import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Button, Card, Tag, Space, Popconfirm, message, Typography, Modal,
    Alert, Flex, Radio, Input, Divider, Tooltip,
} from 'antd'
import AppTooltip from '@/components/common/AppTooltip';
import { Link } from 'react-router-dom';

import {
    getMySites, delMySite, delMySiteApply,
    getMyFulfills, applyFulfill, verifyFulfill, cancelFulfill, previewFulfillHtml,
    type WebsiteItem, type FulfillRecord, type FulfillPreviewItem,
} from '@/services/userCenter';
import { domainOf } from '@/utils/route';
import { getToken } from '@/utils/auth';
import { usePageMeta } from '@/hooks/usePageMeta';
import CardTable from '@components/common/CardTable';

const { Text, Paragraph } = Typography;
const YEARS = [1, 3, 5, 10];

export default function MySitesPage() {
    const navigate = useNavigate();
    usePageMeta({ title: '我的站点' });
    const [list, setList] = useState<WebsiteItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [fulfills, setFulfills] = useState<FulfillRecord[]>([]);

    // 履约管理弹窗
    const [fulfillOpen, setFulfillOpen] = useState(false);
    const [curSite, setCurSite] = useState<WebsiteItem | null>(null);
    const [curRec, setCurRec] = useState<FulfillRecord | null>(null);
    const [years, setYears] = useState(3);
    const [acting, setActing] = useState(false);
    const [previewList, setPreviewList] = useState<FulfillPreviewItem[]>([]);
    const [previewLoading, setPreviewLoading] = useState(false);

    const load = () => {
        const key = getToken();
        if (!key) {
            navigate('/login');
            return;
        }
        setLoading(true);
        Promise.all([
            getMySites(key),
            getMyFulfills(key).catch(() => ({ code: 0, data: [] })),
        ])
            .then(([r, f]: any[]) => {
                if (r.code === 1) setList(r.data || []);
                else {
                    message.error(r.msg || '加载失败');
                    if (r.msg && r.msg.indexOf('登录') >= 0) navigate('/login');
                }
                if (f && f.code === 1) setFulfills(f.data || []);
            })
            .catch(() => message.error('网络错误'))
            .finally(() => setLoading(false));
    };

    useEffect(load, [navigate]);

    const fulfillOf = (siteId: number) => fulfills.find((f) => Number(f.site_id) === Number(siteId)) || null;

    const onDelete = (row: WebsiteItem) => {
        const key = getToken();
        const api = row.pending ? delMySiteApply : delMySite;
        api(key || '', row.id)
            .then((r: any) => {
                if (r.code === 1) {
                    message.success('已删除');
                    load();
                } else {
                    message.error(r.msg || '删除失败');
                }
            })
            .catch(() => message.error('网络错误'));
    };

    const openFulfill = (row: WebsiteItem) => {
        const rec = fulfillOf(row.id);
        setCurSite(row);
        setCurRec(rec);
        setYears(rec?.years || 3);
        setFulfillOpen(true);
        // 打开即拉取四档 HTML，无需先申请
        const key = getToken();
        if (!key) return;
        setPreviewList([]);
        setPreviewLoading(true);
        previewFulfillHtml(key, row.id)
            .then((r: any) => {
                if (r.code === 1) setPreviewList(r.data?.list || []);
                else message.error(r.msg || '获取履约标识失败');
            })
            .catch(() => message.error('网络错误'))
            .finally(() => setPreviewLoading(false));
    };

    const doApply = () => {
        const key = getToken();
        if (!key || !curSite) return;
        setActing(true);
        // 先申请建记录，随即触发系统验证（通过/失败各一次通知，不跳转）
        applyFulfill(key, curSite.id, years)
            .then((r: any) => {
                if (r.code !== 1) {
                    message.error(r.msg || '申请失败');
                    return;
                }
                return verifyFulfill(key, curSite.id).then((v: any) => {
                    if (v.code === 1) message.success(v.msg || '履约验证通过');
                    else message.error(v.msg || '未通过验证，请确认已悬挂履约标识');
                });
            })
            .catch(() => message.error('网络错误'))
            .finally(() => {
                setActing(false);
                load();
            });
    };

    const doCancel = () => {
        const key = getToken();
        if (!key || !curSite) return;
        setActing(true);
        cancelFulfill(key, curSite.id)
            .then((r: any) => {
                if (r.code === 1) { message.success('已撤销履约'); load(); }
                else message.error(r.msg || '撤销失败');
            })
            .catch(() => message.error('网络错误'))
            .finally(() => setActing(false));
    };

    const columns = [
        {
            title: '站点',
            dataIndex: 'title',
            render: (v: string, row: WebsiteItem) => (
                <Space>
                    {row.ico ? <img src={row.ico} alt={row.title || ''} className="mysite-ico" /> : null}
                    {row.pending ? (
                        <AppTooltip title={row.title || row.www || row.domain || v}>
                            <span>{v}</span>
                        </AppTooltip>
                    ) : (
                        <AppTooltip title={row.title || row.www || row.domain || v}>
                            <Link to={`/${domainOf(row)}`}>{v}</Link>
                        </AppTooltip>
                    )}
                </Space>
            ),
        },
        {
            title: '域名',
            dataIndex: 'www',
            render: (v: string) => (
                <AppTooltip title={v || '-'}>
                    <Text className="uc-ellipsis">{v || '-'}</Text>
                </AppTooltip>
            ),
        },
        {
            title: '状态',
            dataIndex: 'open',
            render: (v: number) =>
                Number(v) === 1 ? (
                    <Tag color="success">已收录</Tag>
                ) : Number(v) === 9 ? (
                    <Tag color="error">已拒绝</Tag>
                ) : (
                    <Tag color="warning">待审核</Tag>
                ),
        },
        {
            title: '履约',
            key: 'fulfill',
            render: (_: any, row: WebsiteItem) => {
                const rec = fulfillOf(row.id);
                if (!rec) return <Text type="secondary">—</Text>;
                if (Number(rec.status) === 1) return <Tag color="success">{rec.agree} · 履约中 {rec.progress}%</Tag>;
                if (Number(rec.status) === 2) return <Tag>已撤销</Tag>;
                return <Tag color="processing">待验证</Tag>;
            },
        },
        { title: '浏览', dataIndex: 'view' },
        { title: '点赞', dataIndex: 'zan' },
        {
            title: '操作',
            render: (_: any, row: WebsiteItem) => (
                <Space wrap className="mysite-actions">
                    {Number(row.open) === 1 && !row.pending ? (
                        <Button size="small" type="primary" ghost onClick={() => openFulfill(row)}>履约管理</Button>
                    ) : null}
                    {!row.pending && (
                        <Button size="small" onClick={() => navigate(`/user/submit?mode=edit&siteId=${row.id}`)}>
                            编辑
                        </Button>
                    )}
                    <Popconfirm
                        title={row.pending ? '确认撤回该申请？' : '确认删除该站点？'}
                        onConfirm={() => onDelete(row)}
                        okText="删除"
                        cancelText="取消"
                    >
                        <Button size="small" danger>
                            {row.pending ? '撤回' : '删除'}
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const rec = curRec;
    const status = rec ? Number(rec.status) : 0;

    return (
        <Card
            className="user-center-card"
            title="我的站点"
            extra={
                <Button type="primary" shape="round" onClick={() => navigate('/user/submit')}>
                    + 提交站点
                </Button>
            }
        >
            <Text type="secondary">
                认领/提交的站点会出现在这里。点击「编辑」修改资料（仅改域名或 Feed 需重新验证域名归属），待审核的站点由管理员收录后对外展示。
            </Text>
            <CardTable<WebsiteItem>
                className="mt-16"
                rowKey="id"
                loading={loading}
                pagination={false}
                columns={columns}
                dataSource={list}
                scrollX={false}
            />

            <Modal
                title={`履约管理 · ${curSite?.title || ''}`}
                open={fulfillOpen}
                onCancel={() => setFulfillOpen(false)}
                footer={null}
                width={640}
                destroyOnClose
            >
                <div className="fulfill-manage">
                    {status === 1 ? (
                        <Alert type="success" showIcon
                            message={`${rec?.agree} · 履约中`}
                            description={`履约进度 ${rec?.progress}%，有效期至 ${rec?.end_date}。`}
                            className="mb-16"
                        />
                    ) : status === 2 ? (
                        <Alert type="warning" showIcon message="履约已撤销"
                            description="可重新选择档位申请加入，系统验证通过后重新履约。" className="mb-16" />
                    ) : rec ? (
                        <Alert type="info" showIcon message="待验证"
                            description={rec.fail_reason ? `上次未通过：${rec.fail_reason}` : '请将履约标识贴到站点首页后点击验证。'}
                            className="mb-16" />
                    ) : null}

                    <Divider orientation="left" plain>1. 复制履约标识，贴到站点首页</Divider>
                    <Paragraph type="secondary" className="fulfill-tip">
                        下面四档 HTML 已按你的站点生成，直接复制对应档位贴到站点首页（如页脚）。履约几年即显示「几年之约」，含站点 logo 与履约进度，点击跳转履约证明。
                    </Paragraph>
                    {previewLoading ? (
                        <Alert type="info" showIcon message="正在生成履约标识…" />
                    ) : previewList.length ? (
                        <Flex vertical gap={12}>
                            {previewList.map((p) => (
                                <div key={p.years}>
                                    <Text strong className="fulfill-tier-label">{p.agree}</Text>
                                    <Input.TextArea value={p.html} readOnly rows={2} className="fulfill-embed" />
                                </div>
                            ))}
                        </Flex>
                    ) : (
                        <Alert type="info" showIcon message="履约标识生成失败，请关闭后重试" />
                    )}

                    <Divider orientation="left" plain>2. 选择档位并申请（系统自动验证，无人工审核）</Divider>
                    <Paragraph type="secondary" className="fulfill-tip">
                        选好已贴到站点的档位后点「申请」，系统即时抓取站点首页/检测徽章加载，通过即履约、失败保持未履约；通过/失败均发邮件，不跳转。
                    </Paragraph>
                    <Radio.Group value={years} onChange={(e) => setYears(e.target.value)} disabled={status === 1} className="mb-16">
                        {YEARS.map((y) => (
                            <Radio.Button key={y} value={y}>{y === 1 ? '一年' : y === 3 ? '三年' : y === 5 ? '五年' : '十年'}之约</Radio.Button>
                        ))}
                    </Radio.Group>
                    <Flex gap={8} wrap>
                        {status === 1 ? null : (
                            <Button type="primary" loading={acting} onClick={doApply}>
                                申请并验证
                            </Button>
                        )}
                        {rec && status === 1 ? (
                            <Popconfirm title="确认撤销履约？撤销后不再展示履约标识。" onConfirm={doCancel} okText="撤销" cancelText="取消">
                                <Button danger loading={acting}>撤销履约</Button>
                            </Popconfirm>
                        ) : null}
                        {rec ? (
                            <a href={rec.cert_url} target="_blank" rel="noreferrer"><Button>查看履约证明</Button></a>
                        ) : null}
                    </Flex>
                </div>
            </Modal>
        </Card>
    );
}
