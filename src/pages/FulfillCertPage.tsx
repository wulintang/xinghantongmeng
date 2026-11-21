import React, { useEffect, useState } from 'react';
import { Alert, Avatar, Button, Card, Flex, Progress, Space, Tag, Typography } from 'antd';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { PageHeader } from '@components/common';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useMinLoading } from '@/hooks/useMinLoading';
import { getFulfillCert, type FulfillCert } from '@/services/userCenter';
import { assetUrl } from '@/utils/route';

const { Title, Text, Paragraph } = Typography;

/**
 * 履约证明页（方案B：/certificate/{domain}，公开可访问、可验真）
 * 响应式：桌面双栏（证书主体 + 信息侧栏），手机堆叠。
 * 文案随档位动态：一年之约 / 三年之约 / 五年之约 / 十年之约。
 */
const FulfillCertPage: React.FC = () => {
    const navigate = useNavigate();
    const { domain } = useParams<{ domain: string }>();
    const d = (domain || '').trim();

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<FulfillCert | null>(null);
    const [error, setError] = useState('');
    const showLoading = useMinLoading(loading, 800);

    usePageMeta({
        title: data ? `${data.agree} · 履约证明` : '履约证明',
        description: data ? `${data.siteTitle} 的履约证明` : undefined,
    });

    useEffect(() => {
        let alive = true;
        setLoading(true);
        setError('');
        setData(null);
        getFulfillCert(d)
            .then((r: any) => {
                if (!alive) return;
                if (r.code === 1 && r.data) setData(r.data);
                else setError(r.msg || '未找到履约证明');
            })
            .catch((e: any) => {
                if (alive) setError('加载失败：' + (e?.message || String(e)));
            })
            .finally(() => {
                if (alive) setLoading(false);
            });
        return () => { alive = false; };
    }, [d]);

    const isOn = data?.status === 1;

    return (
        <>
            <PageHeader title={data ? data.agree : '履约证明'} />

            <div className="site-content">
                <div className="container">
                    {showLoading ? (
                        <div className="cert-skeleton">
                            <Card><div className="sk-line sk-line-long" /><div className="sk-line sk-line-mid" /></Card>
                        </div>
                    ) : error || !data ? (
                        <Alert
                            type="info"
                            showIcon
                            message={error || '未找到履约证明'}
                            description="该站点可能尚未加入履约计划，或履约标识未通过系统验证。"
                            action={<Button type="link" onClick={() => navigate('/websites')}>浏览站点</Button>}
                        />
                    ) : (
                        <div className="fulfill-cert">
                            <Card className="fulfill-cert-card">
                                <div className={`fulfill-cert-banner ${isOn ? 'is-on' : 'is-off'}`}>
                                    <div className="fulfill-cert-seal">
                                        {data.logo ? (
                                            <Avatar shape="square" size={64} src={assetUrl(data.logo)} />
                                        ) : (
                                            <span>{data.siteTitle.slice(0, 1)}</span>
                                        )}
                                    </div>
                                    <div className="fulfill-cert-heading">
                                        <Title level={3} className="fulfill-cert-title">{data.agree} · 履约证书</Title>
                                        <Text className="fulfill-cert-sub">兴汉联盟 · 站点履约计划</Text>
                                    </div>
                                    <Tag color={isOn ? 'success' : 'default'} className="fulfill-cert-status">
                                        {isOn ? '履约有效' : '未履约'}
                                    </Tag>
                                </div>

                                <Paragraph className="fulfill-cert-lead">
                                    {isOn ? (
                                        <>兹证明 <strong>{data.siteTitle}</strong>（{data.domain}）已通过 <strong>{data.agree}</strong> 履约审核，自 {data.startDate} 起持续履约，特发此证。</>
                                    ) : (
                                        <><strong>{data.siteTitle}</strong>（{data.domain}）当前状态为未履约，履约标识尚未通过系统验证，暂不展示履约证明。</>
                                    )}
                                </Paragraph>

                                <div className="fulfill-cert-progress">
                                    <Flex justify="space-between" align="center">
                                        <Text type="secondary">履约进度</Text>
                                        <Text strong>{isOn ? `${data.progress}%` : '—'}</Text>
                                    </Flex>
                                    <Progress
                                        percent={isOn ? data.progress : 0}
                                        status={isOn ? 'active' : 'normal'}
                                        showInfo={false}
                                        strokeColor={isOn ? '#16a34a' : undefined}
                                    />
                                    <Flex justify="space-between">
                                        <Text type="secondary" className="fulfill-cert-date">{data.startDate || '—'}</Text>
                                        <Text type="secondary" className="fulfill-cert-date">{data.endDate || '—'}</Text>
                                    </Flex>
                                </div>

                                <div className="fulfill-cert-grid">
                                    <div className="fulfill-cert-item"><Text type="secondary">履约编号</Text><Text code>{data.certNo}</Text></div>
                                    <div className="fulfill-cert-item"><Text type="secondary">站点名称</Text><Text>{data.siteTitle}</Text></div>
                                    <div className="fulfill-cert-item"><Text type="secondary">履约主体</Text><Text>{data.owner || '—'}</Text></div>
                                    <div className="fulfill-cert-item"><Text type="secondary">站点域名</Text><Text>{data.domain}</Text></div>
                                    <div className="fulfill-cert-item"><Text type="secondary">加入日期</Text><Text>{data.startDate || '—'}</Text></div>
                                    <div className="fulfill-cert-item"><Text type="secondary">履约到期</Text><Text>{data.endDate || '—'}</Text></div>
                                    <div className="fulfill-cert-item"><Text type="secondary">档位</Text><Text>{data.agree}（{data.years} 年）</Text></div>
                                    <div className="fulfill-cert-item"><Text type="secondary">证书状态</Text><Text>{isOn ? '有效' : '未生效'}</Text></div>
                                </div>

                                <div className="fulfill-cert-audit">
                                    <Title level={5}>审核项目</Title>
                                    <ul>
                                        <li className={isOn ? 'ok' : ''}><span>{isOn ? '✓' : '○'}</span> 站点已认领并完成归属验证</li>
                                        <li className={isOn ? 'ok' : ''}><span>{isOn ? '✓' : '○'}</span> 站点首页已悬挂履约标识</li>
                                        <li className={isOn ? 'ok' : ''}><span>{isOn ? '✓' : '○'}</span> 系统自动验证通过（无人工介入）</li>
                                    </ul>
                                </div>

                                <div className="fulfill-cert-foot">
                                    <Space wrap>
                                        <Link to={`/${data.domain}`}><Button>访问站点详情</Button></Link>
                                        <Button type="primary" onClick={() => navigate('/websites')}>浏览全部站点</Button>
                                    </Space>
                                    <Text type="secondary" className="fulfill-cert-note">
                                        本证书由系统自动验证生成，可凭域名公开验真。
                                    </Text>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default FulfillCertPage;
