import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Typography, Table, Tag, Spin } from 'antd';
import { getOrders, type OrderItem } from '@/services/userCenter';
import { getToken } from '@/utils/auth';
import { usePageMeta } from '@/hooks/usePageMeta';

const { Title } = Typography;

export default function OrdersPage() {
  const navigate = useNavigate();
  usePageMeta({ title: '我的订单' });
  const [list, setList] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fmt = (t: number) => (t ? new Date(t * 1000).toLocaleString() : '');

  const load = () => {
    const key = getToken();
    if (!key) {
      navigate('/login');
      return;
    }
    getOrders(key)
      .then((r: any) => {
        if (r.code === 1) setList(r.data || []);
        else navigate('/login');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, [navigate]);

  return (
    <Card className="user-card user-card-760">
      <Title level={4}>我的订单</Title>
      <Spin spinning={loading}>
        <Table<OrderItem>
          dataSource={list}
          rowKey="id"
          pagination={false}
          scroll={{ x: 'max-content' }}
          columns={[
            { title: '订单号', dataIndex: 'id' },
            { title: '名称', dataIndex: 'title' },
            { title: '金额', dataIndex: 'jiage', render: (v: any) => `¥${v}` },
            {
              title: '状态',
              dataIndex: 'status',
              render: (s: number) =>
                s === 1 ? <Tag color="green">已支付</Tag> : <Tag color="orange">待支付</Tag>,
            },
            { title: '下单时间', dataIndex: 'add_time', render: (t: number) => fmt(t) },
          ]}
        />
      </Spin>
    </Card>
  );
}
