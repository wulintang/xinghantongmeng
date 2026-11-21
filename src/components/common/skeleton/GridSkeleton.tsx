import React from 'react';
import { Flex } from 'antd';

import Skeleton from './Skeleton';

/** 格子广告骨架：按 GridPage 真实 DOM —— 格子画布 + 说明文字 */
export default function GridSkeleton(): React.JSX.Element {
    return (
        <div className="sk-page grid-page">
            <Skeleton className="sk-block" style={{ height: 360, borderRadius: 12 }} />
            <Flex vertical gap={10}>
                <Skeleton className="sk-line sk-line-long" />
                <Skeleton className="sk-line sk-line-mid" />
            </Flex>
        </div>
    );
}
