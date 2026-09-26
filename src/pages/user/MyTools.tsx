import React from 'react';
import { Card, Empty } from 'antd';
import { usePageMeta } from '@/hooks/usePageMeta';

export default function MyToolsPage() {
  usePageMeta({ title: '我的工具' });
  return (
    <Card className="user-center-card">
      <Empty description="工具功能开发中，敬请期待。" />
    </Card>
  );
}
