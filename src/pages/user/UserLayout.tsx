import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Avatar, Typography, Spin, Button } from 'antd';
import {
  User,
  Star,
  Calendar,
  Bell,
  Wallet,
  FileText,
  AlertTriangle,
  LogOut,
  Send,
} from 'lucide-react';
import { getUserProfile, userLogout, type MemberInfo } from '@/services/userCenter';
import { getToken, setToken } from '@/utils/auth';

const { Sider, Content } = Layout;
const { Title, Text } = Typography;

const MENU = [
  { key: '/user', icon: <User size={14} />, label: <Link to="/user">个人资料</Link> },
  { key: '/user/favorites', icon: <Star size={14} />, label: <Link to="/user/favorites">我的收藏</Link> },
  { key: '/user/checkin', icon: <Calendar size={14} />, label: <Link to="/user/checkin">每日签到</Link> },
  { key: '/user/messages', icon: <Bell size={14} />, label: <Link to="/user/messages">消息中心</Link> },
  { key: '/user/balance', icon: <Wallet size={14} />, label: <Link to="/user/balance">余额明细</Link> },
  { key: '/user/orders', icon: <FileText size={14} />, label: <Link to="/user/orders">我的订单</Link> },
  { key: '/user/reports', icon: <AlertTriangle size={14} />, label: <Link to="/user/reports">我的举报</Link> },
  { key: '/user/submit', icon: <Send size={14} />, label: <Link to="/user/submit">提交站点</Link> },
];

export default function UserLayout() {
  const navigate = useNavigate();
  const location = useLocation();
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

  const selected = MENU.map((m) => m.key).includes(location.pathname)
    ? location.pathname
    : '/user';

  if (loading) {
    return (
      <div className="user-loading">
        <Spin />
      </div>
    );
  }

  return (
    <Layout className="user-layout-wrap">
      <Sider width={200} className="user-sider">
        <div className="user-sider-profile">
          <Avatar src={info?.head} size={56} icon={<User size={24} />} />
          <div className="mt-8">
            <Text strong>{info?.name}</Text>
          </div>
          <Text type="secondary" className="color-secondary-12">
            {info?.mail || info?.phone}
          </Text>
        </div>
        <Menu mode="inline" selectedKeys={[selected]} items={MENU} />
        <div className="user-sider-logout">
          <Button block icon={<LogOut size={14} />} onClick={onLogout}>
            退出登录
          </Button>
        </div>
      </Sider>
      <Content>
        <Outlet />
      </Content>
    </Layout>
  );
}
