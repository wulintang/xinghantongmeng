import React, { useEffect, useMemo, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Button, Menu, Spin, Typography } from 'antd';
import { getUserProfile, userLogout, type MemberInfo } from '@/services/userCenter';
import { getToken, setToken } from '@/utils/auth';
import { usePageMeta } from '@/hooks/usePageMeta';

const { Text } = Typography;

const MENU = [
  { key: '/user/submit', label: <Link to="/user/submit">提交站点</Link> },
  {
    type: 'group' as const,
    label: '我的',
    children: [
      { key: '/user/mysites', label: <Link to="/user/mysites">我的站点</Link> },
      { key: '/user/favorites', label: <Link to="/user/favorites">我的收藏</Link> },
      { key: '/user/ad/my', label: <Link to="/user/ad/my">我的广告</Link> },
      { key: '/user/reports', label: <Link to="/user/reports">我的举报</Link> },
    ],
  },
  {
    type: 'group' as const,
    label: '账户',
    children: [
      { key: '/user', label: <Link to="/user">个人资料</Link> },
      { key: '/user/checkin', label: <Link to="/user/checkin">每日签到</Link> },
      { key: '/user/messages', label: <Link to="/user/messages">消息中心</Link> },
      { key: '/user/balance', label: <Link to="/user/balance">余额明细</Link> },
    ],
  },
];

/** 拍平菜单树取全部 key，用于高亮判断 */
const MENU_KEYS = MENU.flatMap((m: any) => (m.children ? m.children.map((c: any) => c.key) : [m.key]));

/** 根据路径兜底设置浏览器标题（子页面 usePageMeta 会覆盖为更精确的标题） */
const TITLE_MAP: Record<string, string> = {
  '/user': '个人资料',
  '/user/submit': '提交站点',
  '/user/mysites': '我的站点',
  '/user/ad/my': '我的广告',
  '/user/ad/buy': '申请广告位',
  '/user/favorites': '我的收藏',
  '/user/reports': '我的举报',
  '/user/checkin': '每日签到',
  '/user/messages': '消息中心',
  '/user/balance': '余额明细',
};

export default function UserLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  usePageMeta({ title: TITLE_MAP[location.pathname] || '用户中心' });
  const [info, setInfo] = useState<MemberInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    const key = getToken();
    if (!key) {
      navigate('/login');
      return;
    }
    getUserProfile(key)
      .then((r: any) => {
        if (r.code === 1) setInfo(r.data);
        else navigate('/login');
      })
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [navigate]);

  const onLogout = () => {
    userLogout().catch(() => {});
    setToken('');
    navigate('/login');
  };

  const selected = useMemo(() => {
    if (location.pathname.startsWith('/user/ad/')) return '/user/ad/my';
    return MENU_KEYS.includes(location.pathname) ? location.pathname : '/user';
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="user-loading">
        <Spin />
      </div>
    );
  }

  return (
    <div className="user-layout-wrap">
      <aside className="user-sider">
        <div className="user-sider-profile">
          <Avatar src={info?.head} size={64}>
            {info?.name?.slice(0, 1)}
          </Avatar>
          <div className="user-sider-name">
            <Text strong>{info?.name}</Text>
          </div>
          <Text type="secondary" className="color-secondary-12">
            {info?.mail || info?.phone}
          </Text>
        </div>
        <Menu mode="inline" selectedKeys={[selected]} items={MENU} />
        <div className="user-sider-logout">
          <Button block onClick={onLogout}>
            退出登录
          </Button>
        </div>
      </aside>
      <section className="user-main">
        <Outlet />
      </section>
    </div>
  );
}
