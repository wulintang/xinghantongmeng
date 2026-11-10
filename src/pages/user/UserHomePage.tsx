import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Alert, Button, Flex, Spin } from 'antd';

import { PageHeader } from '@components/common';
import { getMemberHome, getMemberSites, getSkillsByUser, type MemberHomeInfo, type MemberSiteItem } from '@/services/userCenter';
import { getColumns, type ColumnItem } from '@/services/column';
import { getUserRender, type MyRender } from '@/services/userBg';
import { usePageMeta } from '@/hooks/usePageMeta';
import { UserHomeCards } from './UserHomeCards';

const UserHomePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [info, setInfo] = useState<MemberHomeInfo | null>(null);
    const [sites, setSites] = useState<MemberSiteItem[]>([]);
    const [columns, setColumns] = useState<ColumnItem[]>([]);
    const [skills, setSkills] = useState<any[]>([]);
    const [loadingState, setLoadingState] = useState({ sites: true, columns: true, skills: true });
    const [bg, setBg] = useState<MyRender | null>(null);

    usePageMeta({ title: info?.name ? `${info.name} 的主页` : '会员主页' });

    // 基本资料：失败即整页错误态
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
        if (!id) return;
        let alive = true;
        setLoadingState((v) => ({ ...v, sites: true }));
        getMemberSites(id)
            .then((r: any) => {
                if (alive) setSites(r.code === 1 ? r.data || [] : []);
            })
            .catch(() => {})
            .finally(() => {
                if (alive) setLoadingState((v) => ({ ...v, sites: false }));
            });
        return () => {
            alive = false;
        };
    }, [id]);

    // 该会员的专栏（已通过才对外展示）
    useEffect(() => {
        if (!id) return;
        let alive = true;
        const uid = Number(id) || 0;
        setLoadingState((v) => ({ ...v, columns: true }));
        getColumns()
            .then((r) => {
                if (alive) setColumns(r.code === 1 && r.data ? r.data.filter((c) => c.uid === uid) : []);
            })
            .catch(() => {})
            .finally(() => {
                if (alive) setLoadingState((v) => ({ ...v, columns: false }));
            });
        return () => {
            alive = false;
        };
    }, [id]);

    useEffect(() => {
        if (!id) return;
        let alive = true;
        setLoadingState((v) => ({ ...v, skills: true }));
        getSkillsByUser(id)
            .then((r: any) => {
                if (alive) setSkills(r.code === 1 ? r.data || [] : []);
            })
            .catch(() => {})
            .finally(() => {
                if (alive) setLoadingState((v) => ({ ...v, skills: false }));
            });
        return () => {
            alive = false;
        };
    }, [id]);

    // 公开主页背景：只作用于下面两张 Card 的 body
    useEffect(() => {
        if (!id) return;
        let alive = true;
        getUserRender(id)
            .then((r: any) => {
                if (alive && r.code === 1 && r.data) setBg(r.data);
            })
            .catch(() => {});
        return () => {
            alive = false;
        };
    }, [id]);

    if (loading) return <Spin style={{ display: 'block', margin: '80px auto' }} />;
    if (error || !info) {
        return (
            <Flex vertical gap={16}>
                <PageHeader title="会员主页" crumbs={[{ label: '首页', to: '/' }, { label: '会员主页', to: '/user' }]} />
                <Alert type="warning" showIcon message={error || '用户不存在'} />
                <div><Button onClick={() => navigate('/')}>返回首页</Button></div>
            </Flex>
        );
    }

    return (
        <Flex vertical gap={20}>
            <PageHeader
                title={info.name}
                crumbs={[{ label: '首页', to: '/' }, { label: '会员主页', to: '/user' }, { label: info.name }]}
            />
            {/* 与「主页背景」设置页预览共用同一份卡片实现，视觉与数据永远一致 */}
            <UserHomeCards
                info={info}
                sites={sites}
                columns={columns}
                skills={skills}
                loading={loadingState}
                bg={bg}
            />
        </Flex>
    );
};

export default UserHomePage;
