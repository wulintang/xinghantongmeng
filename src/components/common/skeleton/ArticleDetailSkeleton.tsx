import React from 'react';
import { Skeleton } from 'antd';

/** 文章详情骨架：大标题 + 元信息行 + 正文段落 */
export default function ArticleDetailSkeleton(): React.JSX.Element {
    return (
        <div className="sk-page">
            <Skeleton active title={{ width: '60%' }} paragraph={{ rows: 1, width: ['35%'] }} />
            <Skeleton active title={false} paragraph={{ rows: 8 }} />
        </div>
    );
}
