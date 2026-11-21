import React from 'react';
import { Card, Flex } from 'antd';

import Skeleton from './Skeleton';

/** 专栏详情骨架：按 ColumnDetailPage 真实 DOM —— 专栏头卡（方图+名称+描述+胶囊）+ 文章列表 */
export default function ColumnDetailSkeleton(): React.JSX.Element {
    return (
        <div className="sk-page">
            <Card>
                <Flex gap={16} align="center" wrap>
                    <Skeleton className="sk-avatar-square-72" />
                    <Flex vertical gap={8} className="detail-main">
                        <Skeleton className="sk-line" style={{ width: 180, height: 20 }} />
                        <Skeleton className="sk-line sk-line-long" />
                        <Flex gap={8} wrap>
                            <Skeleton className="sk-chip" style={{ width: 72 }} />
                            <Skeleton className="sk-chip" style={{ width: 96 }} />
                        </Flex>
                    </Flex>
                </Flex>
            </Card>
            <Card title="专栏文章">
                <Flex vertical gap={12}>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Flex key={i} gap={10} align="center">
                            <Skeleton className="sk-avatar-square-40" />
                            <Flex vertical gap={6} style={{ flex: 1 }}>
                                <Skeleton className="sk-line sk-line-mid" />
                                <Skeleton className="sk-line sk-line-short" />
                            </Flex>
                        </Flex>
                    ))}
                </Flex>
            </Card>
        </div>
    );
}
