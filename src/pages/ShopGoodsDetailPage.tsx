import React, { useEffect, useState } from 'react';
import {
  Alert, Avatar, Button, Card, Flex, Input, Modal, Select, Typography, message,
} from 'antd';
import { Link, useNavigate, useParams } from 'react-router-dom';

import PageHeader from '@components/common/PageHeader';
import MdView from '@components/common/MdView';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useMinLoading } from '@/hooks/useMinLoading';
import { getToken } from '@/utils/auth';
import { toggleFavorite, readFaved, submitReport } from '@/services/userCenter';
import {
  getGoodsDetail, getShopInfo, getAddresses, buyGoods, genOrderSn,
  cateNameFrom, type GoodsItem, type AddressItem, type ShopItem,
} from '@/services/shop';
import type { ShopConfig } from '@/services/shop';
import { ShopGoodsDetailSkeleton } from '@components/common/skeleton';

const { Text } = Typography;

/** 商品独立详情单页（替代原抽屉弹窗）：复用统一表面令牌 + MdView 渲染正文 */
const ShopGoodsDetailPage: React.FC = () => {
  usePageMeta({ title: '商品详情' });
  const navigate = useNavigate();
  const { id: gid } = useParams<{ id: string }>();
  const id = Number(gid);

  const [cfg, setCfg] = useState<ShopConfig | null>(null);
  const [detail, setDetail] = useState<GoodsItem | null>(null);
  const [shop, setShop] = useState<ShopItem | null>(null);
  const [loading, setLoading] = useState(true);

  const [faved, setFaved] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [reporting, setReporting] = useState(false);

  const [buyOpen, setBuyOpen] = useState(false);
  const [buying, setBuying] = useState(false);
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [addressId, setAddressId] = useState<number>(0);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getGoodsDetail(id)
      .then((r: any) => {
        if (r.code === 1 && r.data) {
          setDetail(r.data);
          if (r.data.uid) {
            getShopInfo(r.data.uid)
              .then((sr: any) => { if (sr.code === 1 && sr.data) setShop(sr.data); })
              .catch(() => {});
          }
        } else message.warning(r.msg || '商品不存在或已下架');
      })
      .catch(() => message.warning('商品详情加载失败'))
      .finally(() => setLoading(false));
    const key = getToken() || '';
    readFaved(key, id, 'shop').then(setFaved).catch(() => {});
  }, [id]);

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
          navigate('/user/buy');
        } else message.error(r.msg || '购买失败，请检查账号余额');
      })
      .catch(() => message.error('购买失败，请稍后重试'))
      .finally(() => setBuying(false));
  };

  const showSkeleton = useMinLoading(loading);
  if (showSkeleton) {
    return (
      <div className="shop-detail-page">
        <PageHeader title="商品详情" />
        <ShopGoodsDetailSkeleton />
      </div>
    );
  }
  if (!detail) {
    return (
      <div className="shop-detail-page">
        <Card className="shop-empty"><Text type="secondary">商品不存在或已下架</Text></Card>
      </div>
    );
  }

  return (
    <div className="shop-detail-page">
      <PageHeader
        title={detail.title}
        crumbs={[{ label: '首页', to: '/' }, { label: '用户集市', to: '/shop' }]}
      />
      {/* 卡片一：商品信息（保持左图右信息；信息项统一胶囊、描述归位、金额+购买同行右对齐） */}
      <Card className="shop-detail-card">
        <Flex gap={24} wrap className="shop-detail-flex">
          {detail.cover ? (
            <div className="shop-detail-cover"><img src={detail.cover} alt={detail.title} /></div>
          ) : (
            <div className="shop-goods-ico shop-detail-cover-ico">{cateNameFrom(cfg, detail.cate)?.[0] || '商'}</div>
          )}
          <Flex vertical className="u-flex-1 u-minw-240px shop-detail-info">
            {/* 店铺/类目/交付/保证金 + 收藏举报：全部同款灰胶囊、同尺寸；手机端只留 店名/进入店铺/收藏/举报 */}
            <Flex gap={10} wrap align="center" className="goods-pills">
              {shop ? (
                <>
                  <Link to={`/user/${detail.uid}?tab=shop`} className="goods-pill goods-pill-shop">
                    <Avatar
                      size={20}
                      shape="square"
                      src={shop.logo || undefined}
                      className="goods-pill-avatar"
                    >
                      {(shop.shop_name || '店').slice(0, 1)}
                    </Avatar>
                    <span>{shop.shop_name || '店铺'}</span>
                  </Link>
                  <span className="goods-pill goods-pill-desktop-only">
                    {Number(shop.status) === 1 ? '营业中' : '未营业'}
                  </span>
                  <Link to={`/user/${detail.uid}?tab=shop`} className="goods-pill">进入店铺</Link>
                </>
              ) : null}
              <span className="goods-pill goods-pill-desktop-only">{cateNameFrom(cfg, detail.cate)}</span>
              <span className="goods-pill goods-pill-desktop-only">
                {detail.delivery === 'digital' ? '数字交付' : '实体交付'}
              </span>
              <span className="goods-pill goods-pill-desktop-only">
                保证金{Number(detail.can_buy) === 0 ? '未缴' : '已缴'}
              </span>
              <button type="button" className="goods-pill goods-pill-action" disabled={favLoading} onClick={onFav}>
                {faved ? '★ 已收藏' : '☆ 收藏'}
              </button>
              <button type="button" className="goods-pill goods-pill-action" onClick={() => setReportOpen(true)}>举报</button>
            </Flex>

            {/* 描述归位：统一背景块，位于金额/购买之上；hero 标题下不再放描述 */}
            {detail.description || detail.delivery_note ? (
              <div className="goods-desc-block">
                {detail.description ? <div>{detail.description}</div> : null}
                {detail.delivery_note ? <div className="u-mt-4px">{detail.delivery_note}</div> : null}
              </div>
            ) : null}

            {Number(detail.can_buy) === 0 ? (
              <Alert
                type="warning"
                showIcon
                message="该店铺保证金未缴足"
                description={`已缴 ¥${(Number(detail.deposit_paid) || 0).toFixed(2)} / 应缴 ¥${(Number(detail.deposit_need) || 0).toFixed(2)}。商品可以正常浏览，但暂时不能购买。`}
              />
            ) : null}

            {/* 金额 + 立即购买：同一行、整体靠右 */}
            <Flex align="center" justify="flex-end" gap={16} wrap className="goods-buy-row">
              <span className="shop-detail-price">¥{(Number(detail.price) || 0).toFixed(2)}</span>
              <Button type="primary" disabled={Number(detail.can_buy) === 0} onClick={openBuy}>
                {Number(detail.can_buy) === 0 ? '暂不可购买' : '立即购买'}
              </Button>
            </Flex>
          </Flex>
        </Flex>
      </Card>

      {/* 卡片二：商品介绍（与商品信息拆为上下两卡） */}
      {detail.content ? (
        <Card className="shop-detail-card" title="商品介绍">
          <div className="detail-content md-content">
            <MdView id="shop-goods-detail-preview" modelValue={detail.content} />
          </div>
        </Card>
      ) : null}

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
        <Flex vertical gap="middle">
          <div><Text type="secondary">商品：</Text><Text strong>{detail.title}</Text></div>
          <div><Text type="secondary">应付：</Text><Text strong className="shop-goods-price">¥{(Number(detail.price) || 0).toFixed(2)}</Text></div>
          {detail.delivery === 'physical' ? (
            <div>
              <Text type="secondary">收货地址：</Text>
              <Select
                className="u-w-100 u-mt-6px"
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
        </Flex>
      </Modal>
    </div>
  );
};

export default ShopGoodsDetailPage;
