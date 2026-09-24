import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Avatar, Button, Card, Col, Empty, Flex, Row, Spin, Tabs, Tag, Typography, Alert } from 'antd';

import { PageHeader } from '@components/common';
import { getMemberHome, getMemberSites, type MemberHomeInfo, type MemberSiteItem } from '@/services/userCenter';
import { domainOf } from '@/utils/route';
import { usePageMeta } from '@/hooks/usePageMeta';

const { Text } = Typography;

function sexIcon(sex: number): string {
    if (sex === 1) return '♂';
    if (sex === 2) return '♀';
    return '';
}

function PlaceholderTip({ text }: { text: string }) {
    return (
        <Flex justify="center" style={{ padding: '48px 0' }}>
            <Text type="secondary">{text}</Text>
        </Flex>
    );
}

function UserSitesTab({ loading, sites }: { loading: boolean; sites: MemberSiteItem[] }) {
    if (loading) return <Spin />;
    if (!sites.length) return <Empty description="该会员暂无已收录的站点" />;
    return (
        <Row gutter={[16, 16]}>
            {sites.map((s) => (
                <Col key={s.id} xs={24} sm={12} md={8}>
                    <Link to={`/${domainOf(s)}`} className="member-site-card">
                        <Avatar shape="square" size={48} src={s.ico || s.pic || undefined}>
                            {(s.title || s.www || '?').slice(0, 1)}
                        </Avatar>
                        <div className="member-site-body">
                            <div className="member-site-title">{s.title || s.www}</div>
                            <div className="member-site-desc">
                                {s.content ? s.content.replace(/<[^>]+>/g, '').slice(0, 40) + '…' : '暂无描述'}
                            </div>
                            <div className="member-site-url">{s.domain || s.www}</div>
                        </div>
                    </Link>
                </Col>
            ))}
        </Row>
    );
}

const UserHomePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [info, setInfo] = useState<MemberHomeInfo | null>(null);
    const [sites, setSites] = useState<MemberSiteItem[]>([]);
    const [sitesLoading, setSitesLoading] = useState(true);
    const [error, setError] = useState('');

    usePageMeta({ title: info?.name ? `${info.name} 的主页` : '会员主页' });

    useEffect(() => {
        let alive = true;
        setLoading(true);
        setError('');
        getMemberHome(id || '')
            .then((r: any) => {
                if (!alive) return;
                if (r.code === 1 && r.data) setInfo(r.data);
                else setError(r.msg || '用户不存在');
            })
            .catch((e: any) => {
                if (alive) setError('加载失败：' + (e?.message || String(e)));
            })
            .finally(() => {
                if (alive) setLoading(false);
            });
        return () => {
            alive = false;
        };
    }, [id]);

    useEffect(() => {
        if (!info) return;
        let alive = true;
        setSitesLoading(true);
        getMemberSites(id || '')
            .then((r: any) => {
                if (alive) setSites(r.code === 1 ? r.data || [] : []);
            })
            .catch(() => {})
            .finally(() => {
                if (alive) setSitesLoading(false);
            });
        return () => {
            alive = false;
        };
    }, [info, id]);

    if (loading) {
        return <Spin style={{ display: 'block', margin: '80px auto' }} />;
    }
    if (error || !info) {
        return (
            <Flex vertical gap={16}>
                <PageHeader title="会员主页" crumbs={[{ label: '首页', to: '/' }, { label: '会员主页' }]} />
                <Alert type="warning" showIcon message={error || '用户不存在'} />
                <div>
                    <Button onClick={() => navigate('/')}>返回首页</Button>
                </div>
            </Flex>
        );
    }

    const icon = sexIcon(info.sex);

    return (
        <Flex vertical gap={20}>
            <PageHeader
                title={info.name}
                crumbs={[{ label: '首页', to: '/' }, { label: '会员主页' }, { label: info.name }]}
            />

            <Card>
                <Flex gap={20} align="center" wrap>
                    <Avatar shape="square" size={72} src={info.head || undefined}>
                        {(info.name || '?').slice(0, 1)}
                    </Avatar>
                    <Flex vertical gap={6}>
                        <Flex align="center" gap={8}>
                            <Text strong style={{ fontSize: 'var(--fs-xl)' }}>
                                {info.name}
                            </Text>
                            {icon ? (
                                <Tag color={info.sex === 1 ? 'blue' : 'magenta'} style={{ marginInlineEnd: 0 }}>
                                    {icon}
                                </Tag>
                            ) : null}
                            {info.home ? (
                                <Button size="small" type="link" href={info.home} target="_blank" rel="noreferrer">
                                    个人主页
                                </Button>
                            ) : null}
                        </Flex>
                        {info.description ? (
                            <Text type="secondary" style={{ fontSize: 'var(--fs-base)' }}>
                                {info.description}
                            </Text>
                        ) : null}
                    </Flex>
                </Flex>
            </Card>

            <Card>
                <Tabs
                    defaultActiveKey="sites"
                    items={[
                        {
                            key: 'sites',
                            label: '会员的站点',
                            children: <UserSitesTab loading={sitesLoading} sites={sites} />,
                        },
                        {
                            key: 'tools',
                            label: '会员的工具',
                            children: <PlaceholderTip text="会员工具功能开发中，敬请期待。" />,
                        },
                        {
                            key: 'column',
                            label: '会员的专栏',
                            children: <PlaceholderTip text="会员专栏功能开发中，敬请期待。" />,
                        },
                    ]}
                />
            </Card>
        </Flex>
    );
};

export default UserHomePage;
