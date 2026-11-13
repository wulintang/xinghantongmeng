import React from 'react';
import { Skeleton } from 'antd';

/** 格子广告骨架：画布占位 + 说明文字 */
export default function GridSkeleton(): React.JSX.Element {
    return (
        <div className="sk-page grid-page">
            <Skeleton.Image active style={{ width: '100%', height: 360, borderRadius: 12 }} />
            <Skeleton active title={false} paragraph={{ rows: 2, width: ['60%', '40%'] }} style={{ marginTop: 16 }} />
        </div>
    );
}
