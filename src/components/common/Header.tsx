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

/** 广场 / 格子 由前端补充：后台 my_link 无此条目。
 *  广场=feed 插件聚合(调 /feed，展示 my_feed_post)；格子=格子广告(调 /grid)。 */
const BLOG_ENTRY: NavItem = { key: 'feed', name: '广场', external: false, to: '/feed' };
const GRID_ENTRY: NavItem = { key: 'grid', name: '格子', external: false, to: '/grid' };

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

    // 前四项（首页/站点/专栏/工具）由后台 my_link 定义驱动，前端只补「广场、格子」两项
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
        if (!list.some((n) => n.to && (n.to === '/feed' || n.to.startsWith('/feed/')))) list.push(BLOG_ENTRY);
        if (!list.some((n) => n.to && (n.to === '/grid' || n.to.startsWith('/grid/')))) list.push(GRID_ENTRY);
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
            { key: 'mysites', label: '我的站点' },
            { key: 'columns', label: '我的专栏' },
            { key: 'ad/my', label: '我的广告' },
            { key: 'tools', label: '我的工具（待做）' },
            { key: 'favorites', label: '我的收藏' },
            { key: 'reports', label: '我的举报' },
            { type: 'divider' as const },
            { key: 'account', label: '账号管理' },
            { key: 'logout', label: '退出登录' },
        ],
        onClick: ({ key }: { key: string }) => {
            if (key === 'logout') {
                logout();
                return;
            }
            const map: Record<string, string> = {
                mysites: '/user/mysites',
                columns: '/user/columns',
                'ad/my': '/user/ad/my',
                tools: '/user/tools',
                favorites: '/user/favorites',
                reports: '/user/reports',
                account: '/user',
            };
            navigate(map[key] || '/user');
        },
    };

    const userArea = token ? (
        <Space size={10} align="center">
            {checkinDone === true ? (
                <Button size="small" type="primary" onClick={() => navigate('/user/checkin')}>
                    已签到
                </Button>
            ) : checkinDone === false ? (
                <Button size="small" type="primary" ghost onClick={() => navigate('/user/checkin')}>
                    签到
                </Button>
            ) : null}
            <Badge count={unread} size="small">
                <Button size="small" onClick={() => navigate('/user/messages')}>
                    消息
                </Button>
            </Badge>
            <Dropdown menu={userMenu} trigger={['hover']} placement="bottomRight">
                <div
                    className="site-user-avatar-wrap"
                    style={{ display: 'inline-flex', cursor: 'pointer' }}
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate('/user');
                    }}
                >
                    <Avatar src={assetUrl(me?.head) || undefined} className="site-user-avatar">
                        {me?.name?.slice(0, 1) || '我'}
                    </Avatar>
                </div>
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
                            {token ? '账号管理' : '登录 / 注册'}
                        </Button>
                    </div>
                </Flex>
            </Drawer>
        </header>
    );
}
