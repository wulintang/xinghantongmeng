import React, { useEffect, useState } from 'react';
import { Card, Spin, Table, Tag, Typography, message } from 'antd';
import { getToken } from '@/utils/auth';
import { getMyAds, AD_STATUS_TEXT, type AdPayApply } from '@/services/adpay';

const { Title } = Typography;

const STATUS_COLOR: Record<number, string> = {
  0: 'orange',
  1: 'green',
  2: 'red',
  3: 'blue',
  4: 'volcano',
};

export default function AdMyPage(): React.JSX.Element {
  const [loading, setLoading] = useState(true);
  const [applies, setApplies] = useState<AdPayApply[]>([]);
  const [gridApplies, setGridApplies] = useState<any[]>([]);

  useEffect(() => {
    if (!getToken()) {
      message.warning('请先登录');
      setLoading(false);
      return;
    }
    getMyAds()
      .then((r) => {
        if (r.code === 1 && r.data) {
          setApplies(r.data.applies || []);
          setGridApplies(r.data.gridApplies || []);
        } else if (r.code !== 1) {
          message.error(r.msg || '加载失败');
        }
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
            {
              title: '金额',
              dataIndex: 'amount',
              render: (v: string) => `¥${v}`,
            },
            {
              title: '状态',
              dataIndex: 'status',
              render: (s: number) => <Tag color={STATUS_COLOR[s]}>{AD_STATUS_TEXT[s]}</Tag>,
            },
            {
              title: '到期',
              dataIndex: 'end_time',
              render: (t: number) => (t ? new Date(t * 1000).toLocaleDateString() : '-'),
            },
          ]}
        />
      </Card>

      <Card title="格子广告申请">
        <Table
          rowKey="id"
          dataSource={gridApplies}
          pagination={false}
          locale={{ emptyText: '暂无申请' }}
          columns={[
            { title: '页面', dataIndex: 'page' },
            {
              title: '格子数',
              render: (_: any, r: any) => `${Array.isArray(r.cells ? JSON.parse(r.cells) : []) ? JSON.parse(r.cells).length : 0} 格`,
            },
            { title: '月数', dataIndex: 'duration_month' },
            { title: '金额', dataIndex: 'amount', render: (v: string) => `¥${v}` },
            {
              title: '状态',
              dataIndex: 'status',
              render: (s: number) => <Tag color={STATUS_COLOR[s]}>{AD_STATUS_TEXT[s]}</Tag>,
            },
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
