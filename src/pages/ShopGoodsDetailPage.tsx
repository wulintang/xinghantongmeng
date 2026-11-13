import React, { useEffect, useState } from 'react';
import {
  Alert, Button, Card, Flex, Input, Modal, Select, Spin, Tag, Typography, message,
} from 'antd';
import { useNavigate, useParams } from 'react-router-dom';

import PageHeader from '@components/common/PageHeader';
import MdView from '@components/common/MdView';
import { usePageMeta } from '@/hooks/usePageMeta';
import { getToken } from '@/utils/auth';
import { toggleFavorite, readFaved, submitReport } from '@/services/userCenter';
import {
  getGoodsDetail, getAddresses, buyGoods, genOrderSn,
  cateNameFrom, type GoodsItem, type AddressItem,
} from '@/services/shop';
import type { ShopConfig } from '@/services/shop';

const { Text, Title } = Typography;

/** 商品独立详情单页（替代原抽屉弹窗）：复用统一表面令牌 + MdView 渲染正文 */
const ShopGoodsDetailPage: React.FC = () => {
  usePageMeta({ title: '商品详情' });
  const navigate = useNavigate();
  const { id: gid } = useParams<{ id: string }>();
  const id = Number(gid);

  const [cfg, setCfg] = useState<ShopConfig | null>(null);
  const [detail, setDetail] = useState<GoodsItem | null>(null);
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
        if (r.code === 1 && r.data) setDetail(r.data);
        else message.warning(r.msg || '商品不存在或已下架');
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

  if (loading) {
    return (
      <div className="shop-detail-page">
        <div className="shop-loading"><Spin size="large" /></div>
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
        extra={<Button onClick={() => navigate('/user/shop')}>我的集市</Button>}
      />
      <Card className="shop-detail-card">
        <Flex gap={24} wrap className="shop-detail-flex">
          {detail.cover ? (
            <div className="shop-detail-cover"><img src={detail.cover} alt={detail.title} /></div>
          ) : (
            <div className="shop-goods-ico shop-detail-cover-ico">{cateNameFrom(cfg, detail.cate)?.[0] || '商'}</div>
          )}
          <Flex vertical gap={12} style={{ flex: 1, minWidth: 240 }}>
            <Title level={3} style={{ margin: 0 }}>{detail.title}</Title>
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
            {Number(detail.can_buy) === 0 ? (
              <Alert
                type="warning"
                showIcon
                message="该店铺保证金未缴足"
                description={`已缴 ¥${(Number(detail.deposit_paid) || 0).toFixed(2)} / 应缴 ¥${(Number(detail.deposit_need) || 0).toFixed(2)}。商品可以正常浏览，但暂时不能购买。`}
              />
            ) : null}
            {detail.description ? <Alert type="info" showIcon message={detail.description} /> : null}
            <Flex gap={12} wrap>
              <Button type="primary" size="large" disabled={Number(detail.can_buy) === 0} onClick={openBuy}>
                {Number(detail.can_buy) === 0 ? '暂不可购买' : '立即购买'}
              </Button>
              <Button loading={favLoading} onClick={onFav}>{faved ? '★ 已收藏' : '☆ 收藏'}</Button>
              <Button onClick={() => setReportOpen(true)}>举报</Button>
            </Flex>
            <Text type="secondary">
              购买将实时从账号余额扣费；数字交付自动发货，实体交付由卖家填写快递单号。
            </Text>
            <Text type="secondary"><a onClick={() => navigate('/user/buy')}>查看我的购买</a></Text>
          </Flex>
        </Flex>
        {detail.content ? (
          <div className="detail-content md-content" style={{ marginTop: 'var(--space-5)' }}>
            <MdView id="shop-goods-detail-preview" modelValue={detail.content} />
          </div>
        ) : null}
      </Card>

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
        </Flex>
      </Modal>
    </div>
  );
};

export default ShopGoodsDetailPage;
