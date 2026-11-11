import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Button, Card, Col, Empty, Flex, Modal, Row, Select, Spin, Tabs, Tag, Typography, message } from 'antd';

import { getMemberHome, getMemberSites, getSkillsByUser, type MemberHomeInfo, type MemberSiteItem } from '@/services/userCenter';
import { getColumns, columnLink, type ColumnItem } from '@/services/column';
import { getUserRender, type MyRender } from '@/services/userBg';
import { getShopInfo, getGoodsList, getAddresses, buyGoods, genOrderSn, CATE_NAME, type GoodsItem } from '@/services/shop';
import { buildCardBodyStyle, buildCardBackgroundValue, fgClassName } from '@/utils/userBgStyle';
import { domainOf, assetUrl } from '@/utils/route';

const { Text } = Typography;

/**
 * 会员主页两张卡片（账户信息 + 站点/专栏/技能/商城 Tabs）的唯一渲染实现。
 * /user/:id 公开主页与「主页背景」设置页预览共用，因此预览永远等于真实主页：
 * 没有示例文案、没有第二套样式、数据来自同一批接口。
 */
export interface UserHomeCardsProps {
  info: MemberHomeInfo | null;
  sites: MemberSiteItem[];
  columns: ColumnItem[];
  skills: any[];
  loading?: { sites?: boolean; columns?: boolean; skills?: boolean };
  bg?: MyRender | null;
}

function sexIcon(sex: number): string {
  if (sex === 1) return '♂';
  if (sex === 2) return '♀';
  return '';
}

function UserSitesTab({ loading, sites }: { loading: boolean; sites: MemberSiteItem[] }) {
  if (loading) return <Spin />;
  if (!sites.length) return <Empty description="该会员暂无已收录的站点" />;
  return (
    <Row gutter={[16, 16]}>
      {sites.map((s) => (
        <Col key={s.id} xs={24} sm={12} md={8}>
          <Link to={`/${domainOf(s)}`} className="member-site-card">
            <Avatar shape="square" size={48} src={s.ico || s.pic || undefined}>
              {(s.title || s.www || '?').slice(0, 1)}
            </Avatar>
            <div className="member-site-body">
              <div className="member-site-title">{s.title || s.www}</div>
              <div className="member-site-desc">
                {s.content ? s.content.replace(/<[^>]+>/g, '').slice(0, 40) + '…' : '暂无描述'}
              </div>
              <div className="member-site-url">{s.domain || s.www}</div>
            </div>
          </Link>
        </Col>
      ))}
    </Row>
  );
}

function UserColumnsTab({ loading, columns }: { loading: boolean; columns: ColumnItem[] }) {
  if (loading) return <Spin />;
  if (!columns.length) return <Empty description="该会员暂无专栏" />;
  return (
    <Row gutter={[16, 16]}>
      {columns.map((c) => (
        <Col key={c.id} xs={24} sm={12} md={8}>
          <Link to={columnLink(c)} className="member-column-card">
            <Avatar shape="square" size={48} src={assetUrl(c.pic) || undefined}>
              {(c.name || '?').slice(0, 1)}
            </Avatar>
            <div className="member-column-body">
              <div className="member-column-title">{c.name}</div>
              <div className="member-column-desc">{c.description || '暂无简介'}</div>
            </div>
          </Link>
        </Col>
      ))}
    </Row>
  );
}

function UserSkillsTab({ loading, skills }: { loading: boolean; skills: any[] }) {
  if (loading) return <Spin />;
  if (!skills.length) return <Empty description="该会员暂无已上线的技能" />;
  return (
    <Row gutter={[16, 16]}>
      {skills.map((s) => (
        <Col key={s.id} xs={24} sm={12} md={8}>
          <Link to={s.toolbox_id ? `/tools/${s.toolbox_id}` : '/tools'} className="member-site-card">
            <Avatar shape="square" size={48} src={s.pic || undefined}>
              {(s.title || '?').slice(0, 1)}
            </Avatar>
            <div className="member-site-body">
              <div className="member-site-title">{s.title || '未命名技能'}</div>
              <div className="member-site-desc">
                {s.content ? s.content.replace(/<[^>]+>/g, '').slice(0, 40) + '…' : '暂无描述'}
              </div>
            </div>
          </Link>
        </Col>
      ))}
    </Row>
  );
}

