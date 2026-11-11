import React, { useEffect, useState } from 'react';
import {
  Button, Card, Empty, Flex, Form, Input, Modal, Select, Space, Spin, Table, Tabs, Tag, Typography, message,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

import { getShopConfig, getMyShop, saveShop, getMyGoods, getShopOrders, shipOrder, payDeposit, CATE_NAME, orderStatusText, orderStatusColor, type ShopConfig, type GoodsItem, type ShopOrderItem } from '@/services/shop';
import { useMember } from '@/context/MemberContext';
import { usePageMeta } from '@/hooks/usePageMeta';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const STATUS_AUDIT: Record<number, { color: string; label: string }> = {
  0: { color: 'orange', label: '待审' },
  1: { color: 'green', label: '通过' },
  2: { color: 'red', label: '驳回' },
};

const ShopManagePage: React.FC = () => {
  usePageMeta({ title: '我的商城' });
  const navigate = useNavigate();
  const { info } = useMember();
  const uid = info?.id || 0;

  const [cfg, setCfg] = useState<ShopConfig | null>(null);
  const [shop, setShop] = useState<any | null>(null);
  const [goods, setGoods] = useState<GoodsItem[]>([]);
  const [orders, setOrders] = useState<ShopOrderItem[]>([]);
  const [tab, setTab] = useState('setting');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paying, setPaying] = useState(false);

  const [shipTarget, setShipTarget] = useState<ShopOrderItem | null>(null);
  const [expressCompany, setExpressCompany] = useState('顺丰速运');
  const [expressNo, setExpressNo] = useState('');
  const [shipping, setShipping] = useState(false);

  const loadAll = () => {
    if (!uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([getShopConfig(), getMyShop()])
      .then(([c, s]) => {
        if (c.code === 1) setCfg(c.data || null);
        if (s.code === 1) setShop(s.data || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const loadGoods = () => {
    if (!uid) return;
    getMyGoods().then((r: any) => {
      if (r.code === 1) setGoods(r.data || []);
    }).catch(() => {});
  };

  const loadOrders = () => {
    if (!uid) return;
    getShopOrders().then((r: any) => {
      if (r.code === 1) setOrders(r.data || []);
    }).catch(() => {});
  };

  useEffect(() => {
    loadAll();
    loadGoods();
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const onSaveShop = (values: any) => {
    if (!uid) {
      message.warning('请先登录');
      return;
    }
    setSaving(true);
    saveShop({
      shop_name: values.shop_name,
      categories: values.categories || [],
      intro: values.intro || '',
    })
      .then((r: any) => {
        if (r.code === 1) {
          message.success(r.msg || '已保存');
          loadAll();
        } else message.error(r.msg || '保存失败');
      })
      .catch(() => message.error('保存失败'))
      .finally(() => setSaving(false));
  };

  const onPayDeposit = () => {
    if (!shop) {
      message.warning('请先创建店铺再缴纳保证金');
      return;
    }
    setPaying(true);
    payDeposit()
      .then((r: any) => {
        if (r.code === 1) {
          message.success(r.msg || '保证金已缴足');
          loadAll();
        } else message.error(r.msg || '缴纳失败');
      })
      .catch(() => message.error('缴纳失败'))
      .finally(() => setPaying(false));
  };

  const openShip = (o: ShopOrderItem) => {
    setShipTarget(o);
    setExpressCompany('顺丰速运');
    setExpressNo('');
  };
  const doShip = () => {
    if (!shipTarget || !expressNo.trim()) {
      message.warning('请填写快递单号');
      return;
    }
    setShipping(true);
    shipOrder(shipTarget.id, expressCompany, expressNo.trim())
      .then((r: any) => {
        if (r.code === 1) {
          message.success(r.msg || '已发货');
          setShipTarget(null);
          loadOrders();
        } else message.error(r.msg || '发货失败');
      })
      .catch(() => message.error('发货失败'))
      .finally(() => setShipping(false));
  };

  if (loading) return <Card className="user-center-card"><Spin /></Card>;
  if (!cfg) return <Card className="user-center-card"><Empty description="插件配置未就绪" /></Card>;

  const cateOptions = (cfg.allow_cate || []).map((c) => ({ value: c, label: CATE_NAME[c] || c }));
  const depositNeed = Number(cfg.deposit_amount) || 0;
  const depositPaid = shop ? Number(shop.deposit_paid) || 0 : 0;
  const depositEnough = depositPaid >= depositNeed;
  const goodsMap = new Map(goods.map((g) => [g.id, g]));

  const goodsColumns = [
    { title: '商品', dataIndex: 'title', key: 'title', render: (t: string) => <Text strong>{t}</Text> },
    { title: '类目', dataIndex: 'cate', key: 'cate', render: (c: string) => <Tag>{CATE_NAME[c] || c}</Tag> },
    {
      title: '交付',
      dataIndex: 'delivery',
      key: 'delivery',
      render: (d: string) => <Tag color={d === 'digital' ? 'cyan' : 'orange'}>{d === 'digital' ? '数字交付' : '实体交付'}</Tag>,
    },
    { title: '售价', dataIndex: 'price', key: 'price', render: (p: number) => `¥${(Number(p) || 0).toFixed(2)}` },
    {
      title: '状态',
      key: 'status',
      render: (_: any, r: GoodsItem) => {
        const a = STATUS_AUDIT[r.audit_status] || { color: 'default', label: '未知' };
        return (
          <Space>
            <Tag color={a.color}>{a.label}</Tag>
            {r.status === 1 ? <Tag color="green">在售</Tag> : r.status === 2 ? <Tag>下架</Tag> : <Tag color="orange">待审</Tag>}
          </Space>
        );
      },
    },
    {
      title: '操作',
      key: 'op',
      render: (_: any, r: GoodsItem) => (
        <Button size="small" type="link" onClick={() => navigate('/user/shop/goods-edit/' + r.id)}>编辑</Button>
      ),
    },
  ];

  const orderColumns = [
    { title: '订单号', dataIndex: 'order_sn', key: 'order_sn' },
    {
      title: '商品',
      key: 'goods',
      render: (_: any, r: ShopOrderItem) => goodsMap.get(r.goods_id)?.title || `商品#${r.goods_id}`,
    },
    { title: '金额', dataIndex: 'price', key: 'price', render: (p: number) => `¥${(Number(p) || 0).toFixed(2)}` },
    {
      title: '交付',
      dataIndex: 'delivery_type',
      key: 'delivery_type',
      render: (d: string) => <Tag color={d === 'digital' ? 'cyan' : 'orange'}>{d === 'digital' ? '数字交付' : '实体交付'}</Tag>,
    },
    {
      title: '状态',
      key: 'status',
      render: (_: any, r: ShopOrderItem) => <Tag color={orderStatusColor(r)}>{orderStatusText(r)}</Tag>,
    },
    {
      title: '操作',
      key: 'op',
      render: (_: any, r: ShopOrderItem) =>
        r.delivery_type === 'physical' && r.status === 1 ? (
          <Button size="small" type="primary" onClick={() => openShip(r)}>填快递单号</Button>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
  ];

  const addressColumns = [
    { title: '订单号', dataIndex: 'order_sn', key: 'order_sn' },
    {
      title: '商品',
      key: 'goods',
      render: (_: any, r: ShopOrderItem) => goodsMap.get(r.goods_id)?.title || `商品#${r.goods_id}`,
    },
    {
      title: '收货人',
      key: 'addr',
      render: (_: any, r: ShopOrderItem) =>
        r.addr_name ? (
          <Text>{r.addr_name} {r.addr_phone}<br />{r.province || ''}{r.city || ''}{r.district || ''}{r.detail || ''}</Text>
        ) : (
          <Text type="secondary">（数字交付无收货地址）</Text>
        ),
    },
  ];

  return (
    <Card className="user-center-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 'var(--space-3)' }}>
        <Title level={4} style={{ margin: 0 }}>我的商城</Title>
        {shop ? (
          <Tag color={shop.audit_status === 1 ? 'green' : 'orange'}>
            {shop.audit_status === 1 ? (shop.status === 1 ? '营业中' : '暂停（保证金/审核）') : '店铺待审'}
          </Tag>
        ) : null}
      </div>

      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          {
            key: 'setting',
            label: '店铺设置',
            children: (
              <Spin spinning={loading}>
                {shop && shop.audit_status === 2 ? (
                  <Paragraph style={{ color: 'var(--capsule-danger)' }}>驳回原因：{shop.audit_reject || '（未填写）'}</Paragraph>
                ) : null}
                <Card size="small" title="保证金（平台全局统一）" style={{ marginBottom: 'var(--space-4)', background: 'var(--c-bg-soft)', border: 'none' }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text>应缴保证金：<Text strong>¥{depositNeed.toFixed(2)}</Text>（由平台在插件管理统一设置，所有店铺一致）</Text>
                    <Text>已缴：¥{depositPaid.toFixed(2)} {depositEnough ? <Tag color="green">已足额</Tag> : <Tag color="red">未足额</Tag>}</Text>
                    {!depositEnough ? (
                      <Button type="primary" loading={paying} onClick={onPayDeposit}>去缴纳保证金</Button>
                    ) : null}
                    {!shop ? <Text type="secondary">请先创建店铺并缴纳保证金，方可营业。</Text> : null}
                  </Space>
                </Card>

                <Form
                  layout="vertical"
                  initialValues={{
                    shop_name: shop?.shop_name || '',
                    categories: shop?.categories ? (Array.isArray(shop.categories) ? shop.categories : JSON.parse(shop.categories || '[]')) : [],
                    intro: shop?.intro || '',
                  }}
                  onFinish={onSaveShop}
                >
                  <Form.Item name="shop_name" label="店铺名称" rules={[{ required: true, message: '请填写店铺名称' }]}>
                    <Input maxLength={60} placeholder="店铺名称" />
                  </Form.Item>
                  <Form.Item name="categories" label="经营类目（多选，仅限平台允许的白名单）" rules={[{ required: true, message: '请至少选择一个类目' }]}>
                    <Select mode="multiple" placeholder="经营类目" options={cateOptions} />
                  </Form.Item>
                  <Form.Item name="intro" label="店铺简介">
                    <TextArea rows={3} maxLength={500} placeholder="一句话介绍你的店铺" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" loading={saving}>保存店铺设置</Button>
                </Form>
              </Spin>
            ),
          },
          {
            key: 'goods',
            label: '商品管理',
            children: (
              <div>
                <div style={{ marginBottom: 'var(--space-3)' }}>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/user/shop/goods-edit')}>新增商品</Button>
                </div>
                <Table rowKey="id" size="small" dataSource={goods} columns={goodsColumns} pagination={false}
                  locale={{ emptyText: <Empty description="还没有商品" /> }} />
              </div>
            ),
          },
          {
            key: 'ship',
            label: '订单发货',
            children: (
              <Table rowKey="id" size="small" dataSource={orders} columns={orderColumns} pagination={false}
                locale={{ emptyText: <Empty description="暂无订单" /> }} />
            ),
          },
          {
            key: 'addr',
            label: '收货地址',
            children: (
              <Table rowKey="id" size="small" dataSource={orders} columns={addressColumns} pagination={false}
                locale={{ emptyText: <Empty description="暂无实体交付订单" /> }} />
            ),
          },
        ]}
      />

      <Modal
        title="填写快递单号"
        open={!!shipTarget}
        onCancel={() => setShipTarget(null)}
        onOk={doShip}
        confirmLoading={shipping}
        okText="确认发货"
        cancelText="取消"
        destroyOnClose
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text type="secondary">快递公司</Text>
            <Select style={{ width: '100%', marginTop: 6 }} value={expressCompany} onChange={setExpressCompany}
              options={['顺丰速运', '圆通速递', '中通快递', '京东物流'].map((x) => ({ value: x, label: x }))} />
          </div>
          <Input placeholder="快递单号" value={expressNo} onChange={(e) => setExpressNo(e.target.value)} />
        </Space>
      </Modal>
    </Card>
  );
};

export default ShopManagePage;
