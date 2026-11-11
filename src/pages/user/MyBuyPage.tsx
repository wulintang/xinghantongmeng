import React, { useEffect, useState } from 'react';
import {
  Button, Card, Empty, Flex, Input, Modal, Space, Spin, Tabs, Tag, Typography, message,
} from 'antd';

import {
  getMyOrders, confirmReceipt, applyRefund, getAddresses, saveAddress,
  getGoodsDetail, orderStatusText, orderStatusColor, type ShopOrderItem, type AddressItem,
} from '@/services/shop';
import { usePageMeta } from '@/hooks/usePageMeta';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// 状态 Tab → 订单 status 值（数字交付的 2 即“已交付”，归入“待收货”一组）
const STATUS_TABS = [
  { key: 'all', label: '全部', match: null },
  { key: '0', label: '待支付', match: [0] },
  { key: '1', label: '待发货', match: [1] },
  { key: '2', label: '待收货', match: [2] },
  { key: '3', label: '已完成', match: [3] },
  { key: 'r', label: '退款中', match: [4, 5] },
];

const MyBuyPage: React.FC = () => {
  usePageMeta({ title: '我的购买' });

  const [orders, setOrders] = useState<ShopOrderItem[]>([]);
  const [titleMap, setTitleMap] = useState<Record<number, string>>({});
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);

  const [refundTarget, setRefundTarget] = useState<ShopOrderItem | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refunding, setRefunding] = useState(false);

  // 收货地址管理
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [addrForm, setAddrForm] = useState<Partial<AddressItem>>({});
  const [addrEditing, setAddrEditing] = useState<number | null>(null);

  const loadOrders = () => {
    if (tab === 'addr') {
      getAddresses().then((r: any) => {
        if (r.code === 1) setAddresses(r.data || []);
      }).catch(() => {});
      return;
    }
    setLoading(true);
    getMyOrders()
      .then(async (r: any) => {
        if (r.code === 1) {
          const list: ShopOrderItem[] = r.data || [];
          setOrders(list);
          // 尽力补全商品标题
          const ids = Array.from(new Set(list.map((o) => o.goods_id)));
          const map: Record<number, string> = {};
          await Promise.all(
            ids.map((gid) =>
              getGoodsDetail(gid)
                .then((g: any) => {
                  if (g.code === 1 && g.data?.title) map[gid] = g.data.title;
                })
                .catch(() => {})
            )
          );
          setTitleMap(map);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const onConfirm = (o: ShopOrderItem) => {
    confirmReceipt(o.id)
      .then((r: any) => {
        if (r.code === 1) {
          message.success('已确认收货');
          loadOrders();
        } else message.error(r.msg || '操作失败');
      })
      .catch(() => message.error('操作失败'));
  };

  const openRefund = (o: ShopOrderItem) => {
    setRefundTarget(o);
    setRefundReason('');
  };
  const doRefund = () => {
    if (!refundTarget) return;
    setRefunding(true);
    applyRefund(refundTarget.id, refundReason.trim())
      .then((r: any) => {
        if (r.code === 1) {
          message.success('已申请退款，原路退回');
          setRefundTarget(null);
          loadOrders();
        } else message.error(r.msg || '退款失败');
      })
      .catch(() => message.error('退款失败'))
      .finally(() => setRefunding(false));
  };

  const saveAddr = () => {
    if (!addrForm.name || !addrForm.phone || !addrForm.detail) {
      message.warning('请填写完整收货信息');
      return;
    }
    saveAddress({ ...addrForm, id: addrEditing || 0 })
      .then((r: any) => {
        if (r.code === 1) {
          message.success('已保存');
          setAddrForm({});
          setAddrEditing(null);
          loadOrders();
        } else message.error(r.msg || '保存失败');
      })
      .catch(() => message.error('保存失败'));
  };

  const filtered = tab === 'all' ? orders : orders.filter((o) => STATUS_TABS.find((t) => t.key === tab)?.match?.includes(o.status));
  const isAddrTab = tab === 'addr';

  const renderOrder = (o: ShopOrderItem) => (
    <Card key={o.id} size="small" style={{ marginBottom: 'var(--space-3)' }}>
      <Flex vertical gap={6}>
        <Flex align="center" justify="space-between" wrap gap={8}>
          <Text strong>{titleMap[o.goods_id] || `商品#${o.goods_id}`}</Text>
          <Tag color={orderStatusColor(o)}>{orderStatusText(o)}</Tag>
        </Flex>
        <Flex align="center" gap={12} wrap>
          <Text style={{ color: 'var(--capsule-danger)', fontWeight: 600 }}>¥{Number(o.price).toFixed(2)}</Text>
          <Tag color={o.delivery_type === 'digital' ? 'cyan' : 'orange'}>{o.delivery_type === 'digital' ? '数字交付' : '实体交付'}</Tag>
          <Text type="secondary">订单号 {o.order_sn}</Text>
        </Flex>
        {/* 数字交付内容 */}
        {o.delivery_type === 'digital' && o.status === 2 && o.deliver_content ? (
          <Paragraph style={{ margin: 0, color: 'var(--c-text-2)' }}>
            交付内容：{o.deliver_content}
          </Paragraph>
        ) : null}
        {/* 实体物流 */}
        {o.delivery_type === 'physical' && (o.status === 2) && (o.express_company || o.express_no) ? (
          <Paragraph style={{ margin: 0, color: 'var(--c-text-2)' }}>
            物流：{o.express_company} {o.express_no}
          </Paragraph>
        ) : null}
        <Flex gap={8} wrap>
          {o.status === 2 ? <Button size="small" type="primary" onClick={() => onConfirm(o)}>确认收货</Button> : null}
          {o.status === 1 || o.status === 2 ? <Button size="small" danger onClick={() => openRefund(o)}>申请退款</Button> : null}
          {o.delivery_type === 'physical' && o.status === 2 && (o.express_company || o.express_no) ? (
            <Button size="small" onClick={() => message.info(`物流：${o.express_company} ${o.express_no}`)}>查看物流</Button>
          ) : null}
        </Flex>
      </Flex>
    </Card>
  );

  return (
    <Card className="user-center-card">
      <Title level={4} style={{ margin: 0, marginBottom: 'var(--space-4)' }}>我的购买</Title>
      <div className="shop-stats">
        <div className="shop-stat">
          <div className="shop-stat-label">全部订单</div>
          <div className="shop-stat-value">{orders.length}</div>
        </div>
        <div className="shop-stat">
          <div className="shop-stat-label">待收货</div>
          <div className="shop-stat-value">{orders.filter((o) => o.status === 2).length}</div>
        </div>
        <div className="shop-stat">
          <div className="shop-stat-label">已完成</div>
          <div className="shop-stat-value">{orders.filter((o) => o.status === 3).length}</div>
        </div>
      </div>
      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          ...STATUS_TABS.map((t) => ({ key: t.key, label: t.label })),
          { key: 'addr', label: '收货地址' },
        ]}
        style={{ marginTop: 'var(--space-3)' }}
      />

      {isAddrTab ? (
        <Spin spinning={false}>
          <div style={{ marginBottom: 'var(--space-3)' }}>
            <Button type="primary" onClick={() => { setAddrForm({}); setAddrEditing(null); }}>新增收货地址</Button>
          </div>
          {addresses.length === 0 ? <Empty description="还没有收货地址" /> : (
            addresses.map((a) => (
              <Card key={a.id} size="small" style={{ marginBottom: 'var(--space-3)' }}>
                <Flex justify="space-between" align="center" wrap gap={8}>
                  <div>
                    <Text strong>{a.name} {a.phone}</Text>
                    <div style={{ color: 'var(--c-text-3)' }}>{a.province || ''}{a.city || ''}{a.district || ''}{a.detail}</div>
                    {a.is_default === 1 ? <Tag color="green">默认</Tag> : null}
                  </div>
                  <Button size="small" onClick={() => { setAddrForm(a); setAddrEditing(a.id); }}>编辑</Button>
                </Flex>
              </Card>
            ))
          )}
          <Card size="small" title={addrEditing ? '编辑地址' : '新增地址'} style={{ marginTop: 'var(--space-3)' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input placeholder="收货人" value={addrForm.name || ''} onChange={(e) => setAddrForm((f) => ({ ...f, name: e.target.value }))} />
              <Input placeholder="手机号" value={addrForm.phone || ''} onChange={(e) => setAddrForm((f) => ({ ...f, phone: e.target.value }))} />
              <Input placeholder="省" value={addrForm.province || ''} onChange={(e) => setAddrForm((f) => ({ ...f, province: e.target.value }))} />
              <Input placeholder="市" value={addrForm.city || ''} onChange={(e) => setAddrForm((f) => ({ ...f, city: e.target.value }))} />
              <Input placeholder="区/县" value={addrForm.district || ''} onChange={(e) => setAddrForm((f) => ({ ...f, district: e.target.value }))} />
              <TextArea placeholder="详细地址" rows={2} value={addrForm.detail || ''} onChange={(e) => setAddrForm((f) => ({ ...f, detail: e.target.value }))} />
              <Space>
                <Button type="primary" onClick={saveAddr}>保存</Button>
                <label>
                  <input
                    type="checkbox"
                    checked={addrEditing ? addresses.find((x) => x.id === addrEditing)?.is_default === 1 : false}
                    onChange={(e) => setAddrForm((f) => ({ ...f, is_default: e.target.checked ? 1 : 0 }))}
                  /> 设为默认
                </label>
              </Space>
            </Space>
          </Card>
        </Spin>
      ) : (
        <Spin spinning={loading}>
          {filtered.length === 0 ? (
            <Empty description="暂无订单" />
          ) : (
            filtered.map(renderOrder)
          )}
        </Spin>
      )}

      <Modal
        title="申请退款"
        open={!!refundTarget}
        onCancel={() => setRefundTarget(null)}
        onOk={doRefund}
        confirmLoading={refunding}
        okText="确认退款"
        cancelText="取消"
        destroyOnClose
      >
        <TextArea rows={4} placeholder="请说明退款原因" value={refundReason} onChange={(e) => setRefundReason(e.target.value)} />
      </Modal>
    </Card>
  );
};

export default MyBuyPage;
