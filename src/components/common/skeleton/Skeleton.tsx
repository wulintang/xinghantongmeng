import React from 'react';

interface SkeletonProps {
    className?: string;
    style?: React.CSSProperties;
}

// 通用 shimmer 占位块（样式见 styles.css .skeleton），支持 className + style 精确控制尺寸
export default function Skeleton({ className = '', style }: SkeletonProps) {
    return <div className={`skeleton ${className}`} style={style} />;
}
