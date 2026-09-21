import React from 'react';
import { Skeleton } from 'antd';

export default function MessagesSkeleton() {
  return (
    <div className="sk-list">
      {Array.from({ length: 5 }).map((_, i) => (
        <div className="sk-list-row" key={i}>
          <Skeleton active avatar={{ size: 36 }} title={{ width: '30%' }} paragraph={{ rows: 1, width: ['70%'] }} />
        </div>
      ))}
    </div>
  );
}
