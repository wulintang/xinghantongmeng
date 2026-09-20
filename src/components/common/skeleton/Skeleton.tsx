import React from 'react';

interface SkeletonProps {
    className?: string;
}

// 通用 shimmer 占位块（样式见 styles.css .skeleton）
export default function Skeleton({ className = '' }: SkeletonProps) {
    return <div className={`skeleton ${className}`} />;
}
