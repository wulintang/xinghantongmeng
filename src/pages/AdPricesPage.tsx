import React, { useEffect, useState } from 'react';
import { Card, Spin, Typography, message } from 'antd';
import { getPrices, type AdPayPosition, type AdPayGridConfig } from '@/services/adpay';
import { usePageMeta } from '@/hooks/usePageMeta';
import { PageHeader } from '@components/common';
import CardTable from '@/components/common/CardTable';

const { Title, Paragraph } = Typography;

export default function AdPricesPage(): React.JSX.Element {
  usePageMeta({ title: '广告价格单' });
  const [loading, setLoading] = useState(true);
  const [positions, setPositions] = useState<AdPayPosition[]>([]);
  const [grids, setGrids] = useState<AdPayGridConfig[]>([]);

  useEffect(() => {
    getPrices()
      .then((r) => {
        if (r.code === 1 && r.data) {
          setPositions(r.data.positions || []);
          setGrids(r.data.grids || []);
        } else {
          message.error(r.msg || '加载失败');
        }
      })
      .catch(() => message.error('加载失败'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin style={{ display: 'block', margin: '40px auto' }} />;

  const posColumns = [
    { title: '广告位', dataIndex: 'name' },
    { title: '页面/位置', render: (_: any, r: AdPayPosition) => `${r.page} / ${r.location}` },
    { title: '日价', dataIndex: 'price_day', render: (v: string) => `¥${v}` },
    { title: '周价', dataIndex: 'price_week', render: (v: string) => `¥${v}` },
    { title: '月价', dataIndex: 'price_month', render: (v: string) => `¥${v}` },
    { title: '季价', dataIndex: 'price_quarter', render: (v: string) => `¥${v}` },
    { title: '年价', dataIndex: 'price_year', render: (v: string) => `¥${v}` },
  ];
  const gridColumns = [
    { title: '页面', dataIndex: 'page', render: (v: string) => (v === 'home' ? '首页底部' : '格子单页') },
    { title: '画布(列×行)', render: (_: any, r: AdPayGridConfig) => `${r.cols}×${r.rows}` },
    { title: '每格月价', dataIndex: 'price_per_cell', render: (v: string) => `¥${v}` },
  ];

  return (
    <div className="ad-prices-page">
      <PageHeader
        title="广告价格单"
        description="系统广告位按页面独立定价；格子广告为虚拟 1×1 单元格画布，每格统一月价，用户可框选任意矩形区域投放（单价 × 格子数 × 月数 = 总价）。"
        crumbs={[{ label: '首页', to: '/' }, { label: '广告价格单', to: '/dan/ad' }]}
      />

      <Card title="系统广告位" style={{ marginBottom: 'var(--page-gap)' }}>
        <CardTable<AdPayPosition>
          rowKey="pkey"
          dataSource={positions}
          columns={posColumns}
          pagination={false}
          locale={{ emptyText: '暂无广告位' }}
        />
      </Card>

      <Card title="格子广告">
        <CardTable<AdPayGridConfig>
          rowKey="page"
          dataSource={grids}
          columns={gridColumns}
          pagination={false}
          locale={{ emptyText: '暂无格子广告' }}
        />
      </Card>
    </div>
  );
}
