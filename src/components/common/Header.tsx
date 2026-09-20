import React, { useEffect, useState } from 'react';
import { Menu, Row, Col, Typography, Avatar, Button, Space } from 'antd';
import { Link, useNavigate } from 'react-router-dom'; // 如果你项目用的是 next/link 就换成 next/link
import { getToken } from '@/utils/auth';

const { Text } = Typography;

export default function Header(): React.JSX.Element {
    const [pathname, setPathname] = useState<string>('');
    const navigate = useNavigate();
    const [token, setToken] = useState<string>('');

    // 渐变文字样式（完全保留）
    const siteNameStyle: React.CSSProperties = {
        fontSize: '22px',
        fontWeight: 500,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundImage: 'linear-gradient(to right, rgba(205, 28, 87, 1), rgba(126, 9, 184, 1))',
        cursor: 'pointer',
        textDecoration: 'none'
    };

    // 获取当前路径
    useEffect(() => {
        setPathname(window.location.pathname);
        setToken(getToken());
    }, []);

    // 导航选中逻辑
    const getSelectedKey = () => {
        if (pathname === '/home') return 'home';
        if (pathname === '/moments') return 'moments';
        if (pathname === '/monthly-selected') return 'monthly-selected';
        if (pathname.startsWith('/blogs')) return 'blogs';
        if (pathname.startsWith('/blog-requests/add')) return 'blog-add';
        if (pathname.startsWith('/blog-requests')) return 'blog-requests';
        return 'home';
    };

    // 导航菜单
    const menuItems = [
        { key: 'home', label: <Link to="/home">首页</Link> },
        { key: 'moments', label: <Link to="/moments">随手一拍</Link> },
        { key: 'monthly-selected', label: <Link to="/monthly-selected">每月精选</Link> },
        { key: 'blogs', label: <Link to="/blogs">博客广场</Link> },
        { key: 'planet-shuttle', label: <a href="/planet-shuttle" target="_blank" rel="noreferrer">星球穿梭</a> },
        { key: 'blog-add', label: <Link to="/blog-requests/add/email-validation">提交博客</Link> },
        { key: 'blog-requests', label: <Link to="/blog-requests">审核结果</Link> },
    ];

    return (
        <div style={{ marginTop: -8, marginBottom: 10 }}>
            <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 16px' }}>
                <Row align="middle" justify="space-between">
                    {/* 左侧 Logo */}
                    <Col flex="20%">
                        <div style={{ marginTop: 4 }}>
                            <Link to="/" style={siteNameStyle}>
                                兴汉同盟
                            </Link>
                        </div>
                    </Col>

                    {/* 右侧横向滚动导航 + 用户入口 */}
                    <Col flex="80%">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{
                                whiteSpace: 'nowrap',
                                overflowX: 'auto',
                                overflowY: 'hidden',
                                msOverflowStyle: 'none',
                                scrollbarWidth: 'none',
                                flex: 1
                            }}>
                                <Menu
                                    mode="horizontal"
                                    selectedKeys={[getSelectedKey()]}
                                    style={{
                                        fontWeight: 'bold',
                                        fontSize: 16,
                                        borderBottom: 'none'
                                    }}
                                    items={menuItems}
                                />
                            </div>
                            <div style={{ marginLeft: 16, flex: 'none' }}>
                                {token ? (
                                    <Space>
                                        <Avatar
                                            style={{ cursor: 'pointer', background: '#8a2b1d' }}
                                            onClick={() => navigate('/user')}
                                        >
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
                    </Col>
                </Row>
            </div>
        </div>
    );
}