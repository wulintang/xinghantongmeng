import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, Flex, Space, Typography } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';

import { PageHeader } from '@components/common';
import { DanSkeleton } from '@components/common/skeleton';
import { usePageMeta } from '@/hooks/usePageMeta';
import { getDan, type DanItem } from '@/services/userCenter';
import { sanitizeHtml } from '@/utils/CommonUtil';
import { normalizeAlias } from '@/utils/route';

const { Text, Paragraph } = Typography;

const DanPage: React.FC = () => {
    const navigate = useNavigate();
    // 后台导航下发的是 /dan/about.html，路由参数会带上 .html，这里统一归一化
    const { alias } = useParams<{ alias: string }>();
    const key = normalizeAlias(alias);

    const [loading, setLoading] = useState(true);
    const [dan, setDan] = useState<DanItem | null>(null);
    const [error, setError] = useState('');

    usePageMeta({ title: dan?.title || '单页' });

    useEffect(() => {
        let alive = true;
        setLoading(true);
        setError('');
        setDan(null);
        getDan(key)
            .then((r) => {
                if (!alive) return;
                if (r.code === 1 && r.data) setDan(r.data);
                else setError(r.msg || '页面不存在');
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

    if (loading) return <DanSkeleton />;

    if (error || !dan) {
        return (
            <Flex vertical gap={16}>
                <PageHeader title="单页" crumbs={[{ label: '首页', to: '/' }, { label: '单页' }]} />
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
            />

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
                    // 后端单页正文是纯文本（含换行），按 pre-wrap 原样呈现
                    <Paragraph className="detail-content detail-plain">{raw || '暂无内容'}</Paragraph>
                )}
            </Card>

            <div>
                <Button onClick={() => navigate('/')}>返回首页</Button>
            </div>
        </Flex>
    );
};

export default DanPage;
