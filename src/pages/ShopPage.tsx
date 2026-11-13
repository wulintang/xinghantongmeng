import React, { useEffect, useState } from 'react';
import {
  Alert, Avatar, Button, Card, Col, Empty, Flex, Pagination, Row, Segmented, Spin, Tag, Typography,
} from 'antd';
import { useNavigate } from 'react-router-dom';

import PageHeader from '@components/common/PageHeader';
import SearchBox from '@components/common/SearchBox';
import { usePageMeta } from '@/hooks/usePageMeta';
import { getShopConfig, getMallList, cateOptionsFrom, cateNameFrom, type MallGoodsItem, type ShopConfig } from '@/services/shop';

const { Text, Paragraph } = Typography;

const PAGE_SIZE = 12;

/** 独立集市（公开）：全站在售商品、后台类目筛选、搜索、分页；详情走独立单页 /shop/goods/:id */
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

  const cateOptions = cateOptionsFrom(cfg);
  const CATE_OPTIONS = [
    { label: '全部', value: 'all' },
    ...cateOptions.map((c) => ({ label: c.name, value: c.key })),
  ];

  const goDetail = (id: number) => navigate(`/shop/goods/${id}`);

  useEffect(() => {
    getShopConfig()
      .then((r: any) => { if (r.code === 1 && r.data) setCfg(r.data); })
      .catch(() => {});
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

  const renderCard = (g: MallGoodsItem) => (
    <Card
      hoverable
      className="shop-goods-card"
      onClick={() => goDetail(g.id)}
      cover={
        g.cover ? (
          <div className="shop-goods-cover"><img src={g.cover} alt={g.title} /></div>
        ) : (
          <div className="shop-goods-ico">{cateNameFrom(cfg, g.cate)?.[0] || '商'}</div>
        )
      }
    >
      <Flex vertical gap={8} style={{ flex: 1 }}>
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
          <Button type="link" size="small" onClick={(e) => { e.stopPropagation(); goDetail(g.id); }}>查看详情</Button>
        </Flex>
      </Flex>
    </Card>
  );

  return (
    <div className="shop-page">
      <PageHeader
        title="用户集市"
        description={cfg?.mall_notice || '域名、商标、软著、作品著作权与源码等虚拟资产交易，使用账号余额结算，平台统一担保与审核。'}
        crumbs={[{ label: '首页', to: '/' }, { label: '用户集市', to: '/shop' }]}
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
          <Text type="secondary">共 {total} 件在售商品</Text>
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
          <Row gutter={[16, 16]} align="stretch">
            {list.map((g) => (
              <Col key={g.id} xs={12} sm={12} md={8} lg={6}>{renderCard(g)}</Col>
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
    </div>
  );
};

export default ShopPage;
