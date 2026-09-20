import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Avatar, Button, Card, Flex, List, Pagination, Tag, Typography } from 'antd';
import { Link, useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';

import { PageHeader } from '@components/common';
import { BlogDetailSkeleton } from '@components/common/skeleton';
import { usePageMeta } from '@/hooks/usePageMeta';
import { getPosts } from '@/services/postService';
import type { PostData } from '@/types/post';

const { Text, Paragraph } = Typography;

const PAGE_SIZE = 10;

const normalize = (v?: string): string =>
    (v || '').replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toLowerCase();

const BlogPage: React.FC = () => {
    const { domain = '' } = useParams<{ domain: string }>();
    const navigate = useNavigate();
    const target = normalize(decodeURIComponent(domain));

    const [loading, setLoading] = useState(true);
    const [all, setAll] = useState<PostData[]>([]);
    const [page, setPage] = useState(1);

    const posts = useMemo(
        () => all.filter((p) => normalize(p.blogDomainName) === target || normalize(p.blogAddress) === target),
        [all, target]
    );

    const siteName = useMemo(() => {
        const hit = posts.find((p) => p.blogName);
        return hit ? hit.blogName.trim() : domain;
    }, [posts, domain]);

    usePageMeta({
        title: siteName || '博客详情',
        description: `${siteName} 的聚合博文列表`,
    });

    useEffect(() => {
        let alive = true;
        setLoading(true);
        setPage(1);
        getPosts()
            .then((list) => {
                if (alive) setAll(list);
            })
            .catch(() => {
                if (alive) setAll([]);
            })
            .finally(() => {
                if (alive) setLoading(false);
            });
        return () => {
            alive = false;
        };
    }, [target]);

    const pageList = posts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    if (loading) return <BlogDetailSkeleton />;

    return (
        <Flex vertical gap={20}>
            <PageHeader
                title={siteName}
                description={domain}
                crumbs={[
                    { label: '首页', to: '/home' },
                    { label: '博客广场', to: '/blogs' },
                    { label: siteName },
                ]}
                extra={<Button onClick={() => navigate('/blogs')}>返回博客广场</Button>}
            />

            <Flex align="center" gap={12} wrap>
                <Tag color="blue">{posts.length} 篇聚合博文</Tag>
                {posts[0]?.blogStatusOk === false ? <Tag color="red">源站异常</Tag> : null}
            </Flex>

            {posts.length === 0 ? (
                <Alert type="info" showIcon message="该站点暂无聚合博文" description="可能尚未采集，或该域名不在收录名单中。" />
            ) : (
                <>
                    <Card>
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
                                        avatar={
                                            <Avatar
                                                shape="square"
                                                src={p.blogAdminMediumImageURL || p.blogAdminLargeImageURL || undefined}
                                            >
                                                {(p.blogName || '?').trim().slice(0, 1)}
                                            </Avatar>
                                        }
                                        title={
                                            <a href={p.link} target="_blank" rel="noreferrer">
                                                {p.title || '无标题'}
                                            </a>
                                        }
                                        description={
                                            <Link to="/blogs">
                                                <Text type="secondary">来自 {p.blogDomainName}</Text>
                                            </Link>
                                        }
                                    />
                                    {p.description ? (
                                        <Paragraph type="secondary" ellipsis={{ rows: 3 }} className="post-summary">
                                            {p.description}
                                        </Paragraph>
                                    ) : null}
                                </List.Item>
                            )}
                        />
                    </Card>
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
    );
};

export default BlogPage;
