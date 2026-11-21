import React from 'react';
import { Flex } from 'antd';

import Skeleton from './Skeleton';

/** 友情链接骨架：按 LinksPage 真实 DOM —— 链接卡片列表（头像 + 名称 + 描述 + 访问胶囊） */
export default function LinksSkeleton(): React.JSX.Element {
    return (
        <div className="sk-list">
            {Array.from({ length: 4 }).map((_, i) => (
                <div className="sk-list-row" key={i}>
                    <Flex gap={12} align="center">
                        <Skeleton className="sk-avatar-square-48" />
                        <Flex vertical gap={8} style={{ flex: 1 }}>
                            <Skeleton className="sk-line" style={{ width: 160, height: 16 }} />
                            <Skeleton className="sk-line sk-line-mid" />
                        </Flex>
                        <Skeleton className="sk-chip" style={{ width: 64 }} />
                    </Flex>
                </div>
            ))}
        </div>
    );
}
