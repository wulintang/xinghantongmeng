import React from 'react';
import { Flex } from 'antd';

import Skeleton from './Skeleton';

/** 举报记录骨架：按 ReportsPage 真实 DOM —— 标题 + 两行内容 + 状态胶囊 */
export default function ReportsSkeleton(): React.JSX.Element {
    return (
        <div className="sk-list">
            {Array.from({ length: 4 }).map((_, i) => (
                <div className="sk-list-row" key={i}>
                    <Flex vertical gap={8}>
                        <Skeleton className="sk-line" style={{ width: '50%', height: 16 }} />
                        <Skeleton className="sk-line sk-line-long" />
                        <Skeleton className="sk-line sk-line-mid" />
                        <Skeleton className="sk-chip" style={{ width: 56 }} />
                    </Flex>
                </div>
            ))}
        </div>
    );
}
