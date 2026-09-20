import React, { useEffect, useState } from 'react';
import { Menu, Avatar, Button, Space } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { getToken } from '@/utils/auth';
import { getSite, getLinks, type SiteConfig, type LinkItem } from '@/services/userCenter';

export default function Header(): React.JSX.Element {
    const navigate = useNavigate();
    const location = useLocation();
    const [token, setToken] = useState<string>('');
    const [site, setSite] = useState<SiteConfig | null>(null);
    const [links, setLinks] = useState<LinkItem[]>([]);

    useEffect(() => {
        setToken(getToken());
        Promise.all([getSite(), getLinks()])
            .then(([s, l]) => {
                if (s.code === 1 && s.data) setSite(s.data);
                if (l.code === 1 && l.data) setLinks(l.data);
            })
            .catch(() => {});
    }, []);

    const getSelectedKey = (): string => {
        const path = location.pathname;
        if (path === '/home') return 'home';
        if (path.startsWith('/blogs')) return 'blogs';
        if (path.startsWith('/dan')) return 'dan';
        return 'home';
    };

    const topLinks = links.filter((l) => l.wz === 1);

    const menuItems = topLinks.map((item) => ({
        key: String(item.id),
        label: (
            <a
                href={item.lianjie}
                target={item.xin === 1 ? '_blank' : undefined}
                rel={item.xin === 1 ? 'noreferrer' : undefined}
            >
                {item.name}
            </a>
        ),
    }));

    return (
        <header className="site-header">
            <div className="container site-header-inner">
                <div className="site-logo" onClick={() => navigate('/home')}>
                    {site?.logo ? (
                        <img src={site.logo} alt={site.title || '兴汉同盟'} className="site-logo-img" />
                    ) : (
                        <span className="site-logo-text">{site?.title || '兴汉同盟'}</span>
                    )}
                </div>

                <div className="site-nav">
                    <Menu
                        mode="horizontal"
                        selectedKeys={[getSelectedKey()]}
                        className="site-nav-menu"
                        items={menuItems.length > 0 ? menuItems : [
                            { key: 'home', label: <a href="/home">首页</a> },
                            { key: 'blogs', label: <a href="/blogs">博客广场</a> },
                        ]}
                    />
                </div>

                <div className="site-user">
                    {token ? (
                        <Space>
                            <Avatar className="site-user-avatar" onClick={() => navigate('/user')}>
                                我
                            </Avatar>
                        </Space>
                    ) : (
                        <Button type="primary" onClick={() => navigate('/login')}>
                            登录
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
}
