import React, { useEffect, useMemo, useState } from 'react';
import { Avatar, Badge, Button, Drawer, Dropdown, Flex, Grid, Menu, Space, Tag, Typography, message } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useSite } from '@/context/SiteContext';
import { getToken, clearToken } from '@/utils/auth';
import { toRoute, assetUrl } from '@/utils/route';
import {
    doCheckin,
    getCheckin,
    getMessages,
    getUserProfile,
    type MemberInfo,
} from '@/services/userCenter';

const { Text } = Typography;

interface NavItem {
    key: string;
    name: string;
    external: boolean;
    to?: string;
    href?: string;
}

/** feed 是独立插件，它的入口不在后台导航表 my_link 里，这里固定补一个入口 */
const BLOG_ENTRY: NavItem = { key: 'feed', name: 'Feed广场', external: false, to: '/feed' };
/** 格子广告单页（广告增强插件 adpay），固定入口 */
const GRID_ENTRY: NavItem = { key: 'grid', name: '格子广告', external: false, to: '/grid' };

/** 当前路径是否命中该导航项 */
function isActive(pathname: string, to?: string): boolean {
    if (!to) return false;
    const p = (to.split('?')[0] || '/').replace(/\/+$/, '') || '/';
    if (p === '/') return pathname === '/';
    return pathname === p || pathname.startsWith(`${p}/`);
}

export default function Header(): React.JSX.Element {
    const navigate = useNavigate();
    const location = useLocation();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const { site, topLinks } = useSite();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [token, setToken] = useState<string>(() => getToken());
    const [me, setMe] = useState<MemberInfo | null>(null);
    const [checkinDone, setCheckinDone] = useState<boolean | null>(null);
    const [unread, setUnread] = useState(0);

    // 登录态/头像/签到/未读消息：路径变化时重读 token 并刷新；每 15s 轮询，确保同页操作产生新消息后 badge 实时更新
    useEffect(() => {
        let alive = true;
        const refresh = () => {
            const tk = getToken();
            setToken(tk);
            if (!tk) {
                setMe(null);
                setCheckinDone(null);
                setUnread(0);
                return;
            }
            getUserProfile(tk)
                .then((r: any) => {
                    if (alive && r.code === 1) setMe(r.data);
                })
                .catch(() => {});
            getCheckin(tk)
                .then((r: any) => {
                    if (alive && r.code === 1) setCheckinDone(r.data.today_done === 1);
                })
                .catch(() => {});
            getMessages(tk)
                .then((r: any) => {
                    if (alive && r.code === 1) setUnread((r.data || []).filter((m: any) => !m.open).length);
                })
                .catch(() => {});
        };
        refresh();
        const timer = setInterval(refresh, 15000);
        return () => {
            alive = false;
            clearInterval(timer);
        };
    }, [location.pathname]);

    const onCheckin = () => {
        if (!token) return;
        doCheckin(token)
            .then((r: any) => {
                if (r.code === 1) {
                    message.success(r.msg || '签到成功');
                    setCheckinDone(true);
                } else {
                    message.info(r.msg || '今天已签到');
                    setCheckinDone(true);
                }
            })
            .catch(() => message.error('签到失败，请稍后重试'));
    };

    // 后端导航数据驱动；后端若未配置 Feed广场入口则补上
    const navItems = useMemo<NavItem[]>(() => {
        const list: NavItem[] = topLinks.map((l) => {
            const t = toRoute(l.lianjie);
            return {
                key: `link-${l.id}`,
                name: l.name,
                external: t.external,
                to: t.to,
                href: t.href,
            };
        });
        if (!list.some((n) => n.to && n.to.startsWith('/feed'))) list.push(BLOG_ENTRY);
        if (!list.some((n) => n.to && n.to.startsWith('/grid'))) list.push(GRID_ENTRY);
        return list;
    }, [topLinks]);

    const selectedKey = useMemo(() => {
        const hit = navItems.find((n) => !n.external && isActive(location.pathname, n.to));
        return hit ? hit.key : '';
    }, [navItems, location.pathname]);

    const renderNavLabel = (item: NavItem): React.ReactNode =>
        item.external ? (
            <a href={item.href} target="_blank" rel="noreferrer noopener">
                {item.name}
            </a>
        ) : (
            <Link to={item.to || '/'}>{item.name}</Link>
        );

    const logout = () => {
        clearToken();
        setToken('');
        navigate('/');
    };

    const userMenu = {
        items: [
            { key: 'submit', label: '提交站点' },
            { key: 'mysites', label: '我的站点' },
            { type: 'divider' as const },
            { key: 'profile', label: '个人中心' },
            { key: 'favorites', label: '我的收藏' },
            { type: 'divider' as const },
            { key: 'logout', label: '退出登录' },
        ],
        onClick: ({ key }: { key: string }) => {
            if (key === 'logout') logout();
            else navigate(`/user${key === 'profile' ? '' : `/${key}`}`);
        },
    };

    const userArea = token ? (
        <Space size={10} align="center">
            {checkinDone === true ? (
                <Tag color="green">已签到</Tag>
            ) : checkinDone === false ? (
                <Button size="small" onClick={onCheckin}>
                    签到
                </Button>
            ) : null}
            <Badge count={unread} size="small">
                <Button size="small" onClick={() => navigate('/user/messages')}>
                    消息
                </Button>
            </Badge>
            <Dropdown menu={userMenu} trigger={['click']} placement="bottomRight">
                <Avatar src={assetUrl(me?.head) || undefined} className="site-user-avatar">
                    {me?.name?.slice(0, 1) || '我'}
                </Avatar>
            </Dropdown>
        </Space>
    ) : (
        <Space>
            <Button onClick={() => navigate('/login')}>登录</Button>
            <Button type="primary" onClick={() => navigate('/register')}>
                注册
            </Button>
        </Space>
    );

    return (
        <header className="site-header">
            <div className="container site-header-inner">
                <Link to="/" className="site-logo">
                    {site?.logo ? (
                        <img src={site.logo} alt={site.title || ''} className="site-logo-img" />
                    ) : (
                        <Text strong className="site-logo-text">
                            {site?.title || '兴汉同盟'}
                        </Text>
                    )}
                </Link>

                {isMobile ? (
                    <Button onClick={() => setDrawerOpen(true)}>导航</Button>
                ) : (
                    <div className="site-nav">
                        <Menu
                            mode="horizontal"
                            className="site-nav-menu"
                            disabledOverflow
                            selectedKeys={selectedKey ? [selectedKey] : []}
                            items={navItems.map((n) => ({ key: n.key, label: renderNavLabel(n) }))}
                        />
                    </div>
                )}

                <div className="site-user">{userArea}</div>
            </div>

            <Drawer
                title={site?.title || '兴汉同盟'}
                placement="right"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                width={260}
            >
                <Flex vertical gap={16}>
                    <Menu
                        mode="inline"
                        selectedKeys={selectedKey ? [selectedKey] : []}
                        items={navItems.map((n) => ({ key: n.key, label: renderNavLabel(n) }))}
                        onClick={() => setDrawerOpen(false)}
                    />
                    <div
                        onClick={() => {
                            setDrawerOpen(false);
                            navigate(token ? '/user' : '/login');
                        }}
                    >
                        <Button type="primary" block>
                            {token ? '个人中心' : '登录 / 注册'}
                        </Button>
                    </div>
                </Flex>
            </Drawer>
        </header>
    );
}
