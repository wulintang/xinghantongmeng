import React, { useEffect, useState } from 'react';
import { Alert, Col, Flex, Pagination, Row, Typography } from 'antd'
import { useSearchParams } from 'react-router-dom';

import { CateFilter, PageHeader, SearchBox, AdSlotSkeleton, SiteCard } from '@components/common';
import { WebsitesSkeleton } from '@components/common/skeleton';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useMinLoading } from '@/hooks/useMinLoading';
import { getWebsiteCates, getWebsites, type CateItem, type WebsiteItem } from '@/services/userCenter';

const { Text } = Typography;

const PAGE_SIZE = 12;

const WebsitesPage: React.FC = () => {
    const [params, setParams] = useSearchParams();
    const cate = params.get('cate') || '';
    const keyword = params.get('keyword') || '';
    const page = Math.max(1, Number(params.get('page') || 1));

    const [rawLoading, setLoading] = useState(true);
    const loading = useMinLoading(rawLoading);
    const [cates, setCates] = useState<CateItem[]>([]);
    const [list, setList] = useState<WebsiteItem[]>([]);
    const [total, setTotal] = useState(0);

    usePageMeta({
        title: '网址导航',
        keywords: '网址导航, 站点收录, 博客导航',
        description: '兴汉联盟收录的全部站点，可按分类浏览与搜索。',
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

            <SearchBox placeholder="搜索站点名称、关键词、域名" gotoPage="/search" />

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
                    <Row gutter={[16, 16]} align="stretch">
                        {list.map((w) => (
                            <Col key={w.id} xs={24} sm={12} md={8}>
                                <SiteCard item={w} />
                            </Col>
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
