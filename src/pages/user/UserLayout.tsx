import React, { useMemo } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Button, Menu, Spin, Tooltip, Typography, Upload, message } from 'antd';
import { userLogout, uploadFile } from '@/services/userCenter';
import { getToken, setToken } from '@/utils/auth';
import { usePageMeta } from '@/hooks/usePageMeta';
import { MemberProvider, useMember } from '@/context/MemberContext';

const { Text } = Typography;

const MENU = [
  {
    type: 'group' as const,
    label: '我的',
    children: [
      { key: '/user/mysites', label: <Link to="/user/mysites">我的站点</Link> },
      { key: '/user/columns', label: <Link to="/user/columns">我的专栏</Link> },
      { key: '/user/ad/my', label: <Link to="/user/ad/my">我的广告</Link> },
      { key: '/user/tools', label: <Link to="/user/tools">我的工具（待做）</Link> },
      { key: '/user/favorites', label: <Link to="/user/favorites">我的收藏</Link> },
      { key: '/user/reports', label: <Link to="/user/reports">我的举报</Link> },
    ],
  },
  {
    type: 'group' as const,
    label: '账号',
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
  '/user/columns': '我的专栏',
  '/user/ad/my': '我的广告',
  '/user/ad/buy': '申请广告位',
  '/user/favorites': '我的收藏',
  '/user/reports': '我的举报',
  '/user/tools': '我的工具',
  '/user/checkin': '每日签到',
  '/user/messages': '消息中心',
  '/user/balance': '余额明细',
};

function UserLayoutInner() {
  const navigate = useNavigate();
  const location = useLocation();
  usePageMeta({ title: TITLE_MAP[location.pathname] || '用户中心' });
  const { info, setInfo, loading } = useMember();

  const onLogout = () => {
    userLogout().catch(() => {});
    setToken('');
    navigate('/login');
  };

  const onUploadAvatar = (file: File) => {
    const key = getToken();
    if (!key) return false;
    if (!/^image\//.test(file.type)) {
      message.error('请选择图片文件');
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      message.error('图片不能超过 5MB');
      return false;
    }
    uploadFile(key, file, true)
      .then((r: any) => {
        if (r.code === 1) {
          const url = r.data?.url || '';
          setInfo((prev) => (prev ? { ...prev, head: url } : prev));
          message.success('头像已更新');
        } else {
          message.error(r.msg || '上传失败');
        }
      })
      .catch(() => message.error('上传失败，请稍后重试'));
    return false;
  };

  const selected = useMemo(() => {
    const p = location.pathname;
    if (p.startsWith('/user/ad/')) return '/user/ad/my';
    if (p === '/user/submit' || p.startsWith('/user/submit/')) return '/user/mysites';
    const matched = MENU_KEYS.find((k) => p === k || p.startsWith(k + '/'));
    return matched || '/user';
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
          <Upload accept="image/*" showUploadList={false} beforeUpload={onUploadAvatar}>
            <Tooltip title="点击更换头像">
              <Avatar src={info?.head} size={64} style={{ cursor: 'pointer' }}>
                {info?.name?.slice(0, 1)}
              </Avatar>
            </Tooltip>
          </Upload>
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

export default function UserLayout() {
  return (
    <MemberProvider>
      <UserLayoutInner />
    </MemberProvider>
  );
}
