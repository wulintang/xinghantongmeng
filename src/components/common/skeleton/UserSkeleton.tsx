import React from 'react';
import Skeleton from './Skeleton';

// 用户中心骨架：左侧菜单条 + 右侧资料卡占位
export default function UserSkeleton() {
    return (
        <div className="sk-user">
            <div className="sk-user-menu">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton className="sk-line sk-user-menu-item" key={i} />
                ))}
            </div>
            <div className="sk-user-card">
                <Skeleton className="sk-user-avatar" />
                <Skeleton className="sk-line sk-line-long" />
                <Skeleton className="sk-line" />
                <Skeleton className="sk-line sk-line-mid" />
                <Skeleton className="sk-line" />
            </div>
        </div>
    );
}
