import React, { useEffect, useState } from 'react';
import { useSite } from '@/context/SiteContext';
import { Button, Card, Col, Form, Input, List, Row, Space, Switch, Tag, Typography, message } from 'antd';
import { addSite, captchaUrl, getMyLinks, type MyLinkItem } from '@/services/userCenter';
import { getToken } from '@/utils/auth';
import { usePageMeta } from '@/hooks/usePageMeta';
import { Link, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { LinksSkeleton } from '@components/common/skeleton';

const { Title, Text, Paragraph } = Typography;

function linkStatus(open: number) {
    if (open === 1) return { color: 'green', text: '已通过' };
    if (open === 9) return { color: 'red', text: '已拒绝' };
    return { color: 'orange', text: '待审核' };
}

export default function LinksPage() {
    usePageMeta({ title: '友情链接' });
    const navigate = useNavigate();
    const { friendLinks } = useSite();
    const [codeSrc, setCodeSrc] = useState(() => captchaUrl());
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();
    const [isLogin, setIsLogin] = useState(!!getToken());

    const [myLinks, setMyLinks] = useState<MyLinkItem[]>([]);
    const [myLoading, setMyLoading] = useState(false);

    const refreshCode = () => setCodeSrc(captchaUrl());

    const loadMyLinks = () => {
        const key = getToken();
        if (!key) return;
        setMyLoading(true);
        getMyLinks(key, 'link')
            .then((r: any) => {
                if (r.code === 1) setMyLinks(r.data || []);
            })
            .catch(() => {})
            .finally(() => setMyLoading(false));
    };

    useEffect(() => {
        setIsLogin(!!getToken());
        loadMyLinks();
    }, []);

    const onFinish = (values: { name: string; url: string; code: string; nofollow?: boolean; xin?: boolean }) => {
        const key = getToken();
        if (!key) {
            message.warning('请先登录后再申请友链');
            return;
        }
        setSubmitting(true);
        addSite(key, {
            type: 'link',
            name: values.name,
            url: values.url,
            code: values.code,
            nofollow: values.nofollow ? 1 : 0,
            xin: values.xin ? 1 : 0,
        })
            .then((r: any) => {
                if (r.code === 1) {
                    message.success(r.msg || '申请提交成功，等待审核');
                    form.resetFields();
                    refreshCode();
                    loadMyLinks();
                } else {
                    message.error(r.msg || '提交失败');
                    refreshCode();
                }
            })
            .catch(() => message.error('提交失败，请稍后重试'))
            .finally(() => setSubmitting(false));
    };

    const friendCard = (
        <Card className="user-card">
            <Title level={4}>友情链接</Title>
            {friendLinks.length === 0 ? (
                <Text type="secondary">暂无友情链接</Text>
            ) : (
                <Space size={[12, 12]} wrap className="mt-16">
                    {friendLinks.map((l) => (
                        <Tag key={l.id} color="blue" style={{ fontSize: 'var(--fs-base)', padding: '4px 10px' }}>
                            <a href={l.lianjie} target="_blank" rel="noreferrer noopener">
                                {l.name}
                            </a>
                        </Tag>
                    ))}
                </Space>
            )}
        </Card>
    );

    if (!isLogin) {
        return (
            <Row className="container site-content links-page">
                <Col xs={24}>
                    {friendCard}
                    <Card className="user-card mt-24" style={{ textAlign: 'center', marginTop: 24 }}>
                        <Title level={5}>申请友链</Title>
                        <Paragraph type="secondary">登录后即可提交友链申请，审核通过后展示在上方。</Paragraph>
                        <Button type="primary" onClick={() => navigate('/login')}>
                            登录后申请友链
                        </Button>
                    </Card>
                </Col>
            </Row>
        );
    }

    return (
        <Row gutter={[24, 24]} className="container site-content links-page">
            <Col xs={24}>{friendCard}</Col>
            <Col xs={24} lg={12}>
                <Card className="user-card">
                    <Title level={5}>申请友链</Title>
                    <Paragraph type="secondary">
                        填写下方表单申请友链，审核通过后会出现在上方列表与全站底部。
                    </Paragraph>
                    <Form form={form} layout="vertical" className="submit-site-form" onFinish={onFinish}>
                        <Form.Item
                            label="站点名称"
                            name="name"
                            rules={[{ required: true, message: '请输入站点名称' }]}
                        >
                            <Input placeholder="例如：兴汉同盟" />
                        </Form.Item>
                        <Form.Item
                            label="站点链接"
                            name="url"
                            rules={[
                                { required: true, message: '请输入站点链接' },
                                { type: 'url', message: '请输入合法链接' },
                            ]}
                        >
                            <Input placeholder="https://example.com" />
                        </Form.Item>
                        <Form.Item label="nofollow" name="nofollow" valuePropName="checked" initialValue={false}>
                            <Space>
                                <Switch />
                                <Text type="secondary">搜索引擎不传递权重</Text>
                            </Space>
                        </Form.Item>
                        <Form.Item label="新窗口打开" name="xin" valuePropName="checked" initialValue={true}>
                            <Space>
                                <Switch />
                                <Text type="secondary">点击后在新的浏览器标签页打开</Text>
                            </Space>
                        </Form.Item>
                        <Form.Item
                            label="图形验证码"
                            name="code"
                            rules={[{ required: true, message: '请输入图形验证码' }]}
                        >
                            <Space.Compact style={{ width: '100%' }}>
                                <Input placeholder="请输入右侧验证码" />
                                <img
                                    src={codeSrc}
                                    alt="验证码"
                                    title="点击刷新"
                                    style={{ height: 32, cursor: 'pointer', marginLeft: 8 }}
                                    onClick={refreshCode}
                                />
                            </Space.Compact>
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={submitting}>
                                提交申请
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            </Col>

            <Col xs={24} lg={12}>
                <Card className="user-card">
                    <Title level={5}>我的友链</Title>
                    <Paragraph type="secondary">你提交的友链申请及审核状态（仅本人可见）。</Paragraph>
                    {myLoading ? (
                        <LinksSkeleton />
                    ) : myLinks.length === 0 ? (
                        <Text type="secondary">暂无申请记录</Text>
                    ) : (
                        <List
                            className="mylinks-list"
                            dataSource={myLinks}
                            renderItem={(l) => {
                                const st = linkStatus(l.open);
                                return (
                                    <List.Item className="mylink-item">
                                        <div className="mylink-line">
                                            <Text strong>{l.name}</Text>
                                            <Tag color={st.color}>{st.text}</Tag>
                                        </div>
                                        <div className="mylink-line">
                                            <a
                                                href={l.url}
                                                target="_blank"
                                                rel="noreferrer noopener"
                                                className="mylink-url"
                                            >
                                                {l.url}
                                            </a>
                                        </div>
                                        <div className="mylink-line mylink-time">
                                            {l.time ? dayjs.unix(Number(l.time)).format('YYYY-MM-DD HH:mm') : ''}
                                        </div>
                                    </List.Item>
                                );
                            }}
                        />
                    )}
                </Card>
            </Col>
        </Row>
    );
}
