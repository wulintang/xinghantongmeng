import React from 'react';
import { Skeleton } from 'antd';

/** 工具详情骨架：工具头 + 说明正文 + 操作按钮 */
export default function ToolDetailSkeleton(): React.JSX.Element {
    return (
        <div className="sk-page">
            <div className="sk-detail-head">
                <Skeleton avatar={{ shape: 'square', size: 56 }} active title paragraph={{ rows: 1 }} />
            </div>
            <Skeleton active title={{ width: '22%' }} paragraph={{ rows: 5 }} />
            <Skeleton.Button active size="large" />
        </div>
    );
}
