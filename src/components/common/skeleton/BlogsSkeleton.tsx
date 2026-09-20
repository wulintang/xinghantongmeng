import React from 'react';
import { Card, Flex, Skeleton } from 'antd';

// 博客广场骨架屏：博文列表形态（与 BlogsPage 的 List 一一对应）
export default function BlogsSkeleton() {
    return (
        <Flex vertical gap={16}>
            {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} size="small">
                    <Skeleton avatar active paragraph={{ rows: 2 }} />
                </Card>
            ))}
        </Flex>
    );
}
