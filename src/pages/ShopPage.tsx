import React, { useEffect, useState } from 'react';
import {
  Alert, Button, Card, Col, Empty, Flex, Pagination, Row, Typography,
} from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';

import PageHeader from '@components/common/PageHeader';
import ShopGoodsCard from '@components/common/ShopGoodsCard';
import SearchBox from '@components/common/SearchBox';
import { usePageMeta } from '@/hooks/usePageMeta';
import { getShopConfig, getMallList, cateOptionsFrom, type MallGoodsItem, type ShopConfig } from '@/services/shop';
import { ShopSkeleton } from '@components/common/skeleton';

const { Text } = Typography;

const PAGE_SIZE = 12;

/** 独立集市（公开）：全站在售商品、后台类目筛选、搜索、分页；详情走独立单页 /shop/goods/:id */
const ShopPage: React.FC = () => {
  usePageMeta({ title: '用户集市' });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shopUid = searchParams.get('uid') || '';

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
    getMallList({ cate, kw, page, limit: PAGE_SIZE, uid: shopUid || undefined })
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
  }, [cate, kw, page, shopUid]);

  return (
    <div className="shop-page">
      <PageHeader
        title={shopUid ? '店铺商品' : '用户集市'}
        description={shopUid
          ? '正在浏览该店铺的在售商品，使用账号余额结算，平台统一担保与审核。'
          : (cfg?.mall_notice || '域名、商标、软著、作品著作权与源码等虚拟资产交易，使用账号余额结算，平台统一担保与审核。')}
        crumbs={[{ label: '首页', to: '/' }, { label: '用户集市', to: '/shop' }]}
        extra={shopUid
          ? <Button onClick={() => navigate('/shop')}>返回全部集市</Button>
          : <Button onClick={() => navigate('/user/shop')}>我的集市</Button>}
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
          <Flex wrap gap={8} className="cate-filter-wrap">
            {CATE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`cate-chip${cate === opt.value ? ' cate-chip--active' : ''}`}
                onClick={() => { setPage(1); setCate(String(opt.value)); }}
              >
                {opt.label}
              </button>
            ))}
          </Flex>
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
        <ShopSkeleton />
      ) : list.length === 0 ? (
        <Card className="shop-empty"><Empty description="暂无在售商品" /></Card>
      ) : (
        <>
          <Row gutter={[16, 16]} align="stretch">
            {list.map((g) => (
              <Col key={g.id} xs={12} sm={12} md={8} lg={6}>
                <ShopGoodsCard item={g} cfg={cfg} onOpen={goDetail} />
              </Col>
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
