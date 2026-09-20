import React from 'react';
import Skeleton from './Skeleton';

// 首页骨架：顶部横幅条 + 搜索框条 + 卡片栅格（每行 2-3 个圆角块）
export default function HomeSkeleton() {
    return (
        <div className="sk-home">
            <Skeleton className="sk-home-banner" />
            <Skeleton className="sk-home-search" />
            <div className="sk-grid sk-grid-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div className="sk-card" key={i}>
                        <Skeleton className="sk-card-img" />
                        <Skeleton className="sk-line sk-line-long" />
                        <Skeleton className="sk-line sk-line-mid" />
                    </div>
                ))}
            </div>
        </div>
    );
}
