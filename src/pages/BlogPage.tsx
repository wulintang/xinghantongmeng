import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Flex, Typography, Empty } from 'antd';

import { Meta } from '@components/common';
import { BlogDetailSkeleton } from '@components/common/skeleton';
import { getWebsites, getLinks, type WebsiteItem, type LinkItem } from '@/services/userCenter';

const { Text, Link: TLink } = Typography;

const normalize = (v?: string): string => (v || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();

const BlogPage: React.FC = () => {
    const { domain } = useParams<{ domain: string }>();
    const [loading, setLoading] = useState(true);
    const [site, setSite] = useState<WebsiteItem | null>(null);
    const [friends, setFriends] = useState<LinkItem[]>([]);

    useEffect(() => {
        if (!domain) {
            setLoading(false);
            return;
        }
        Promise.all([getWebsites(), getLinks()])
            .then(([w, l]) => {
                const list: WebsiteItem[] = w.code === 1 && w.data ? w.data : [];
                const matched =
                    list.find((s) => normalize(s.www) === normalize(domain)) ||
                    list.find((s) => normalize(s.domain) === normalize(domain)) ||
                    list.find((s) => normalize(s.url) === normalize(domain)) ||
                    null;
                setSite(matched);
                if (l.code === 1 && l.data) setFriends(l.data.filter((x) => x.wz === 9));
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [domain]);

    if (loading) {
        return (
            <>
                <Meta />
                <BlogDetailSkeleton />
            </>
        );
    }

    if (!site) {
        return (
            <>
                <Meta />
                <div className="blog-detail-notfound">
                    <Empty description="未找到该站点" />
                </div>
            </>
        );
    }

    const title = site.title || site.name || '未命名站点';

    return (
        <>
            <Meta meta={{ title: `${title} - 兴汉同盟`, keywords: site.keywords || title, description: site.description || title }} />
            <div className="blog-detail-wrap">
                <div className="blog-detail-main">
                    <div className="website-card-head">
                        {site.ico || site.pic ? (
                            <img className="website-card-ico" src={site.ico || site.pic} alt={title} />
                        ) : null}
                        <span className="website-card-title">{title}</span>
                    </div>
                    {site.content ? (
                        <div className="blog-detail-content">{site.content}</div>
                    ) : (
                        <Text type="secondary">该站点暂未提供详细介绍。</Text>
                    )}
                </div>
                {friends.length > 0 && (
                    <div className="blog-detail-friends">
                        <div className="website-card-keywords">友情链接</div>
                        <Flex vertical gap={6}>
                            {friends.map((f) => (
                                <a
                                    key={f.id}
                                    href={f.lianjie}
                                    target={f.xin === 1 ? '_blank' : undefined}
                                    rel={f.xin === 1 ? 'noreferrer' : undefined}
                                >
                                    {f.name}
                                </a>
                            ))}
                        </Flex>
                    </div>
                )}
            </div>
        </>
    );
};

export default BlogPage;
