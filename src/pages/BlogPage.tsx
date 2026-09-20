import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Avatar, Button, Empty, Flex, List, Pagination, Tag, Typography } from 'antd';
import dayjs from 'dayjs';

import { Meta } from '@components/common';
import { BlogDetailSkeleton } from '@components/common/skeleton';
import { getPosts } from '@/services/postService';
import type { PostData } from '@/types/post';

const { Text, Title } = Typography;

const PAGE_SIZE = 10;

const normalize = (v?: string): string =>
    (v || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();

const BlogPage: React.FC = () => {
    const { domain = '' } = useParams<{ domain: string }>();
    const [loading, setLoading] = useState(true);
    const [posts, setPosts] = useState<PostData[]>([]);
    const [page, setPage] = useState(1);

    useEffect(() => {
        setLoading(true);
        setPage(1);
        getPosts()
            .then((list) => setPosts(list.filter((p) => normalize(p.blogDomainName) === normalize(domain) || normalize(p.blogAddress) === normalize(domain))))
            .catch(() => setPosts([]))
            .finally(() => setLoading(false));
    }, [domain]);

    const siteName = useMemo(() => {
        const hit = posts.find((p) => p.blogName);
        return hit ? hit.blogName.trim() : domain;
    }, [posts, domain]);

    const pageList = posts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    if (loading) {
        return (
            <>
                <Meta />
                <BlogDetailSkeleton />
            </>
        );
    }

    return (
        <>
            <Meta meta={{ title: `${siteName} - 兴汉同盟`, keywords: siteName, description: `${siteName} 的博客文章列表` }} />
            <Flex vertical gap={16}>
                <div>
                    <Link to="/blogs">
                        <Button type="link" className="back-link">
                            返回博客广场
                        </Button>
                    </Link>
                </div>
                <Flex align="center" gap={12} wrap>
                    <Avatar shape="square" size={48}>{(siteName || '?').slice(0, 1)}</Avatar>
                    <Flex vertical>
                        <Title level={4} className="blog-site-name">{siteName}</Title>
                        <Text type="secondary">{domain}</Text>
                    </Flex>
                    <Tag color="blue">{posts.length} 篇文章</Tag>
                </Flex>
                {posts.length === 0 ? (
                    <Empty description="该站点暂无聚合文章" />
                ) : (
                    <>
                        <List
                            itemLayout="vertical"
                            dataSource={pageList}
                            rowKey={(p) => p.link || p.title}
                            renderItem={(p) => (
                                <List.Item
                                    key={p.link || p.title}
                                    actions={[
                                        <Text type="secondary" key="time">
                                            {p.publishedAt ? dayjs(p.publishedAt).format('YYYY-MM-DD HH:mm') : ''}
                                        </Text>,
                                    ]}
                                >
                                    <List.Item.Meta
                                        title={
                                            <a href={p.link} target="_blank" rel="noreferrer noopener">
                                                {p.title || '无标题'}
                                            </a>
                                        }
                                    />
                                    {p.description ? (
                                        <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }} className="post-summary">
                                            {p.description}
                                        </Typography.Paragraph>
                                    ) : null}
                                </List.Item>
                            )}
                        />
                        {posts.length > PAGE_SIZE ? (
                            <Flex justify="center">
                                <Pagination
                                    current={page}
                                    pageSize={PAGE_SIZE}
                                    total={posts.length}
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

export default BlogPage;