const SHOP_CATES = [
  { key: 'all', label: '全部' },
  { key: 'domain', label: CATE_NAME.domain },
  { key: 'brand', label: CATE_NAME.brand },
  { key: 'soft', label: CATE_NAME.soft },
  { key: 'copyright', label: CATE_NAME.copyright },
  { key: 'code', label: CATE_NAME.code },
];

function UserShopTab({ uid }: { uid: string }) {
  const [shop, setShop] = useState<any | null>(null);
  const [goods, setGoods] = useState<GoodsItem[]>([]);
  const [cate, setCate] = useState('all');
  const [loading, setLoading] = useState(true);
  const [buyTarget, setBuyTarget] = useState<GoodsItem | null>(null);
  const [addrId, setAddrId] = useState<number>(0);
  const [addrOptions, setAddrOptions] = useState<{ value: number; label: string }[]>([]);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    getShopInfo(uid)
      .then((r: any) => {
        if (!alive) return;
        if (r.code === 1 && r.data) {
          setShop(r.data);
          return getGoodsList(r.data.id, 'all');
        }
        setShop(null);
        return null;
      })
      .then((g: any) => {
        if (alive && g && g.code === 1) setGoods(g.data || []);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [uid]);

  const openBuy = (g: GoodsItem) => {
    setBuyTarget(g);
    if (g.delivery === 'physical') {
      getAddresses()
        .then((r: any) => {
          if (r.code === 1 && Array.isArray(r.data)) {
            setAddrOptions(
              r.data.map((a: any) => ({
                value: a.id,
                label: `${a.name} ${a.phone} ${a.province || ''}${a.city || ''}${a.district || ''}${a.detail}`,
              }))
            );
            const def = r.data.find((a: any) => a.is_default === 1) || r.data[0];
            setAddrId(def ? def.id : 0);
          }
        })
        .catch(() => {});
    }
  };

  const doBuy = () => {
    if (!buyTarget) return;
    if (buyTarget.delivery === 'physical' && !addrId) {
      message.warning('请选择收货地址');
      return;
    }
    setBuying(true);
    buyGoods(buyTarget.id, genOrderSn(), buyTarget.delivery === 'physical' ? addrId : 0)
      .then((r: any) => {
        if (r.code === 1) {
          message.success(buyTarget.delivery === 'digital' ? '购买成功，已自动交付' : '下单成功，等待卖家发货');
          setBuyTarget(null);
        } else {
          message.error(r.msg || '购买失败');
        }
      })
      .catch((e) => message.error(e?.message || '购买失败'))
      .finally(() => setBuying(false));
  };

  if (loading) return <Spin />;
  if (!shop) return <Empty description="该会员暂未开店或店铺审核中" />;

  const shown = cate === 'all' ? goods : goods.filter((g) => g.cate === cate);

  return (
    <div>
      <Flex gap={16} align="center" wrap style={{ marginBottom: 'var(--space-4)' }}>
        <Avatar shape="square" size={48} style={{ background: 'var(--c-link)' }}>
          {(shop.shop_name || '?').slice(0, 1)}
        </Avatar>
        <Flex vertical gap={2}>
          <Flex align="center" gap={8}>
            <Text strong style={{ fontSize: 'var(--fs-lg)' }}>{shop.shop_name}</Text>
            {shop.status === 1 ? <Tag color="green">营业中</Tag> : <Tag color="orange">审核中</Tag>}
          </Flex>
          {shop.intro ? <Text type="secondary" style={{ fontSize: 'var(--fs-sm)' }}>{shop.intro}</Text> : null}
        </Flex>
      </Flex>

      <Tabs
        items={SHOP_CATES.map((c) => ({
          key: c.key,
          label: c.label,
        }))}
        activeKey={cate}
        onChange={(k) => setCate(k)}
        size="small"
        style={{ marginBottom: 'var(--space-3)' }}
      />

      {shown.length === 0 ? (
        <Empty description="该分类暂无商品" />
      ) : (
        <Row gutter={[16, 16]}>
          {shown.map((g) => (
            <Col key={g.id} xs={24} sm={12} md={8}>
              <Card size="small" style={{ height: '100%' }}>
                <Flex vertical gap={6}>
                  <Flex align="center" justify="space-between" gap={8}>
                    <Text strong ellipsis>{g.title}</Text>
                    <Tag color={g.delivery === 'digital' ? 'cyan' : 'orange'}>
                      {g.delivery === 'digital' ? '数字交付' : '实体交付'}
                    </Tag>
                  </Flex>
                  <Flex gap={6} wrap>
                    <Tag>{CATE_NAME[g.cate]}</Tag>
                    {g.delivery_note ? <Text type="secondary" style={{ fontSize: 'var(--fs-xs)' }}>{g.delivery_note}</Text> : null}
                  </Flex>
                  <Flex align="center" justify="space-between">
                    <Text style={{ color: 'var(--capsule-danger)', fontWeight: 600 }}>¥{Number(g.price).toFixed(2)}</Text>
                    <Button type="primary" size="small" onClick={() => openBuy(g)}>购买</Button>
                  </Flex>
                </Flex>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title={buyTarget?.title}
        open={!!buyTarget}
        onCancel={() => setBuyTarget(null)}
        onOk={doBuy}
        confirmLoading={buying}
        okText="确认购买"
        cancelText="取消"
        destroyOnClose
      >
        {buyTarget ? (
          <Flex vertical gap={12}>
            <Flex justify="space-between">
              <Text type="secondary">价格</Text>
              <Text strong style={{ color: 'var(--capsule-danger)' }}>¥{Number(buyTarget.price).toFixed(2)}</Text>
            </Flex>
            <Flex justify="space-between">
              <Text type="secondary">交付方式</Text>
              <Tag color={buyTarget.delivery === 'digital' ? 'cyan' : 'orange'}>
                {buyTarget.delivery === 'digital' ? '数字交付（自动发货）' : '实体交付（需物流）'}
              </Tag>
            </Flex>
            {buyTarget.delivery === 'physical' ? (
              <div>
                <Text type="secondary">收货地址</Text>
                <Select
                  style={{ width: '100%', marginTop: 6 }}
                  placeholder="选择收货地址"
                  value={addrId || undefined}
                  onChange={(v) => setAddrId(v)}
                  options={addrOptions}
                />
              </div>
            ) : null}
            <Text type="secondary" style={{ fontSize: 'var(--fs-xs)' }}>
              将从你的余额实扣（真扣费），确认即下单。
            </Text>
          </Flex>
        ) : null}
      </Modal>
    </div>
  );
}

/** 纯展示：两张卡片 + 真实数据（背景由 bg 注入，与 /user/:id 完全相同） */
export function UserHomeCards({ info, sites, columns, skills, loading = {}, bg }: UserHomeCardsProps) {
  const cardClass = fgClassName(bg);
  const cardBody = buildCardBodyStyle(bg);
  // 背景严格只作用于顶部「用户信息」卡：由根元素 --rx-user-bg 单一变量驱动，
  // antd 表面 token 不参与，浅色/深色主题下都一致显示。
  const bgValue = buildCardBackgroundValue(bg);
  const topCardClass = bgValue ? `rx-user-card ${cardClass}`.trim() : cardClass;
  const topCardStyle = bgValue
    ? ({ '--rx-user-bg': bgValue } as React.CSSProperties)
    : undefined;
  const icon = sexIcon(info?.sex ?? 0);

  return (
    <Flex vertical gap={16}>
      <Card className={topCardClass} style={topCardStyle} styles={{ body: cardBody }}>
        <Flex gap={20} align="center" wrap>
          <Avatar shape="square" size={72} src={info?.head || undefined}>
            {(info?.name || '?').slice(0, 1)}
          </Avatar>
          <Flex vertical gap={6}>
            <Flex align="center" gap={8}>
              <Text strong style={{ fontSize: 'var(--fs-xl)' }}>
                {info?.name || ''}
              </Text>
              {icon ? (
                <Tag color={info?.sex === 1 ? 'blue' : 'magenta'} style={{ marginInlineEnd: 0 }}>
                  {icon}
                </Tag>
              ) : null}
              {info?.home ? (
                <Button size="small" type="link" href={info.home} target="_blank" rel="noreferrer">
                  个人主页
                </Button>
              ) : null}
            </Flex>
            {/* 与 /user/:id 完全一致：无签名时不显示，不写入任何虚构内容 */}
            {info?.description ? (
              <Text type="secondary" style={{ fontSize: 'var(--fs-base)' }}>
                {info.description}
              </Text>
            ) : null}
          </Flex>
        </Flex>
      </Card>

      {/* 下方内容卡不是用户信息：保持站点统一表面，不注入任何背景或前景色 */}
      <Card>
        <Tabs
          defaultActiveKey="sites"
          items={[
            { key: 'sites', label: '站点', children: <UserSitesTab loading={!!loading.sites} sites={sites} /> },
            { key: 'columns', label: '专栏', children: <UserColumnsTab loading={!!loading.columns} columns={columns} /> },
            { key: 'skills', label: '技能', children: <UserSkillsTab loading={!!loading.skills} skills={skills} /> },
            { key: 'shop', label: '商城', children: <UserShopTab uid={info?.id ? String(info.id) : ''} /> },
          ]}
        />
      </Card>
    </Flex>
  );
}

/**
 * 带数据的会员主页卡片：按 uid 拉取真实资料 / 站点 / 专栏 / 技能 / 店铺。
 * 用于「主页背景」设置页预览（传入正在编辑的 bg），零示例数据。
 */
export function UserHomePreview({ uid, bg }: { uid: string; bg?: MyRender | null }) {
  const [info, setInfo] = useState<MemberHomeInfo | null>(null);
  const [sites, setSites] = useState<MemberSiteItem[]>([]);
  const [columns, setColumns] = useState<ColumnItem[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState({ sites: true, columns: true, skills: true });
  const [bgState, setBgState] = useState<MyRender | null>(null);

  useEffect(() => {
    if (bg !== undefined || !uid) return;
    let alive = true;
    getUserRender(uid)
      .then((r: any) => {
        if (alive && r.code === 1 && r.data) setBgState(r.data);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [bg, uid]);

  useEffect(() => {
    if (!uid) return;
    let alive = true;
    getMemberHome(uid)
      .then((r: any) => {
        if (alive) setInfo(r.code === 1 ? r.data || null : null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    let alive = true;
    setLoading((v) => ({ ...v, sites: true }));
    getMemberSites(uid)
      .then((r: any) => {
        if (alive) setSites(r.code === 1 ? r.data || [] : []);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading((v) => ({ ...v, sites: false }));
      });
    return () => {
      alive = false;
    };
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    let alive = true;
    const idNum = Number(uid) || 0;
    setLoading((v) => ({ ...v, columns: true }));
    getColumns()
      .then((r) => {
        if (alive) setColumns(r.code === 1 && r.data ? r.data.filter((c) => c.uid === idNum) : []);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading((v) => ({ ...v, columns: false }));
      });
    return () => {
      alive = false;
    };
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    let alive = true;
    setLoading((v) => ({ ...v, skills: true }));
    getSkillsByUser(uid)
      .then((r: any) => {
        if (alive) setSkills(r.code === 1 ? r.data || [] : []);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading((v) => ({ ...v, skills: false }));
      });
    return () => {
      alive = false;
    };
  }, [uid]);

  return (
    <UserHomeCards
      info={info}
      sites={sites}
      columns={columns}
      skills={skills}
      loading={loading}
      bg={bg !== undefined ? bg : bgState}
    />
  );
}

export default UserHomeCards;
