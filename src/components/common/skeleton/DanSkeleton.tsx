import React from 'react';
import Skeleton from './Skeleton';

// 单页骨架：标题占位 + 多段正文行占位
export default function DanSkeleton() {
    return (
        <div className="sk-dan">
            <Skeleton className="sk-line sk-dan-title" />
            <div className="sk-dan-body">
                {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton
                        className={`sk-line ${i % 3 === 2 ? 'sk-line-short' : ''}`}
                        key={i}
                    />
                ))}
            </div>
        </div>
    );
}
