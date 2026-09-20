import React, { useEffect, useState } from 'react';
import { Flex, Typography, Empty } from 'antd';
import { Link } from 'react-router-dom';

import { SearchBox, Meta, MainContentHeader } from '@components/common';
import { BlogsSkeleton } from '@components/common/skeleton';
import { getWebsites, type WebsiteItem } from '@/services/userCenter';
import { getURLParameter } from '@/utils/CommonUtil';

const { Text } = Typography;

const siteDomain = (w: WebsiteItem): string => w.www || w.domain || (w.url ? w.url.replace(/^https?:\/\//, '').replace(/\/.*$/, '') : '') || '';

const meta = {
    title: '博客广场 - 兴汉同盟 · 博客人的朋友圈！',
    keywords: '博客广场, 博客列表',
    description: '展示兴汉同盟所收录的全部博客。',
};

const BlogsPage: React.FC = () => {
    const keyword = getURLParameter('keyword') || '';
    const [loading, setLoading] = useState(true);
    const [sites, setSites] = useState<WebsiteItem[]>([]);

    useEffect(() => {
        setLoading(true);
        getWebsites({ keyword })
            .then((r) => {
                if (r.code === 1 && r.data) setSites(r.data);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [keyword]);

    return (
        <>
            <Meta meta={meta} />
            <Flex vertical gap={16}>
                <MainContentHeader content="博客广场" />
                <SearchBox placeholder="搜索站点 ↵" gotoPage="/blogs" />
                {loading ? (
                    <BlogsSkeleton />
                ) : sites.length === 0 ? (
                    <Empty description="未找到相关站点，试试更换关键词吧！" />
                ) : (
                    <div className="website-grid">
                        {sites.map((w) => {
                            const domain = siteDomain(w);
                            return (
                                <Link to={`/blogs/${domain}`} key={w.id ?? domain} className="website-card">
                                    <div className="website-card-head">
                                        {w.ico || w.pic ? (
                                            <img className="website-card-ico" src={w.ico || w.pic} alt={w.title || w.name || ''} />
                                        ) : null}
                                        <span className="website-card-title">{w.title || w.name || '未命名站点'}</span>
                                    </div>
                                    {w.keywords ? <div className="website-card-keywords">{w.keywords}</div> : null}
                                    <div className="website-card-meta">
                                        <span>浏览 {w.view ?? 0}</span>
                                        <span>点赞 {w.zan ?? 0}</span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </Flex>
        </>
    );
};

export default BlogsPage;
