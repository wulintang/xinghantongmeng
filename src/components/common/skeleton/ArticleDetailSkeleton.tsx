import React from 'react';
import { Card, Flex } from 'antd';

import Skeleton from './Skeleton';

/** 文章详情骨架：大标题 + 元信息行 + 正文段落卡 */
export default function ArticleDetailSkeleton(): React.JSX.Element {
    return (
        <div className="sk-page">
            <Card>
                <Flex vertical gap={12}>
                    <Skeleton className="sk-line" style={{ width: '60%', height: 24 }} />
                    <Skeleton className="sk-line sk-line-short" />
                </Flex>
            </Card>
            <Card>
                <Flex vertical gap={10}>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="sk-line sk-line-long" />
                    ))}
                </Flex>
            </Card>
        </div>
    );
}
