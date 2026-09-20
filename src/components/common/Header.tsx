import React, { useMemo, useState } from 'react';
import { Avatar, Button, Drawer, Dropdown, Flex, Grid, Menu, Space, Typography } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useSite } from '@/context/SiteContext';
import { getToken, clearToken } from '@/utils/auth';
import { toRoute } from '@/utils/route';

const { Text } = Typography;

interface NavItem {
    key: string;
    name: string;
    external: boolean;
    to?: string;
    href?: string;
}

/** feed 是独立插件，它的入口不在后台导航表 my_link 里，这里固定补一个入口 */
const BLOG_ENTRY: NavItem = { key: 'blogs', name: '博客广场', external: false, to: '/blogs' };

/** 当前路径是否命中该导航项 */
function isActive(pathname: string, to?: string): boolean {
    if (!to) return false;
    const p = (to.split('?')[0] || '/').replace(/\/+$/, '') || '/';
    if (p === '/home') return pathname === '/' || pathname === '/home';
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

    // 后端导航数据驱动；后端若未配置博客广场入口则补上
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
        if (!list.some((n) => n.to && n.to.startsWith('/blogs'))) list.push(BLOG_ENTRY);
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
            <Link to={item.to || '/home'}>{item.name}</Link>
        );

    const logout = () => {
        clearToken();
        setToken('');
        navigate('/home');
    };

    const userMenu = {
        items: [
            { key: 'profile', label: '个人中心' },
            { key: 'favorites', label: '我的收藏' },
            { key: 'submit', label: '提交站点' },
            { type: 'divider' as const },
            { key: 'logout', label: '退出登录' },
        ],
        onClick: ({ key }: { key: string }) => {
            if (key === 'logout') logout();
            else navigate(`/user${key === 'profile' ? '' : `/${key}`}`);
        },
    };

    const userArea = token ? (
        <Dropdown menu={userMenu} trigger={['click']} placement="bottomRight">
            <Avatar className="site-user-avatar">我</Avatar>
        </Dropdown>
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
                <Link to="/home" className="site-logo">
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
