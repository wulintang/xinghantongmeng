import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Button, Card, Col, Empty, Flex, Row, Spin, Tabs, Tag, Typography } from 'antd';

import { getMemberHome, getMemberSites, getSkillsByUser, type MemberHomeInfo, type MemberSiteItem } from '@/services/userCenter';
import { getColumns, columnLink, type ColumnItem } from '@/services/column';
import { getUserRender, type MyRender } from '@/services/renderx';
import { buildCardBodyStyle, fgClassName } from '@/utils/renderxBg';
import { domainOf, assetUrl } from '@/utils/route';

const { Text } = Typography;

/**
 * 会员主页两张卡片（账户信息 + 站点/专栏/技能 Tabs）的唯一渲染实现。
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

/** 纯展示：两张卡片 + 真实数据（背景由 bg 注入，与 /user/:id 完全相同） */
export function UserHomeCards({ info, sites, columns, skills, loading = {}, bg }: UserHomeCardsProps) {
  const cardClass = fgClassName(bg);
  const cardBody = buildCardBodyStyle(bg);
  const icon = sexIcon(info?.sex ?? 0);

  return (
    <Flex vertical gap={16}>
      <Card className={cardClass} styles={{ body: cardBody }}>
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

      <Card className={cardClass} styles={{ body: cardBody }}>
        <Tabs
          defaultActiveKey="sites"
          items={[
            { key: 'sites', label: '站点', children: <UserSitesTab loading={!!loading.sites} sites={sites} /> },
            { key: 'columns', label: '专栏', children: <UserColumnsTab loading={!!loading.columns} columns={columns} /> },
            { key: 'skills', label: '技能', children: <UserSkillsTab loading={!!loading.skills} skills={skills} /> },
          ]}
        />
      </Card>
    </Flex>
  );
}

/**
 * 带数据的会员主页卡片：按 uid 拉取真实资料 / 站点 / 专栏 / 技能。
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
