import React from 'react';
import { Flex } from 'antd';

import Skeleton from './Skeleton';

/** 文章资讯骨架：分类胶囊 + 纵向文章条目（标题 + 摘要 + 元信息） */
export default function ArticlesSkeleton(): React.JSX.Element {
    return (
        <div className="sk-page">
            <Flex wrap gap={8} className="cate-filter-wrap">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="sk-chip" style={{ width: 64 + (i % 3) * 20 }} />
                ))}
            </Flex>
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="sk-list-item">
                    <Flex vertical gap={8}>
                        <Skeleton className="sk-line" style={{ width: '50%', height: 16 }} />
                        <Skeleton className="sk-line sk-line-long" />
                        <Skeleton className="sk-line sk-line-mid" />
                        <Skeleton className="sk-line sk-line-short" />
                    </Flex>
                </div>
            ))}
        </div>
    );
}
