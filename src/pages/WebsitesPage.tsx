import React, { useEffect, useState } from 'react';
import { Alert, Avatar, Button, Card, Col, Flex, Pagination, Row, Tooltip, Typography } from 'antd';
import { Link, useSearchParams } from 'react-router-dom';

import { CateFilter, PageHeader, SearchBox, AdSlotSkeleton } from '@components/common';
import { WebsitesSkeleton } from '@components/common/skeleton';
import { usePageMeta } from '@/hooks/usePageMeta';
import { getWebsiteCates, getWebsites, type CateItem, type WebsiteItem } from '@/services/userCenter';
import { domainOf } from '@/utils/route';

const { Text, Paragraph } = Typography;

const PAGE_SIZE = 12;

const WebsitesPage: React.FC = () => {
    const [params, setParams] = useSearchParams();
    const cate = params.get('cate') || '';
    const keyword = params.get('keyword') || '';
    const page = Math.max(1, Number(params.get('page') || 1));

    const [loading, setLoading] = useState(true);
    const [cates, setCates] = useState<CateItem[]>([]);
    const [list, setList] = useState<WebsiteItem[]>([]);
    const [total, setTotal] = useState(0);

    usePageMeta({
        title: '网址导航',
        keywords: '网址导航, 站点收录, 博客导航',
        description: '兴汉同盟收录的全部站点，可按分类浏览与搜索。',
    });

    useEffect(() => {
        let alive = true;
        getWebsiteCates()
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
        getWebsites({ cate: cate || undefined, keyword: keyword || undefined, page, limit: PAGE_SIZE })
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
    }, [cate, keyword, page]);

    const updateParam = (patch: Record<string, string | number | undefined>) => {
        const next = new URLSearchParams(params);
        Object.keys(patch).forEach((k) => {
            const v = patch[k];
            if (v === undefined || v === '' || v === null) next.delete(k);
            else next.set(k, String(v));
        });
        setParams(next);
    };

    return (
        <Flex vertical gap={20}>
            <PageHeader
                title="网址导航"
                description="按分类浏览后台收录的全部站点"
                crumbs={[{ label: '首页', to: '/' }, { label: '网址导航', to: '/websites' }]}
            />

            <AdSlotSkeleton slot="list_website_top" />

            <SearchBox placeholder="搜索站点名称、关键词、域名" gotoPage="/websites" />

            <CateFilter
                cates={cates}
                value={cate}
                onChange={(v) => updateParam({ cate: v, page: undefined })}
            />

            {loading ? (
                <WebsitesSkeleton />
            ) : list.length === 0 ? (
                <Alert
                    type="info"
                    showIcon
                    message="没有找到站点"
                    description={keyword ? `关键词「${keyword}」没有匹配结果。` : '该分类下暂时没有站点。'}
                />
            ) : (
                <>
                    <Flex justify="space-between" align="center" wrap gap={8}>
                        <Text type="secondary">共 {total} 个站点</Text>
                    </Flex>
                    <Row gutter={[16, 16]}>
                        {list.map((w, i) => (
                            <React.Fragment key={w.id}>
                                <Col xs={24} sm={12} md={8}>
                                <Card className="site-card">
                                    <Flex vertical gap={12}>
                                        <Flex align="center" gap={12}>
                                            <Avatar shape="square" size={48} src={w.ico || w.pic || undefined}>
                                                {(w.title || w.name || '?').slice(0, 1)}
                                            </Avatar>
                                            <Flex vertical gap={2} className="site-card-body">
                                            <Tooltip title={w.title || w.name}>
                                                <Link to={`/${domainOf(w)}`} className="site-card-name">
                                                    {w.title || w.name}
                                                </Link>
                                            </Tooltip>
                                                <Text type="secondary" className="site-card-domain">
                                                    {w.domain || w.www}
                                                </Text>
                                            </Flex>
                                        </Flex>
                                        <Paragraph type="secondary" ellipsis={{ rows: 2 }} className="site-card-desc">
                                            {w.content || w.keywords || '暂无简介'}
                                        </Paragraph>
                                        <Flex justify="space-between" align="center" wrap gap={8}>
                                            <Text type="secondary" className="site-card-meta">
                                                浏览 {w.view} · 点赞 {w.zan}
                                            </Text>
                                            <Flex gap={4}>
                                                {w.url ? (
                                                    <Tooltip title={w.title || w.name}>
                                                    <Link to={`/${domainOf(w)}`}>
                                                        <Button type="link" size="small">
                                                            {w.feed_url ? '查看文章' : '访问'}
                                                        </Button>
                                                    </Link>
                                                </Tooltip>
                                                ) : null}
                                            </Flex>
                                        </Flex>
                                    </Flex>
                                </Card>
                            </Col>
                            </React.Fragment>
                        ))}
                    </Row>
                    {total > PAGE_SIZE ? (
                        <Flex justify="center">
                            <Pagination
                                current={page}
                                pageSize={PAGE_SIZE}
                                total={total}
                                showSizeChanger={false}
                                onChange={(p) => updateParam({ page: p })}
                            />
                        </Flex>
                    ) : null}
                </>
            )}
        </Flex>
    );
};

export default WebsitesPage;
