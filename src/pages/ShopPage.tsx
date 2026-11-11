import React, { useEffect, useState } from 'react';
import {
  Alert, Avatar, Button, Card, Col, Drawer, Empty, Flex, Input, Modal, Pagination, Row, Segmented,
  Select, Space, Spin, Tag, Typography, message,
} from 'antd';
import { Link, useNavigate } from 'react-router-dom';

import PageHeader from '@components/common/PageHeader';
import SearchBox from '@components/common/SearchBox';
import MdView from '@components/common/MdView';
import 'md-editor-rt/lib/preview.css';
import { usePageMeta } from '@/hooks/usePageMeta';
import { getToken } from '@/utils/auth';
import { toggleFavorite, readFaved, submitReport } from '@/services/userCenter';
import {
  getMallList, getGoodsDetail, getAddresses, buyGoods, genOrderSn, getShopConfig,
  cateOptionsFrom, cateNameFrom,
  type MallGoodsItem, type GoodsItem, type AddressItem, type ShopConfig,
} from '@/services/shop';

const { Text, Paragraph } = Typography;

const PAGE_SIZE = 12;

/** 独立集市（公开）：全站在售商品、后台类目筛选、搜索、详情、购买、收藏与举报 */
const ShopPage: React.FC = () => {
  usePageMeta({ title: '用户集市' });
  const navigate = useNavigate();

  const [cfg, setCfg] = useState<ShopConfig | null>(null);
  const [cate, setCate] = useState<string>('all');
  const [kw, setKw] = useState(() => new URLSearchParams(window.location.search).get('keyword') || '');
  const [page, setPage] = useState(1);
  const [list, setList] = useState<MallGoodsItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const [detail, setDetail] = useState<GoodsItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [faved, setFaved] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [reporting, setReporting] = useState(false);

  const [buyOpen, setBuyOpen] = useState(false);
  const [buying, setBuying] = useState(false);
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [addressId, setAddressId] = useState<number>(0);

  // 支持首页「用户集市」区块直达某个商品：/shop?goods=<id>
  const initialGoods = Number(new URLSearchParams(window.location.search).get('goods') || 0);

  const cateOptions = cateOptionsFrom(cfg);
  const CATE_OPTIONS = [
    { label: '全部', value: 'all' },
    ...cateOptions.map((c) => ({ label: c.name, value: c.key })),
  ];
  const commission = Number(cfg?.commission_rate ?? 0);

  const openDetail = (id: number) => {
    setDrawerOpen(true);
    setDetail(null);
    setDetailLoading(true);
    setFaved(false);
    const key = getToken() || '';
    readFaved(key, id, 'shop').then(setFaved).catch(() => {});
    getGoodsDetail(id)
      .then((r: any) => {
        if (r.code === 1 && r.data) setDetail(r.data);
        else message.warning(r.msg || '商品不存在或已下架');
      })
      .catch(() => message.warning('商品详情加载失败'))
      .finally(() => setDetailLoading(false));
  };

  useEffect(() => {
    getShopConfig()
      .then((r: any) => { if (r.code === 1 && r.data) setCfg(r.data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (initialGoods) openDetail(initialGoods);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setFailed(false);
    getMallList({ cate, kw, page, limit: PAGE_SIZE })
      .then((r: any) => {
        if (!alive) return;
        if (r.code === 1 && r.data) {
          setList(r.data.list || []);
          setTotal(Number(r.data.total) || 0);
          if (r.data.config) setCfg((prev) => prev || (r.data.config as ShopConfig));
        } else setFailed(true);
      })
      .catch(() => {
        if (alive) setFailed(true);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [cate, kw, page]);

  const onFav = () => {
    const key = getToken();
    if (!key) {
      message.info('请先登录再收藏');
      navigate('/login');
      return;
    }
    if (!detail) return;
    setFavLoading(true);
    toggleFavorite(key, detail.id, 'shop')
      .then((r: any) => {
        if (r.code === 1) {
          const now = r.data?.faved === 1;
          setFaved(now);
          message.success(now ? '已收藏' : '已取消收藏');
        } else message.error(r.msg || '操作失败');
      })
      .catch(() => message.error('操作失败，请稍后重试'))
      .finally(() => setFavLoading(false));
  };

  const onReport = () => {
    const key = getToken();
    if (!key) {
      message.info('请先登录再举报');
      navigate('/login');
      return;
    }
    if (!detail || !reportContent.trim()) {
      message.warning('请填写举报内容');
      return;
    }
    setReporting(true);
    submitReport(key, {
      tid: String(detail.id), m: 'shop', title: detail.title || '', content: reportContent.trim(),
    })
      .then((r: any) => {
        if (r.code === 1) {
          message.success(r.msg || '举报已提交');
          setReportOpen(false);
          setReportContent('');
        } else message.error(r.msg || '提交失败');
      })
      .catch(() => message.error('提交失败'))
      .finally(() => setReporting(false));
  };

  const openBuy = () => {
    if (!getToken()) {
      message.info('请先登录再购买');
      navigate('/login');
      return;
    }
    if (!detail) return;
    if (Number(detail.can_buy) === 0) {
      message.warning('该店铺保证金未缴足，商品暂不可购买');
      return;
    }
    setBuyOpen(true);
    if (detail.delivery === 'physical') {
      getAddresses()
        .then((r: any) => {
          if (r.code === 1) {
            const addr: AddressItem[] = r.data || [];
            setAddresses(addr);
            const def = addr.find((a) => a.is_default === 1) || addr[0];
            setAddressId(def ? def.id : 0);
          }
        })
        .catch(() => {});
    }
  };

  const doBuy = () => {
    if (!detail) return;
    if (Number(detail.can_buy) === 0) {
      message.warning('该店铺保证金未缴足，商品暂不可购买');
      return;
    }
    if (detail.delivery === 'physical' && !addressId) {
      message.warning('请先在「我的购买 → 收货地址」中添加收货地址');
      return;
    }
    setBuying(true);
    buyGoods(detail.id, genOrderSn(), detail.delivery === 'physical' ? addressId : 0)
      .then((r: any) => {
        if (r.code === 1) {
          message.success(r.msg || '购买成功');
          setBuyOpen(false);
          setDrawerOpen(false);
          navigate('/user/buy');
        } else message.error(r.msg || '购买失败，请检查账号余额');
      })
      .catch(() => message.error('购买失败，请稍后重试'))
      .finally(() => setBuying(false));
  };

  const renderCard = (g: MallGoodsItem) => (
    <Card
      hoverable
      className="shop-goods-card"
      onClick={() => openDetail(g.id)}
      cover={
        g.cover ? (
          <div className="shop-goods-cover"><img src={g.cover} alt={g.title} /></div>
        ) : (
          <div className="shop-goods-ico">{cateNameFrom(cfg, g.cate)?.[0] || '商'}</div>
        )
      }
    >
      <Flex vertical gap={8}>
        <Text strong className="shop-goods-title" title={g.title}>{g.title}</Text>
        <Paragraph type="secondary" ellipsis={{ rows: 2 }} className="shop-goods-desc">
          {g.description || '暂无商品简介'}
        </Paragraph>
        <Flex justify="space-between" align="center" wrap gap={6}>
          <Text className="shop-goods-price">¥{(Number(g.price) || 0).toFixed(2)}</Text>
          <Tag color={g.delivery === 'digital' ? 'cyan' : 'orange'}>
            {g.delivery === 'digital' ? '数字交付' : '实体交付'}
          </Tag>
        </Flex>
        <Flex justify="space-between" align="center" wrap gap={6}>
          <Flex align="center" gap={6} wrap>
            {g.shop_logo ? <Avatar size={16} src={g.shop_logo} /> : null}
            <Text type="secondary" className="shop-goods-meta">
              {g.shop_name || '店铺'} · {cateNameFrom(cfg, g.cate)}
            </Text>
          </Flex>
          <Tag color={Number(g.can_buy) === 0 ? 'red' : 'green'}>
            {Number(g.can_buy) === 0 ? '保证金未缴' : '保证金已缴'}
          </Tag>
        </Flex>
        <Flex justify="flex-end">
          <Button type="link" size="small" onClick={(e) => { e.stopPropagation(); openDetail(g.id); }}>查看详情</Button>
        </Flex>
      </Flex>
    </Card>
  );

  return (
    <div className="shop-page">
      <PageHeader
        title="用户集市"
        description={cfg?.mall_notice || '域名、商标、软著、作品著作权与源码等虚拟资产交易，使用账号余额结算，平台统一担保与审核。'}
        crumbs={[{ label: '首页', to: '/' }]}
        extra={<Button onClick={() => navigate('/user/shop')}>我的集市</Button>}
      />

      <Card className="shop-filter-card">
        <Flex vertical gap={14} align="center">
          <div className="shop-search-wrap">
            <SearchBox
              placeholder="搜索商品名称或关键词"
              onSearch={(v) => { setPage(1); setKw(v); }}
            />
          </div>
          <Text type="secondary">
            共 {total} 件在售商品 · 平台按成交价抽取佣金 {commission}%（卖家实得 {(100 - commission)}%）
          </Text>
          <Segmented
            className="cate-filter"
            options={CATE_OPTIONS}
            value={cate}
            onChange={(v) => { setPage(1); setCate(String(v)); }}
          />
        </Flex>
      </Card>

      {failed ? (
        <Alert
          type="info"
          showIcon
          message="集市暂未就绪"
          description="请确认后端已部署最新版 app/shop 插件（含 mallList 公开接口）。"
        />
      ) : loading ? (
        <div className="shop-loading"><Spin size="large" /></div>
      ) : list.length === 0 ? (
        <Card className="shop-empty"><Empty description="暂无在售商品" /></Card>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {list.map((g) => (
              <Col key={g.id} xs={24} sm={12} md={8} lg={6}>{renderCard(g)}</Col>
            ))}
          </Row>
          <Flex justify="center" className="shop-pager">
            <Pagination
              current={page}
              pageSize={PAGE_SIZE}
              total={total}
              showSizeChanger={false}
              onChange={(p) => setPage(p)}
            />
          </Flex>
        </>
      )}

      <Drawer
        title={detail ? detail.title : '商品详情'}
        width={Math.min(680, typeof window !== 'undefined' ? window.innerWidth : 680)}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        {detailLoading ? (
          <div className="shop-loading"><Spin /></div>
        ) : !detail ? (
          <Empty description="商品不存在或已下架" />
        ) : (
          <Flex vertical gap={16}>
            {detail.cover ? (
              <div className="shop-detail-cover"><img src={detail.cover} alt={detail.title} /></div>
            ) : null}
            <Flex gap={10} wrap align="center">
              <Tag>{cateNameFrom(cfg, detail.cate)}</Tag>
              <Tag color={detail.delivery === 'digital' ? 'cyan' : 'orange'}>
                {detail.delivery === 'digital' ? '数字交付' : '实体交付'}
              </Tag>
              <Tag color={Number(detail.can_buy) === 0 ? 'red' : 'green'}>
                保证金{Number(detail.can_buy) === 0 ? '未缴' : '已缴'}
              </Tag>
              {detail.delivery_note ? <Text type="secondary">{detail.delivery_note}</Text> : null}
            </Flex>
            <div className="shop-detail-price">¥{(Number(detail.price) || 0).toFixed(2)}</div>
            <Alert
              type="info"
              showIcon
              message={`平台佣金 ${Number(detail.commission_rate ?? commission)}%，卖家实得 ¥${(Number(detail.price) * (1 - Number(detail.commission_rate ?? commission) / 100)).toFixed(2)}`}
            />
            {Number(detail.can_buy) === 0 ? (
              <Alert
                type="warning"
                showIcon
                message="该店铺保证金未缴足"
                description={`已缴 ¥${(Number(detail.deposit_paid) || 0).toFixed(2)} / 应缴 ¥${(Number(detail.deposit_need) || 0).toFixed(2)}。商品可以正常浏览，但暂时不能购买。`}
              />
            ) : null}
            {detail.description ? <Alert type="info" showIcon message={detail.description} /> : null}
            {detail.content ? (
              <div className="detail-content md-content">
                <MdView id="shop-goods-preview" modelValue={detail.content} />
              </div>
            ) : null}
            <Space wrap>
              <Button type="primary" size="large" disabled={Number(detail.can_buy) === 0} onClick={openBuy}>
                {Number(detail.can_buy) === 0 ? '暂不可购买' : '立即购买'}
              </Button>
              <Button loading={favLoading} onClick={onFav}>{faved ? '★ 已收藏' : '☆ 收藏'}</Button>
              <Button onClick={() => setReportOpen(true)}>举报</Button>
            </Space>
            <Text type="secondary">
              购买将实时从账号余额扣费；数字交付自动发货，实体交付由卖家填写快递单号。
            </Text>
            <Text type="secondary">
              <Link to="/user/buy">查看我的购买</Link>
            </Text>
          </Flex>
        )}
      </Drawer>

      <Modal
        title={detail ? `举报「${detail.title}」` : '举报商品'}
        open={reportOpen}
        onCancel={() => { setReportOpen(false); setReportContent(''); }}
        onOk={onReport}
        okText="提交举报"
        cancelText="取消"
        confirmLoading={reporting}
        destroyOnClose
      >
        <Input.TextArea
          rows={4}
          value={reportContent}
          onChange={(e) => setReportContent(e.target.value)}
          placeholder="请描述该商品的违规情况（如：虚假描述、侵权、违禁品等）"
          maxLength={500}
          showCount
        />
      </Modal>

      <Modal
        title="确认购买"
        open={buyOpen}
        onCancel={() => setBuyOpen(false)}
        onOk={doBuy}
        okText="确认支付"
        cancelText="取消"
        confirmLoading={buying}
        destroyOnClose
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Text type="secondary">商品：</Text><Text strong>{detail?.title}</Text>
          </div>
          <div>
            <Text type="secondary">应付：</Text>
            <Text strong className="shop-goods-price">¥{(Number(detail?.price) || 0).toFixed(2)}</Text>
          </div>
          <div>
            <Text type="secondary">平台佣金：</Text>
            <Text>{Number(detail?.commission_rate ?? commission)}%（卖家实得 ¥{(Number(detail?.price) * (1 - Number(detail?.commission_rate ?? commission) / 100)).toFixed(2)}）</Text>
          </div>
          {detail?.delivery === 'physical' ? (
            <div>
              <Text type="secondary">收货地址：</Text>
              <Select
                style={{ width: '100%', marginTop: 6 }}
                value={addressId || undefined}
                placeholder={addresses.length ? '请选择收货地址' : '暂无收货地址，请先到「我的购买 → 收货地址」添加'}
                onChange={(v) => setAddressId(v)}
                options={addresses.map((a) => ({
                  value: a.id,
                  label: `${a.name} ${a.phone} ${a.province || ''}${a.city || ''}${a.district || ''}${a.detail || ''}`,
                }))}
              />
            </div>
          ) : null}
          <Text type="secondary">提交后将从账号余额扣费，请在「我的购买」查看订单与交付内容。</Text>
        </Space>
      </Modal>
    </div>
  );
};

export default ShopPage;
