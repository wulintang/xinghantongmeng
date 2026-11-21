import React from 'react';
import { Flex } from 'antd';

import Skeleton from './Skeleton';

/** 聚合文章详情骨架：按 AbstractPage 真实 DOM —— feed-timeline-item（作者列 + feed-bubble 气泡正文） */
export default function AbstractSkeleton(): React.JSX.Element {
    return (
        <div className="feed-timeline-item abstract-timeline-item">
            <Flex vertical align="center" gap={6} className="feed-author-col">
                <Skeleton className="sk-avatar-circle-36" />
                <Skeleton className="sk-line" style={{ width: 40, height: 10 }} />
            </Flex>
            <div className="feed-bubble">
                <div className="feed-bubble-inner">
                    <Skeleton className="sk-feed-line" style={{ width: '55%', height: 18 }} />
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="sk-feed-line sk-line-long" />
                    ))}
                </div>
            </div>
        </div>
    );
}
