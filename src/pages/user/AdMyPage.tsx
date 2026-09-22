import React, { useEffect, useState } from 'react';
import { Button, Card, Spin, Tag, Tabs, Popconfirm, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getToken } from '@/utils/auth';
import {
  getMyAds,
  getPrices,
  deleteApply,
  deleteGridApply,
  AD_STATUS_TEXT,
  type AdPayApply,
  type AdPayGridApply,
  type AdPayPosition,
} from '@/services/adpay';
import CardTable from '@/components/common/CardTable';

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

  const load = () => {
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
  };
  useEffect(load, []);

  if (loading) return <Spin style={{ display: 'block', margin: '40px auto' }} />;

  const onDeleteApply = (id: number) => {
    deleteApply(id)
      .then((r) => {
        if (r.code === 1) {
          message.success('已删除');
          load();
        } else {
          message.error(r.msg || '删除失败');
        }
      })
      .catch((e) => message.error(e?.message || '删除失败'));
  };
  const onDeleteGrid = (id: number) => {
    deleteGridApply(id)
      .then((r) => {
        if (r.code === 1) {
          message.success('已删除');
          load();
        } else {
          message.error(r.msg || '删除失败');
        }
      })
      .catch((e) => message.error(e?.message || '删除失败'));
  };

  const sysColumns = [
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
    {
      title: '操作',
      render: (_: any, r: AdPayApply) => (
        <Popconfirm title="确认删除该广告申请？" onConfirm={() => onDeleteApply(r.id)} okText="删除" cancelText="取消">
          <Button danger size="small">
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ];
  const gridColumns = [
    { title: '页面', dataIndex: 'page', render: (v: string) => (v === 'home' ? '首页底部' : '格子单页') },
    { title: '标题', dataIndex: 'title' },
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
    {
      title: '操作',
      render: (_: any, r: AdPayGridApply) => (
        <Popconfirm title="确认删除该格子广告申请？" onConfirm={() => onDeleteGrid(r.id)} okText="删除" cancelText="取消">
          <Button danger size="small">
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ];
  const posColumns = [
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
  ];

  return (
    <div className="ad-my-page">
      <Tabs
        items={[
          {
            key: 'mine',
            label: '我的广告位列表',
            children: (
              <>
                <Card title="系统广告" style={{ marginBottom: 'var(--page-gap)' }}>
                  <CardTable<AdPayApply>
                    rowKey="id"
                    dataSource={applies}
                    columns={sysColumns}
                    locale={{ emptyText: '暂无申请' }}
                  />
                </Card>
                <Card
                  title="格子广告"
                  extra={<Button type="link" onClick={() => navigate('/grid')}>去格子广告页</Button>}
                >
                  <CardTable<AdPayGridApply>
                    rowKey="id"
                    dataSource={gridApplies}
                    columns={gridColumns}
                    locale={{ emptyText: '暂无申请' }}
                  />
                </Card>
              </>
            ),
          },
          {
            key: 'apply',
            label: '可申请广告位',
            children: (
              <Card title="可申请广告位">
                <CardTable<AdPayPosition>
                  rowKey="pkey"
                  dataSource={positions}
                  columns={posColumns}
                  locale={{ emptyText: '暂无可申请广告位' }}
                />
                <Button type="link" style={{ paddingLeft: 0, marginTop: 8 }} onClick={() => navigate('/grid')}>
                  进入格子广告单页申请 →
                </Button>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
