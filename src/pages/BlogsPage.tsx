import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Avatar, Card, Flex, List, Pagination, Segmented, Tag, Typography } from 'antd';
import { Link, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';

import { PageHeader, SearchBox } from '@components/common';
import { BlogsSkeleton } from '@components/common/skeleton';
import { usePageMeta } from '@/hooks/usePageMeta';
import { getPosts } from '@/services/postService';
import { getWebsiteByDomain, getWebsites, type WebsiteItem } from '@/services/userCenter';
import type { PostData } from '@/types/post';
import { assetUrl, domainOf, jumpUrl, normalizeDomain } from '@/utils/route';

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
    /** 域名 -> 站点头像（用网站数据 API 的 ico/pic，提交时上传、不可能为空） */
    const [siteIcons, setSiteIcons] = useState<Record<string, string>>({});

    usePageMeta({
        title: 'Feed广场',
        keywords: 'Feed广场, 文章聚合, 站点圈',
        description: '兴汉同盟收录站点的最新文章聚合。',
    });

    useEffect(() => {
        let alive = true;
        setLoading(true);
        Promise.all([getPosts(), getWebsites({ page: 1, limit: 100 })])
            .then(([list, sites]) => {
                if (!alive) return;
                setPosts(list);
                const map: Record<string, string> = {};
                if (sites.code === 1 && sites.data?.list) {
                    (sites.data.list as WebsiteItem[]).forEach((w) => {
                        const icon = assetUrl(w.ico || w.pic || '');
                        if (icon) map[normalizeDomain(domainOf(w))] = icon;
                    });
                }
                setSiteIcons(map);
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

    /** 列表分页可能截断或域名形态不一致，地图没命中的站点按需回源补一次站点 logo */
    const missingDomains = useMemo(
        () =>
            Array.from(new Set(posts.map((p) => normalizeDomain(domainOf(p))))).filter(
                (d) => d && !siteIcons[d]
            ),
        [posts, siteIcons]
    );

    useEffect(() => {
        if (missingDomains.length === 0) return;
        let alive = true;
        Promise.all(missingDomains.map((d) => getWebsiteByDomain(d)))
            .then((rs) => {
                if (!alive) return;
                const add: Record<string, string> = {};
                rs.forEach((r) => {
                    const item = r.data as WebsiteItem | null;
                    if (r.code === 1 && item) {
                        const icon = assetUrl(item.pic || item.ico || '');
                        if (icon) add[normalizeDomain(domainOf(item))] = icon;
                    }
                });
                if (Object.keys(add).length > 0) setSiteIcons((m) => ({ ...m, ...add }));
            })
            .catch(() => {});
        return () => {
            alive = false;
        };
    }, [missingDomains]);

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
                title="Feed广场"
                description={`来自 ${siteCount} 个站点的最新文章`}
                crumbs={[{ label: '首页', to: '/' }, { label: 'Feed广场' }]}
            />

            <SearchBox placeholder="搜索文章标题、摘要、站点" gotoPage="/feed" />

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
                    message="暂无文章"
                    description={keyword ? `关键词「${keyword}」没有匹配结果。` : '站点尚未聚合到文章。'}
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
                                const icon = siteIcons[normalizeDomain(domain)];
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
                                                <Avatar shape="square" src={icon || undefined}>
                                                    {(p.blogName || domain || '?').slice(0, 1)}
                                                </Avatar>
                                            }
                                            title={
                                                <a href={jumpUrl(p.link)} target="_blank" rel="noreferrer">
                                                    {p.title || '无标题'}
                                                </a>
                                            }
                                            description={
                                                <Flex align="center" gap={8} wrap>
                                                    <Link to={`/${domain}`}>
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
