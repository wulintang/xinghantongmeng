import React from 'react';
import { Card, Flex } from 'antd';

import Skeleton from './Skeleton';

/** 博客/站点聚合详情骨架：站点信息条 + 文章列表卡（未被页面直接引用，保持真实结构风格） */
export default function BlogDetailSkeleton(): React.JSX.Element {
    return (
        <Flex vertical gap={16}>
            <Card size="small">
                <Flex gap={12} align="center">
                    <Skeleton className="sk-avatar-square-48" />
                    <Flex vertical gap={8} style={{ flex: 1 }}>
                        <Skeleton className="sk-line sk-line-mid" />
                        <Skeleton className="sk-line sk-line-short" />
                    </Flex>
                </Flex>
            </Card>
            {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} size="small">
                    <Flex vertical gap={8}>
                        <Skeleton className="sk-line sk-line-mid" />
                        <Skeleton className="sk-line sk-line-long" />
                    </Flex>
                </Card>
            ))}
        </Flex>
    );
}
