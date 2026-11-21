import React from 'react';
import { Flex } from 'antd';

import Skeleton from './Skeleton';

/** 消息列表骨架：按 MessagesPage 真实 DOM —— 头像 + 标题 + 一行摘要 */
export default function MessagesSkeleton(): React.JSX.Element {
    return (
        <div className="sk-list">
            {Array.from({ length: 5 }).map((_, i) => (
                <div className="sk-list-row" key={i}>
                    <Flex gap={12} align="flex-start">
                        <Skeleton className="sk-avatar-circle-36" />
                        <Flex vertical gap={8} style={{ flex: 1 }}>
                            <Skeleton className="sk-line" style={{ width: '30%' }} />
                            <Skeleton className="sk-line sk-line-long" />
                        </Flex>
                    </Flex>
                </div>
            ))}
        </div>
    );
}
