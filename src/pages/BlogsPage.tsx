import React, { useEffect, useMemo, useState } from 'react';
import { Avatar, Empty, Flex, List, Pagination, Segmented, Tag, Typography } from 'antd';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';

import { Meta, MainContentHeader, SearchBox } from '@components/common';
import { BlogsSkeleton } from '@components/common/skeleton';
import { getPosts } from '@/services/postService';
import type { PostData } from '@/types/post';
import { getURLParameter } from '@/utils/CommonUtil';

const { Text, Title } = Typography;

const PAGE_SIZE = 10;

type SortKey = 'latest' | 'earliest' | 'site';

const sortOptions = [
    { label: '最新', value: 'latest' },
    { label: '最早', value: 'earliest' },
    { label: '按站点', value: 'site' },
];

const meta = {
    title: '博客广场 - 兴汉同盟',
    keywords: '博客广场, 博文聚合, 博客圈',
    description: '兴汉同盟收录的全部博客最新文章。',
};

const domainOf = (p: PostData): string => (p.blogDomainName || p.blogAddress || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '');

const BlogsPage: React.FC = () => {
    const keyword = getURLParameter('keyword') || '';
    const [loading, setLoading] = useState(true);
    const [posts, setPosts] = useState<PostData[]>([]);
    const [sort, setSort] = useState<SortKey>('latest');
    const [page, setPage] = useState(1);

    useEffect(() => {
        setLoading(true);
        getPosts()
            .then((list) => setPosts(list))
            .catch(() => setPosts([]))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        setPage(1);
    }, [keyword, sort]);

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

    return (
        <>
            <Meta meta={meta} />
            <Flex vertical gap={16}>
                <MainContentHeader content="博客广场" />
                <SearchBox placeholder="搜索文章、站点 ↵" gotoPage="/blogs" />
                <Flex justify="space-between" align="center" wrap gap={12}>
                    <Text type="secondary">共 {list.length} 篇</Text>
                    <Segmented
                        value={sort}
                        onChange={(v) => setSort(v as SortKey)}
                        options={sortOptions}
                    />
                </Flex>
                {loading ? (
                    <BlogsSkeleton />
                ) : list.length === 0 ? (
                    <Empty description={keyword ? '没有匹配的文章，换个关键词试试' : '暂无文章'} />
                ) : (
                    <>
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
                                        ]}
                                    >
                                        <List.Item.Meta
                                            avatar={
                                                <Avatar shape="square" src={p.blogAdminMediumImageURL || p.blogAdminLargeImageURL || undefined}>
                                                    {(p.blogName || domain || '?').slice(0, 1)}
                                                </Avatar>
                                            }
                                            title={
                                                <a href={p.link} target="_blank" rel="noreferrer noopener">
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
                                            <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }} className="post-summary">
                                                {p.description}
                                            </Typography.Paragraph>
                                        ) : null}
                                    </List.Item>
                                );
                            }}
                        />
                        {list.length > PAGE_SIZE ? (
                            <Flex justify="center">
                                <Pagination
                                    current={page}
                                    pageSize={PAGE_SIZE}
                                    total={list.length}
                                    showSizeChanger={false}
                                    onChange={setPage}
                                />
                            </Flex>
                        ) : null}
                    </>
                )}
            </Flex>
        </>
    );
};

export default BlogsPage;
