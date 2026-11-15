import React from 'react';
import { Skeleton } from 'antd';

/** 格子广告骨架：画布占位 + 说明文字 */
export default function GridSkeleton(): React.JSX.Element {
    return (
        <div className="sk-page grid-page">
            <Skeleton.Image active className="u-w-100 u-h-360px u-radius-12px" />
            <Skeleton active title={false} paragraph={{ rows: 2, width: ['60%', '40%'] }} className="u-mt-16px" />
        </div>
    );
}
