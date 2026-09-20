import React from 'react';
import Skeleton from './Skeleton';

// 博客列表骨架：筛选条 + 卡片栅格（每行 3-4 个方块，含图占位+两行文字占位）
export default function BlogsSkeleton() {
    return (
        <div className="sk-blogs">
            <Skeleton className="sk-blogs-filter" />
            <div className="sk-grid sk-grid-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div className="sk-blog-card" key={i}>
                        <Skeleton className="sk-blog-card-img" />
                        <Skeleton className="sk-line sk-line-long" />
                        <Skeleton className="sk-line sk-line-short" />
                    </div>
                ))}
            </div>
        </div>
    );
}
