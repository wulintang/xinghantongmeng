import React from 'react';
import { Flex } from 'antd';

import Skeleton from './Skeleton';

/** 广场骨架：按 BlogsPage 真实 DOM —— feed-timeline-item（作者列 + feed-bubble 气泡） */
export default function BlogsSkeleton(): React.JSX.Element {
    return (
        <Flex vertical gap={16} className="feed-timeline">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="feed-timeline-item">
                    <Flex vertical align="center" gap={6} className="feed-author-col">
                        <Skeleton className="sk-avatar-circle-36" />
                        <Skeleton className="sk-line" style={{ width: 36, height: 10 }} />
                    </Flex>
                    <div className="feed-bubble">
                        <div className="feed-bubble-inner">
                            <Skeleton className="sk-feed-line" style={{ width: '55%' }} />
                            <Skeleton className="sk-feed-line sk-line-long" />
                            <Skeleton className="sk-feed-line sk-line-mid" />
                            <Skeleton className="sk-feed-line sk-line-long" />
                            <Skeleton className="sk-feed-line sk-line-short" />
                        </div>
                    </div>
                </div>
            ))}
        </Flex>
    );
}
