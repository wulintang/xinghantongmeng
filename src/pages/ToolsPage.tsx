import React, { useEffect, useState } from 'react';
import { Alert, Card, Col, Flex, Row, Tag, Typography } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { CateFilter, PageHeader } from '@components/common';
import { ToolsSkeleton } from '@components/common/skeleton';
import { usePageMeta } from '@/hooks/usePageMeta';
import { getToolCates, getTools, type CateItem, type ToolItem } from '@/services/userCenter';
import { plainText } from '@/utils/CommonUtil';
import { assetUrl } from '@/utils/route';

const { Text, Paragraph } = Typography;

const ToolsPage: React.FC = () => {
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const cate = params.get('cate') || '';

    const [loading, setLoading] = useState(true);
    const [cates, setCates] = useState<CateItem[]>([]);
    const [list, setList] = useState<ToolItem[]>([]);
    const [total, setTotal] = useState(0);

    usePageMeta({
        title: '常用工具',
        keywords: '在线工具, 常用工具, 工具箱',
        description: '兴汉同盟收录的在线常用工具。',
    });

    useEffect(() => {
        let alive = true;
        getToolCates()
            .then((r) => {
                if (alive && r.code === 1 && Array.isArray(r.data)) setCates(r.data);
            })
            .catch(() => {});
        return () => {
            alive = false;
        };
    }, []);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        getTools({ cate: cate || undefined, page: 1, limit: 100 })
            .then((r) => {
                if (!alive) return;
                if (r.code === 1 && r.data) {
                    setList(Array.isArray(r.data.list) ? r.data.list : []);
                    setTotal(Number(r.data.total) || 0);
                } else {
                    setList([]);
                    setTotal(0);
                }
            })
            .catch(() => {
                if (alive) {
                    setList([]);
                    setTotal(0);
                }
            })
            .finally(() => {
                if (alive) setLoading(false);
            });
        return () => {
            alive = false;
        };
    }, [cate]);

    const changeCate = (v: string) => {
        const next = new URLSearchParams(params);
        if (v) next.set('cate', v);
        else next.delete('cate');
        setParams(next);
    };

    return (
        <Flex vertical gap={20}>
            <PageHeader
                title="常用工具"
                description="后台工具箱里已开放的全部工具"
                crumbs={[{ label: '首页', to: '/' }, { label: '常用工具' }]}
            />

            <CateFilter cates={cates} value={cate} onChange={changeCate} />

            {loading ? (
                <ToolsSkeleton />
            ) : list.length === 0 ? (
                <Alert type="info" showIcon message="暂无工具" />
            ) : (
                <>
                    <Text type="secondary">共 {total} 个工具</Text>
                    <Row gutter={[16, 16]}>
                        {list.map((t) => (
                            <Col key={t.id} xs={12} sm={8} md={6}>
                                <Card
                                    className="tool-card"
                                    hoverable
                                    onClick={() => navigate(`/tools/${t.id}`)}
                                >
                                    <Flex vertical align="center" gap={10}>
                                        {t.pic ? (
                                            <img src={assetUrl(t.pic)} alt={t.title} className="tool-card-ico" />
                                        ) : null}
                                        <Text strong className="tool-card-name">
                                            {t.title}
                                        </Text>
                                        <Paragraph
                                            type="secondary"
                                            ellipsis={{ rows: 2 }}
                                            className="tool-card-desc"
                                        >
                                            {plainText(t.content) || '暂无说明'}
                                        </Paragraph>
                                        {Number(t.rmb) > 0 ? (
                                            <Tag color="gold">￥{t.rmb}</Tag>
                                        ) : (
                                            <Tag color="green">免费</Tag>
                                        )}
                                    </Flex>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </>
            )}
        </Flex>
    );
};

export default ToolsPage;
