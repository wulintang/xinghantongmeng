import React from 'react';
import { Skeleton } from 'antd';

export default function AbstractSkeleton() {
  return (
    <div className="feed-timeline-item abstract-timeline-item">
      <div className="feed-author-col">
        <Skeleton.Avatar active shape="circle" size={36} />
        <Skeleton.Input active size="small" className="sk-abs-name" />
      </div>
      <div className="feed-bubble">
        <div className="feed-bubble-inner">
          <Skeleton active title={{ width: '60%' }} paragraph={{ rows: 3 }} />
        </div>
      </div>
    </div>
  );
}
