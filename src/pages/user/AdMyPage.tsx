import React, { useEffect, useState } from 'react';
import { Button, Card, Spin, Table, Tag, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getToken } from '@/utils/auth';
import {
  getMyAds,
  getPrices,
  AD_STATUS_TEXT,
  type AdPayApply,
  type AdPayGridApply,
  type AdPayPosition,
} from '@/services/adpay';

const { Title } = Typography;

const STATUS_COLOR: Record<number, string> = {
  0: 'orange',
  1: 'green',
  2: 'red',
  3: 'blue',
  4: 'volcano',
};

export default function AdMyPage(): React.JSX.Element {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [applies, setApplies] = useState<AdPayApply[]>([]);
  const [gridApplies, setGridApplies] = useState<AdPayGridApply[]>([]);
  const [positions, setPositions] = useState<AdPayPosition[]>([]);

  useEffect(() => {
    if (!getToken()) {
      message.warning('请先登录');
      setLoading(false);
      return;
    }
    Promise.all([getMyAds(), getPrices()])
      .then(([my, prices]) => {
        if (my.code === 1 && my.data) {
          setApplies(my.data.applies || []);
          setGridApplies(my.data.gridApplies || []);
        } else if (my.code !== 1) {
          message.error(my.msg || '加载失败');
        }
        if (prices.code === 1 && prices.data) setPositions(prices.data.positions || []);
      })
      .catch(() => message.error('加载失败'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin style={{ display: 'block', margin: '40px auto' }} />;

  return (
    <div className="ad-my-page">
      <Title level={3} style={{ fontSize: 'var(--fs-xl)' }}>
        我的广告
      </Title>

      <Card title="可申请广告位" style={{ marginBottom: 'var(--page-gap)' }}>
        <Table<AdPayPosition>
          rowKey="id"
          dataSource={positions}
          pagination={false}
          locale={{ emptyText: '暂无可申请广告位' }}
          columns={[
            { title: '广告位', dataIndex: 'name' },
            { title: '页面/位置', render: (_: any, r: AdPayPosition) => `${r.page} / ${r.location}` },
            { title: '月价', dataIndex: 'price_month', render: (v: string) => `¥${v}` },
            {
              title: '操作',
              render: (_: any, r: AdPayPosition) => (
                <Button type="link" onClick={() => navigate(`/user/ad/buy?slot=${r.pkey}`)}>
                  申请
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <Card title="系统广告申请" style={{ marginBottom: 'var(--page-gap)' }}>
        <Table<AdPayApply>
          rowKey="id"
          dataSource={applies}
          pagination={false}
          locale={{ emptyText: '暂无申请' }}
          columns={[
            { title: '广告位', dataIndex: 'position_name' },
            { title: '标题', dataIndex: 'title' },
            { title: '时长(天)', dataIndex: 'duration_day' },
            { title: '金额', dataIndex: 'amount', render: (v: string) => `¥${v}` },
            { title: '状态', dataIndex: 'status', render: (s: number) => <Tag color={STATUS_COLOR[s]}>{AD_STATUS_TEXT[s]}</Tag> },
            {
              title: '到期',
              dataIndex: 'end_time',
              render: (t: number) => (t ? new Date(t * 1000).toLocaleDateString() : '-'),
            },
          ]}
        />
      </Card>

      <Card title="格子广告申请" extra={<Button type="link" onClick={() => navigate('/grid')}>去格子广告页</Button>}>
        <Table<AdPayGridApply>
          rowKey="id"
          dataSource={gridApplies}
          pagination={false}
          locale={{ emptyText: '暂无申请' }}
          columns={[
            { title: '页面', dataIndex: 'page' },
            {
              title: '区域',
              render: (_: any, r: AdPayGridApply) => `(${r.x},${r.y}) 起 ${r.w}×${r.h}（${r.cells_count}格）`,
            },
            { title: '月数', dataIndex: 'duration_month' },
            { title: '金额', dataIndex: 'amount', render: (v: string) => `¥${v}` },
            { title: '状态', dataIndex: 'status', render: (s: number) => <Tag color={STATUS_COLOR[s]}>{AD_STATUS_TEXT[s]}</Tag> },
            {
              title: '到期',
              dataIndex: 'end_time',
              render: (t: number) => (t ? new Date(t * 1000).toLocaleDateString() : '-'),
            },
          ]}
        />
      </Card>
    </div>
  );
}
