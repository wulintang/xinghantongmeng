import React, { useEffect, useState } from 'react';
import { Alert, Card, Flex, List, Pagination, Tag, Typography } from 'antd';
import { Link, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';

import { CateFilter, PageHeader, SearchBox, AdSlotSkeleton } from '@components/common';
import { ArticlesSkeleton } from '@components/common/skeleton';
import { usePageMeta } from '@/hooks/usePageMeta';
import { getArticleCates, getArticles, type ArticleItem, type CateItem } from '@/services/userCenter';

const { Text } = Typography;

const PAGE_SIZE = 10;

const ArticlesPage: React.FC = () => {
    const [params, setParams] = useSearchParams();
    const cate = params.get('cate') || '';
    const keyword = params.get('keyword') || '';
    const page = Math.max(1, Number(params.get('page') || 1));

    const [loading, setLoading] = useState(true);
    const [cates, setCates] = useState<CateItem[]>([]);
    const [list, setList] = useState<ArticleItem[]>([]);
    const [total, setTotal] = useState(0);

    usePageMeta({
        title: '文章资讯',
        keywords: '文章, 资讯, 公告',
        description: '兴汉同盟站内发布的最新文章与公告。',
    });

    useEffect(() => {
        let alive = true;
        getArticleCates()
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
        getArticles({ cate: cate || undefined, keyword: keyword || undefined, page, limit: PAGE_SIZE })
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
                title="文章资讯"
                description="后台发布的全部文章"
                crumbs={[{ label: '首页', to: '/' }, { label: '文章资讯' }]}
            />

            <AdSlotSkeleton />

            <SearchBox placeholder="搜索文章标题" gotoPage="/articles" />

            <CateFilter cates={cates} value={cate} onChange={(v) => updateParam({ cate: v, page: undefined })} />

            {loading ? (
                <ArticlesSkeleton />
            ) : list.length === 0 ? (
                <Alert type="info" showIcon message="暂无文章" description={keyword ? `关键词「${keyword}」没有匹配结果。` : undefined} />
            ) : (
                <>
                    <Text type="secondary">共 {total} 篇</Text>
                    <Card>
                        <List
                            itemLayout="vertical"
                            dataSource={list}
                            rowKey={(a) => a.id}
                            renderItem={(a, idx) => (
                                <React.Fragment key={a.id}>
                                    {idx === 8 ? <AdSlotSkeleton /> : null}
                                    <List.Item
                                        actions={[
                                            <Text type="secondary" key="time">
                                                {dayjs.unix(a.time).format('YYYY-MM-DD HH:mm')}
                                            </Text>,
                                            <Text type="secondary" key="view">
                                                浏览 {a.view}
                                            </Text>,
                                            <Text type="secondary" key="zan">
                                                点赞 {a.zan}
                                            </Text>,
                                        ]}
                                    >
                                        <List.Item.Meta
                                            title={<Link to={`/articles/${a.id}`}>{a.title}</Link>}
                                            description={
                                                a.description ? (
                                                    <Text type="secondary">{a.description}</Text>
                                                ) : (
                                                    <Tag>资讯</Tag>
                                                )
                                            }
                                        />
                                    </List.Item>
                                </React.Fragment>
                            )}
                        />
                    </Card>
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

export default ArticlesPage;
