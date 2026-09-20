import React from 'react';
import Skeleton from './Skeleton';

// 博客详情骨架：左侧大图占位 + 右侧标题/正文多行占位
export default function BlogDetailSkeleton() {
    return (
        <div className="sk-detail">
            <Skeleton className="sk-detail-img" />
            <div className="sk-detail-body">
                <Skeleton className="sk-line sk-line-title" />
                <Skeleton className="sk-line sk-line-mid" />
                <Skeleton className="sk-line" />
                <Skeleton className="sk-line" />
                <Skeleton className="sk-line sk-line-long" />
                <Skeleton className="sk-line" />
                <Skeleton className="sk-line sk-line-short" />
            </div>
        </div>
    );
}
