import { Card, Flex } from 'antd';

import { SearchBox, SwitchSortType, Meta, HotSearch } from '@components/common';
import { BlogsMainContentHeader, BlogCardList } from '@components/blogs';
import { MetaFields, SwitchType } from '@types';

const meta: MetaFields = {
    title: '博客广场 - 兴汉同盟 · 博客人的朋友圈！',
    keywords: '博客广场, 博客列表',
    description: '展示兴汉同盟所收录的全部博客。'
};

const SWITCH_TYPES = [
    { name: '最近收录', href: '/blogs', default: true },
    { name: '最多浏览', href: '/blogs?sort=access_count', default: false },
] as const satisfies readonly SwitchType[];

export default function BlogsPage() {
    return (
        <>
            <Meta meta={meta} />
            <Flex vertical gap={16}>
                <BlogsMainContentHeader />
                <Flex vertical gap={16}>
                    <SearchBox placeholder="搜索博客 ↵" gotoPage="/blogs" />
                    {/* <HotSearch label="大家在找啥" title="2025 年度报告" link="/annual-reports/2025" /> */}
                    <SwitchSortType types={SWITCH_TYPES} />
                    <BlogCardList />
                </Flex>
            </Flex>
        </>
    );
}