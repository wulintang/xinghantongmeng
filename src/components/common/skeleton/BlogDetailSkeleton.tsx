import React from 'react';
import { Card, Flex, Skeleton } from 'antd';

// 博客详情骨架屏：站点信息条 + 该站博文列表（与 BlogPage 结构一一对应）
export default function BlogDetailSkeleton() {
    return (
        <Flex vertical gap={16}>
            <Card size="small">
                <Skeleton avatar active paragraph={{ rows: 1 }} />
            </Card>
            {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} size="small">
                    <Skeleton active paragraph={{ rows: 2 }} />
                </Card>
            ))}
        </Flex>
    );
}
