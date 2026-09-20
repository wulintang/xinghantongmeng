import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Typography, Table, Statistic, Spin, Tag } from 'antd';
import { getBalance, type BalanceItem } from '@/services/userCenter';
import { getToken } from '@/utils/auth';

const { Title } = Typography;

export default function BalancePage() {
  const navigate = useNavigate();
  const [list, setList] = useState<BalanceItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = () => {
    const key = getToken();
    if (!key) {
      navigate('/login');
      return;
    }
    getBalance(key)
      .then((r: any) => {
        if (r.code === 1) {
          setList(r.data.list || []);
          setTotal(r.data.total || 0);
        } else {
          navigate('/login');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, [navigate]);

  return (
    <Card className="user-card user-card-760">
      <Title level={4}>余额明细</Title>
      <Spin spinning={loading}>
        <Statistic title="账户余额(元)" value={total} precision={2} className="mb-16" />
        <Table<BalanceItem>
          dataSource={list}
          rowKey="id"
          pagination={false}
          columns={[
            { title: '名称', dataIndex: 'title' },
            {
              title: '金额',
              dataIndex: 'rmb',
              render: (v: string) => {
                const n = parseFloat(v);
                return <Tag color={n >= 0 ? 'green' : 'red'}>{v}</Tag>;
              },
            },
            { title: '时间', dataIndex: 'time' },
          ]}
        />
      </Spin>
    </Card>
  );
}
