import React from 'react';
import { Card, Flex } from 'antd';

import Skeleton from './Skeleton';

/** 技能详情骨架：按 ToolDetailPage 真实 DOM —— 技能头卡 + 说明 + 使用技能/在线使用/技能信息卡 */
export default function ToolDetailSkeleton(): React.JSX.Element {
    return (
        <div className="sk-page">
            <Card>
                <Flex gap={20} align="flex-start" wrap>
                    <Skeleton className="sk-avatar-square-56" />
                    <Flex vertical gap={10} className="detail-main">
                        <Skeleton className="sk-line" style={{ width: 200, height: 20 }} />
                        <Skeleton className="sk-line sk-line-mid" />
                        <Skeleton className="sk-line sk-line-short" />
                    </Flex>
                </Flex>
            </Card>
            <Card title="技能介绍">
                <Flex vertical gap={10}>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="sk-line sk-line-long" />
                    ))}
                </Flex>
            </Card>
            <Card title="技能信息">
                <Flex vertical gap={12}>
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Flex key={i} gap={16} align="center">
                            <Skeleton className="sk-line" style={{ width: 72 }} />
                            <Skeleton className="sk-line" style={{ width: 160 }} />
                        </Flex>
                    ))}
                </Flex>
            </Card>
        </div>
    );
}
