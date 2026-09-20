import React from 'react';
import { Skeleton } from 'antd';

/** 文章资讯骨架：分类条 + 纵向文章条目 */
export default function ArticlesSkeleton(): React.JSX.Element {
    return (
        <div className="sk-page">
            <Skeleton active title={{ width: '20%' }} paragraph={{ rows: 1, width: ['40%'] }} />
            <Skeleton.Button active className="sk-filter" />
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="sk-list-item">
                    <Skeleton active title={{ width: '50%' }} paragraph={{ rows: 2 }} />
                </div>
            ))}
        </div>
    );
}
