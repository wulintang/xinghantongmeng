import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Avatar, Card, Flex, List, Pagination, Segmented, Tag, Typography } from 'antd';
import { Link, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';

import { PageHeader, SearchBox } from '@components/common';
import { BlogsSkeleton } from '@components/common/skeleton';
import { usePageMeta } from '@/hooks/usePageMeta';
import { getPosts } from '@/services/postService';
import type { PostData } from '@/types/post';
import { domainOf } from '@/utils/route';

const { Text, Paragraph } = Typography;

const PAGE_SIZE = 10;

type SortKey = 'latest' | 'earliest' | 'site';

const sortOptions = [
    { label: '最新', value: 'latest' },
    { label: '最早', value: 'earliest' },
    { label: '按站点', value: 'site' },
];

const BlogsPage: React.FC = () => {
    const [params, setParams] = useSearchParams();
    const keyword = params.get('keyword') || '';
    const sort = (params.get('sort') as SortKey) || 'latest';
    const page = Math.max(1, Number(params.get('page') || 1));

    const [loading, setLoading] = useState(true);
    const [posts, setPosts] = useState<PostData[]>([]);

    usePageMeta({
        title: '博客广场',
        keywords: '博客广场, 博文聚合, 博客圈',
        description: '兴汉同盟收录站点的最新博文聚合。',
    });

    useEffect(() => {
        let alive = true;
        setLoading(true);
        getPosts()
            .then((list) => {
                if (alive) setPosts(list);
            })
            .catch(() => {
                if (alive) setPosts([]);
            })
            .finally(() => {
                if (alive) setLoading(false);
            });
        return () => {
            alive = false;
        };
    }, []);

    const updateParam = (patch: Record<string, string | number | undefined>) => {
        const next = new URLSearchParams(params);
        Object.keys(patch).forEach((k) => {
            const v = patch[k];
            if (v === undefined || v === '' || v === null) next.delete(k);
            else next.set(k, String(v));
        });
        setParams(next);
    };

    const list = useMemo(() => {
        const kw = keyword.trim().toLowerCase();
        let arr = posts.filter((p) => {
            if (!kw) return true;
            return [p.title, p.description, p.blogName, domainOf(p)].some((v) =>
                (v || '').toLowerCase().includes(kw)
            );
        });
        if (sort === 'earliest') {
            arr = [...arr].sort((a, b) => (a.publishedAt || '').localeCompare(b.publishedAt || ''));
        } else if (sort === 'site') {
            arr = [...arr].sort((a, b) => (a.blogName || '').localeCompare(b.blogName || '', 'zh-CN'));
        }
        return arr;
    }, [posts, keyword, sort]);

    const pageList = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const siteCount = useMemo(() => new Set(posts.map((p) => domainOf(p))).size, [posts]);

    return (
        <Flex vertical gap={20}>
            <PageHeader
                title="博客广场"
                description={`来自 ${siteCount} 个站点的最新博文`}
                crumbs={[{ label: '首页', to: '/home' }, { label: '博客广场' }]}
            />

            <SearchBox placeholder="搜索文章标题、摘要、站点" gotoPage="/blogs" />

            <Flex justify="space-between" align="center" wrap gap={12}>
                <Text type="secondary">共 {list.length} 篇</Text>
                <Segmented
                    value={sort}
                    onChange={(v) => updateParam({ sort: String(v), page: undefined })}
                    options={sortOptions}
                />
            </Flex>

            {loading ? (
                <BlogsSkeleton />
            ) : list.length === 0 ? (
                <Alert
                    type="info"
                    showIcon
                    message="暂无博文"
                    description={keyword ? `关键词「${keyword}」没有匹配结果。` : '站点尚未聚合到博文。'}
                />
            ) : (
                <>
                    <Card>
                        <List
                            itemLayout="vertical"
                            dataSource={pageList}
                            rowKey={(p) => p.link || `${domainOf(p)}-${p.title}`}
                            renderItem={(p) => {
                                const domain = domainOf(p);
                                return (
                                    <List.Item
                                        key={p.link || p.title}
                                        actions={[
                                            <Text type="secondary" key="time">
                                                {p.publishedAt ? dayjs(p.publishedAt).format('YYYY-MM-DD HH:mm') : ''}
                                            </Text>,
                                            p.recommended ? <Tag color="red" key="rec">推荐</Tag> : null,
                                            p.pinned ? <Tag color="orange" key="pin">置顶</Tag> : null,
                                        ].filter(Boolean)}
                                    >
                                        <List.Item.Meta
                                            avatar={
                                                <Avatar
                                                    shape="square"
                                                    src={p.blogAdminMediumImageURL || p.blogAdminLargeImageURL || undefined}
                                                >
                                                    {(p.blogName || domain || '?').slice(0, 1)}
                                                </Avatar>
                                            }
                                            title={
                                                <a href={p.link} target="_blank" rel="noreferrer">
                                                    {p.title || '无标题'}
                                                </a>
                                            }
                                            description={
                                                <Flex align="center" gap={8} wrap>
                                                    <Link to={`/blogs/${domain}`}>
                                                        <Tag color="blue">{p.blogName || domain}</Tag>
                                                    </Link>
                                                    <Text type="secondary">{domain}</Text>
                                                </Flex>
                                            }
                                        />
                                        {p.description ? (
                                            <Paragraph type="secondary" ellipsis={{ rows: 2 }} className="post-summary">
                                                {p.description}
                                            </Paragraph>
                                        ) : null}
                                    </List.Item>
                                );
                            }}
                        />
                    </Card>
                    {list.length > PAGE_SIZE ? (
                        <Flex justify="center">
                            <Pagination
                                current={page}
                                pageSize={PAGE_SIZE}
                                total={list.length}
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

export default BlogsPage;
