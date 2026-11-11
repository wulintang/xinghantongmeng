import React, { useEffect, useState } from 'react';
import {
  Alert, Button, Card, Empty, Form, Input, Modal, Select, Space, Spin, Table, Tabs, Tag, Typography, Upload, message,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

import { getShopConfig, getMyShop, saveShop, getMyGoods, getShopOrders, shipOrder, payDeposit, cateOptionsFrom, cateNameFrom, CATE_WHITELIST, orderStatusText, orderStatusColor, type ShopConfig, type GoodsItem, type ShopOrderItem } from '@/services/shop';
import { uploadFile } from '@/services/userCenter';
import { getToken } from '@/utils/auth';
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
  usePageMeta({ title: '我的集市' });
  const navigate = useNavigate();
  const { info } = useMember();
  const uid = info?.id || 0;

  const [cfg, setCfg] = useState<ShopConfig | null>(null);
  // 配置接口异常不再把整页变成「插件未开启/未就绪」，页面照常渲染，只给一条提示
  const [cfgError, setCfgError] = useState(false);
  const [shop, setShop] = useState<any | null>(null);
  const [goods, setGoods] = useState<GoodsItem[]>([]);
  const [orders, setOrders] = useState<ShopOrderItem[]>([]);
  const [tab, setTab] = useState('setting');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paying, setPaying] = useState(false);
  const [logo, setLogo] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);

  const [shipTarget, setShipTarget] = useState<ShopOrderItem | null>(null);
  const [expressCompany, setExpressCompany] = useState('顺丰速运');
  const [expressNo, setExpressNo] = useState('');
  const [shipping, setShipping] = useState(false);

  const loadAll = () => {
    if (!uid) {
      setLoading(false);
      return;
    }
    // 配置与店铺/商品/订单分开加载：避免任一接口 500 时把整页拖垮、
    // 误报「插件配置未就绪」。配置单独决定页面能否渲染。
    setLoading(true);
    getShopConfig()
      .then((c: any) => {
        if (c.code === 1) {
          setCfg(c.data || null);
          setCfgError(false);
        } else {
          setCfgError(true);
          message.warning(c.msg || '插件配置读取失败');
        }
      })
      .catch(() => {
        setCfgError(true);
        message.warning('插件配置接口请求失败（请确认后端已部署最新版 app/shop）');
      })
      .finally(() => setLoading(false));

    getMyShop()
      .then((s: any) => {
        if (s.code === 1) {
          setShop(s.data || null);
          setLogo(s.data?.logo || '');
        }
        else message.warning(s.msg || '店铺信息读取失败');
      })
      .catch(() => message.warning('店铺接口请求失败（请确认后端已部署最新版 app/shop）'));
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
      logo: logo || '',
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

  const onLogoUpload = (file: File) => {
    const key = getToken();
    if (!key) { message.error('请先登录'); return false; }
    if (!/^image\//.test(file.type)) { message.error('请选择图片文件'); return false; }
    setLogoUploading(true);
    uploadFile(key, file)
      .then((r: any) => {
        if (r.code === 1 && r.data?.url) { setLogo(r.data.url); message.success('Logo 上传成功'); }
        else message.error(r.msg || '上传失败');
      })
      .catch(() => message.error('上传失败'))
      .finally(() => setLogoUploading(false));
    return false;
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

  // 配置接口异常时按站点默认值渲染，不再误报「插件未开启 / 未就绪」
  const cfgSafe: ShopConfig = cfg || {
    enabled: 1,
    commission_rate: 0,
    deposit_amount: 0,
    shop_audit: 1,
    goods_audit: 1,
    allow_cate: CATE_WHITELIST,
  };

  const cateOptions = cateOptionsFrom(cfg).map((c) => ({ value: c.key, label: c.name }));
  const depositNeed = Number(cfgSafe.deposit_amount) || 0;
  const depositPaid = shop ? Number(shop.deposit_paid) || 0 : 0;
  const depositEnough = depositPaid >= depositNeed;
  const commission = Number(cfgSafe.commission_rate) || 0;
  const goodsMap = new Map(goods.map((g) => [g.id, g]));

  const goodsColumns = [
    { title: '商品', dataIndex: 'title', key: 'title', render: (t: string) => <Text strong>{t}</Text> },
    { title: '类目', dataIndex: 'cate', key: 'cate', render: (c: string) => <Tag>{cateNameFrom(cfg, c)}</Tag> },
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
      title: '保证金 / 整改',
      key: 'deposit',
      render: (_: any, r: GoodsItem) => (
        <Space direction="vertical" size={2}>
          <Tag color={depositEnough ? 'green' : 'red'}>{depositEnough ? '保证金已缴' : '保证金未缴'}</Tag>
          {r.admin_remark ? <Text type="danger" style={{ fontSize: 'var(--fs-xs)' }}>整改要求：{r.admin_remark}</Text> : null}
        </Space>
      ),
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
      <Title level={4} style={{ margin: 0, marginBottom: 'var(--space-4)' }}>我的集市</Title>

      <div className="shop-hero">
        <div className="shop-hero-main">
          <div className="shop-hero-name">
            {shop && logo ? <img src={logo} alt="" style={{ width: 30, height: 30, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--c-border)', marginRight: 8, verticalAlign: 'middle' }} /> : null}
            {shop ? shop.shop_name : '还没有店铺'}
            {shop ? (
              <Tag color={shop.audit_status === 1 ? (shop.status === 1 ? 'green' : 'orange') : 'orange'} style={{ marginLeft: 8 }}>
                {shop.audit_status === 1 ? (shop.status === 1 ? '营业中' : '待营业') : '店铺待审'}
              </Tag>
            ) : null}
          </div>
          <div className="shop-hero-desc">
            {shop
              ? `店铺编号 #${shop.id} · 保证金${depositEnough ? '已缴' : '未缴'}（已缴 ¥${depositPaid.toFixed(2)} / 应缴 ¥${depositNeed.toFixed(2)}）· 平台佣金 ${commission}%`
              : '填写店铺名称与经营类目即可创建店铺；保证金未缴时商品仍可展示，但不能被购买。'}
          </div>
        </div>
        <Space wrap>
          {!shop ? <Button onClick={() => setTab('setting')}>创建店铺</Button> : null}
          {shop && !depositEnough ? (
            <Button type="primary" loading={paying} onClick={onPayDeposit}>去缴纳保证金</Button>
          ) : null}
          <Button onClick={() => navigate(uid ? `/user/${uid}?tab=shop` : '/user/shop')}>我的主页集市</Button>
        </Space>
      </div>

      <div className="shop-stats">
        <div className="shop-stat">
          <div className="shop-stat-label">在售商品</div>
          <div className="shop-stat-value">{goods.filter((g) => g.status === 1).length}</div>
        </div>
        <div className="shop-stat">
          <div className="shop-stat-label">店铺订单</div>
          <div className="shop-stat-value">{orders.length}</div>
        </div>
        <div className="shop-stat">
          <div className="shop-stat-label">保证金{depositEnough ? '已缴' : '未缴'}</div>
          <div className="shop-stat-value">¥{depositPaid.toFixed(2)}</div>
        </div>
        <div className="shop-stat">
          <div className="shop-stat-label">平台佣金</div>
          <div className="shop-stat-value">{commission}%</div>
        </div>
      </div>

      {cfgError ? (
        <Alert
          type="warning"
          showIcon
          className="shop-step-hint"
          message="配置接口暂不可用，已按平台默认设置展示；保存与缴纳以服务端结果为准。"
        />
      ) : null}

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
                {shop && shop.admin_remark ? (
                  <Alert
                    type="error"
                    showIcon
                    className="shop-step-hint"
                    message="平台整改要求（关店理由）"
                    description={`${shop.admin_remark}；修改店铺信息并保存后会自动重新提交审核。`}
                  />
                ) : null}
                <Alert
                  type="info"
                  showIcon
                  className="shop-step-hint"
                  message={`保证金${depositEnough ? '已缴' : '未缴'} · 平台佣金 ${commission}%`}
                  description={`平台统一保证金 ¥${depositNeed.toFixed(2)}，当前已缴 ¥${depositPaid.toFixed(2)}；${depositEnough ? '已缴足，商品可正常购买。' : '未缴足：商品仍会在用户集市展示，但买家无法购买，缴足后自动恢复。'} 每笔成交平台抽取 ${commission}%，卖家实得 ${100 - commission}%。`}
                />

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
                  <Form.Item label="店铺 Logo（图片上传控件，禁止填 URL）">
                    <Space size={12} align="center">
                      <Upload accept="image/*" showUploadList={false} beforeUpload={onLogoUpload}>
                        <Button loading={logoUploading}>上传 Logo</Button>
                      </Upload>
                      {logo ? <img src={logo} alt="店铺 Logo" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--c-border)' }} /> : null}
                    </Space>
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
              <div className="shop-goods-list">
                {!depositEnough ? (
                  <Alert
                    type="warning"
                    showIcon
                    className="shop-step-hint"
                    message={`保证金未缴：需缴 ¥${depositNeed.toFixed(2)}（已缴 ¥${depositPaid.toFixed(2)}）`}
                    description="商品可以照常提交并在用户集市展示，但买家暂时无法购买；缴足保证金后自动恢复。平台按每笔成交抽取佣金。"
                    action={shop ? (
                      <Button size="small" type="primary" loading={paying} onClick={onPayDeposit}>去缴纳</Button>
                    ) : undefined}
                  />
                ) : null}
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
