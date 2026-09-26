import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, InputNumber, Modal, Space, Tag, Spin, Tabs, Typography, message } from 'antd';
import { getBalance, getUserProfile, getOrders, type BalanceItem, type OrderItem } from '@/services/userCenter';
import { getToken } from '@/utils/auth';
import { usePageMeta } from '@/hooks/usePageMeta';
import dayjs from 'dayjs';
import CardTable from '@components/common/CardTable';

export default function BalancePage() {
  const navigate = useNavigate();
  usePageMeta({ title: '余额明细' });
  const [list, setList] = useState<BalanceItem[]>([]);
  const [total, setTotal] = useState(0);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState(0);
  const [payOpen, setPayOpen] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);
  const [paying, setPaying] = useState(false);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [tab, setTab] = useState('balance');

  const fmt = (t: any) => { const n = Number(t); return n ? new Date(n * 1000).toLocaleString() : ''; };

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
          setIncome(r.data.income || 0);
          setExpense(r.data.expense || 0);
        } else {
          navigate('/login');
        }
      })
      .catch((e: any) => message.error('余额明细加载失败：' + (e?.message || '未知错误')))
      .finally(() => setLoading(false));
    // 充值下单要 uid（好道 Pay::alipay 按 uid 建订单）
    getUserProfile(key)
      .then((r: any) => {
        if (r.code === 1) setUid(r.data.id);
      })
      .catch(() => {});
    setOrdersLoading(true);
    getOrders(key)
      .then((r: any) => {
        if (r.code === 1) setOrders(r.data || []);
      })
      .catch((e: any) => message.error('充值记录加载失败：' + (e?.message || '未知错误')))
      .finally(() => setOrdersLoading(false));
  };

  useEffect(load, [navigate]);

  // 好道原生支付宝充值：Pay::alipay($uid) 按 uid+amount 建订单并跳支付宝收银台
  const onPay = () => {
    if (!(Number(amount) > 0)) {
      message.warning('请输入正确的充值金额');
      return;
    }
    if (!uid) {
      message.error('用户信息加载中，请稍后再试');
      return;
    }
    setPaying(true);
    const base = (process.env.BOYOUQUAN_API_ADDRESS || '').replace(/\/+$/, '');
    window.open(`${base}/index.php/pay/alipay.html?uid=${uid}&amount=${Number(amount)}`, '_blank');
    setPayOpen(false);
    setPaying(false);
  };

  return (
    <Card className="user-center-card">
      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          {
            key: 'balance',
            label: '余额明细',
            children: (
              <Spin spinning={loading}>
                <div className="balance-hero">
                  <div className="balance-hero-left">
                    <div className="balance-hero-label">账号余额（元）</div>
                    <div className="balance-hero-amount">{Number(total).toFixed(2)}</div>
                    <div className="balance-hero-sub">
                      <span className="text-up">累计收入 {Number(income).toFixed(2)}</span>
                      <span className="text-down">累计支出 {Number(expense).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="balance-hero-actions">
                    <Button type="primary" shape="round" onClick={() => setPayOpen(true)}>
                      充值
                    </Button>
                    <Button shape="round" onClick={() => setTab('orders')}>
                      充值记录
                    </Button>
                  </div>
                </div>
                <CardTable<BalanceItem>
                  className="user-center-table"
                  dataSource={list}
                  rowKey="id"
                  loading={loading}
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
                    { title: '时间', dataIndex: 'time', render: (t: any) => { const n = Number(t); return n ? dayjs(n * 1000).format('YYYY-MM-DD HH:mm') : (t || '-'); } },
                  ]}
                />
              </Spin>
            ),
          },
          {
            key: 'orders',
            label: '充值记录',
            children: (
              <CardTable<OrderItem>
                dataSource={orders}
                rowKey="id"
                loading={ordersLoading}
                pagination={false}
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
            ),
          },
        ]}
      />
      <Modal
        title="账号充值（支付宝）"
        open={payOpen}
        onCancel={() => setPayOpen(false)}
        onOk={onPay}
        okText="去支付"
        confirmLoading={paying}
      >
        <Space direction="vertical" className="balance-pay-space">
          <InputNumber
            className="balance-amount-input"
            min={0.01}
            step={1}
            precision={2}
            value={amount}
            onChange={(v) => setAmount(v)}
            addonBefore="¥"
            placeholder="请输入充值金额"
          />
          <Typography.Text type="secondary">点击「去支付」后将跳转支付宝收银台完成付款。</Typography.Text>
        </Space>
      </Modal>
    </Card>
  );
}
