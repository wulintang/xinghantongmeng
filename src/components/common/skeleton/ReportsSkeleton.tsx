import React from 'react';
import { Skeleton } from 'antd';

export default function ReportsSkeleton() {
  return (
    <div className="sk-list">
      {Array.from({ length: 4 }).map((_, i) => (
        <div className="sk-list-row" key={i}>
          <Skeleton active title={{ width: '50%' }} paragraph={{ rows: 2, width: ['40%', '80%'] }} />
        </div>
      ))}
    </div>
  );
}
