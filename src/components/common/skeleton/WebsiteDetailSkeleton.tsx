import React from 'react';
import { Skeleton } from 'antd';

/** 网址详情骨架：站点头（图标+标题+域名）+ 正文 + 相关推荐 */
export default function WebsiteDetailSkeleton(): React.JSX.Element {
    return (
        <div className="sk-page">
            <div className="sk-detail-head">
                <Skeleton avatar={{ shape: 'square', size: 64 }} active title paragraph={{ rows: 2 }} />
            </div>
            <Skeleton active title={false} paragraph={{ rows: 4 }} />
            <Skeleton active title={{ width: '25%' }} paragraph={{ rows: 1, width: ['30%'] }} />
            <div className="sk-detail-grid">
                <div className="sk-card">
                    <Skeleton active title paragraph={{ rows: 1 }} />
                </div>
                <div className="sk-card">
                    <Skeleton active title paragraph={{ rows: 1 }} />
                </div>
            </div>
        </div>
    );
}
