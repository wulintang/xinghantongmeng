import React, { useEffect, useState } from 'react';
import { Card, Col, Empty, Flex, Row, Skeleton, Tabs, Typography } from 'antd';
import { Link, useSearchParams } from 'react-router-dom';

import { PageHeader, SearchBox } from '@components/common';
import { getWebsites, getArticles, getTools } from '@/services/userCenter';
import { getMallList } from '@/services/shop';
import { domainOf } from '@/utils/route';

const { Text } = Typography;

type SearchType = 'site' | 'article' | 'tool' | 'mall';

const FETCHERS: Record<SearchType, (keyword: string) => Promise<any>> = {
    site: (keyword) => getWebsites({ keyword, page: 1, limit: 24 }),
    article: (keyword) => getArticles({ keyword, page: 1, limit: 24 }),
    tool: (keyword) => getTools({ keyword, page: 1, limit: 24 }),
    mall: (keyword) => getMallList({ kw: keyword, page: 1, limit: 24 }),
};

const TAB_LABELS: Record<SearchType, string> = {
    site: '网址',
    article: '文章',
    tool: '技能',
    mall: '集市',
};

const TAB_ORDER: SearchType[] = ['site', 'article', 'tool', 'mall'];

function ResultCard({ type, item }: { type: SearchType; item: any }): React.ReactNode {
    const title = item?.title || item?.name || '未命名';
    const pic = item?.pic || item?.ico || item?.cover || item?.image || undefined;
    const desc =
        item?.summary ||
        item?.description ||
        item?.content ||
        item?.keywords ||
        item?.domain ||
        item?.price ||
        '';

    const to =
        type === 'site'
            ? `/${domainOf(item)}`
            : type === 'article'
              ? `/article/detail/${item?.id}`
              : type === 'tool'
                ? `/tools/${item?.id}`
                : `/shop/goods/${item?.id}`;

    return (
        <Card className="search-result-card" hoverable>
            <Link to={to} className="search-result-link">
                <Flex gap={12} align="flex-start">
                    {pic ? (
                        <img src={pic} alt={title} className="search-result-pic" />
                    ) : (
                        <div className="search-result-pic search-result-pic--ph">{title.slice(0, 1)}</div>
                    )}
                    <Flex vertical gap={4} className="search-result-body">
                        <Text strong className="search-result-title" ellipsis>
                            {title}
                        </Text>
                        <Text type="secondary" ellipsis className="search-result-desc">
                            {String(desc).slice(0, 60)}
                        </Text>
                    </Flex>
                </Flex>
            </Link>
        </Card>
    );
}

function TabContent({ type, keyword }: { type: SearchType; keyword: string }): React.ReactNode {
    const [loading, setLoading] = useState(false);
    const [list, setList] = useState<any[]>([]);

    useEffect(() => {
        if (!keyword) {
            setList([]);
            return;
        }
        let alive = true;
        setLoading(true);
        FETCHERS[type](keyword)
            .then((r) => {
                if (!alive) return;
                if (r?.code === 1) setList(Array.isArray(r.data?.list) ? r.data.list : []);
                else setList([]);
            })
            .catch(() => alive && setList([]))
            .finally(() => alive && setLoading(false));
        return () => {
            alive = false;
        };
    }, [type, keyword]);

    if (!keyword) {
        return <Empty description="请输入关键词开始搜索" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    }
    if (loading) {
        return (
            <Row gutter={[16, 16]}>
                {Array.from({ length: 8 }).map((_, i) => (
                    <Col key={i} xs={12} sm={12} md={8} lg={6}>
                        <Card>
                            <Skeleton active avatar paragraph={{ rows: 1 }} />
                        </Card>
                    </Col>
                ))}
            </Row>
        );
    }
    if (list.length === 0) {
        return <Empty description={`没有找到相关${TAB_LABELS[type]}`} />;
    }
    return (
        <Row gutter={[16, 16]}>
            {list.map((item) => (
                <Col key={item?.id ?? Math.random()} xs={12} sm={12} md={8} lg={6}>
                    <ResultCard type={type} item={item} />
                </Col>
            ))}
        </Row>
    );
}

const SearchPage: React.FC = () => {
    const [params] = useSearchParams();
    const keyword = (params.get('keyword') || '').trim();

    const items = TAB_ORDER.map((type) => ({
        key: type,
        label: TAB_LABELS[type],
        children: <TabContent type={type} keyword={keyword} />,
    }));

    return (
        <Flex vertical gap={20}>
            <PageHeader title="全站搜索" description="一次检索：网址、文章、技能与集市商品">
                <div className="home-hero-search" style={{ width: '100%', maxWidth: 560 }}>
                    <SearchBox placeholder="搜索站点、文章、技能、集市商品" gotoPage="/search" />
                </div>
            </PageHeader>

            <Tabs defaultActiveKey="site" items={items} destroyInactiveTabPane={false} />
        </Flex>
    );
};

export default SearchPage;
