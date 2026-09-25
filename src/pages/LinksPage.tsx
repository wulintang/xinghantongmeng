import React, { useEffect, useState } from 'react';
import { useSite } from '@/context/SiteContext';
import { Button, Card, Form, Input, List, Space, Tag, Tooltip, Typography, message } from 'antd';
import { addSite, captchaUrl, getBalance, getDan, getMyLinks, getCustomConfig, type CustomConfig, type MyLinkItem } from '@/services/userCenter';
import { getToken } from '@/utils/auth';
import { usePageMeta } from '@/hooks/usePageMeta';
import { Link, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { LinksSkeleton } from '@components/common/skeleton';
import { markdownToHtml, sanitizeHtml } from '@/utils/CommonUtil';

const { Title, Text, Paragraph } = Typography;

function linkStatus(open: number) {
    if (open === 1) return { color: 'green', text: '已通过' };
    if (open === 9) return { color: 'red', text: '已拒绝' };
    return { color: 'orange', text: '待审核' };
}

export default function LinksPage() {
    usePageMeta({ title: '友情链接' });
    const navigate = useNavigate();
    const { friendLinks, site } = useSite();
    const [codeSrc, setCodeSrc] = useState(() => captchaUrl());
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();
    const [isLogin, setIsLogin] = useState(!!getToken());

    const [myLinks, setMyLinks] = useState<MyLinkItem[]>([]);
    const [myLoading, setMyLoading] = useState(false);

    const [danTitle, setDanTitle] = useState('');
    const [danContent, setDanContent] = useState('');

    const [custom, setCustom] = useState<CustomConfig | null>(null);

    const linkFee = Number(site?.l_rmb || 0);

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
        let alive = true;
        setIsLogin(!!getToken());
        loadMyLinks();
        const key = getToken();
        getDan('links', 0, key || '')
            .then((r: any) => {
                if (alive && r.code === 1 && r.data) {
                    setDanTitle(r.data.title || '友链说明');
                    setDanContent(r.data.content || '');
                }
            })
            .catch(() => {});
        return () => {
            alive = false;
        };
    }, []);

    // 自定义配置（公开接口）：域名/logo 用于生成友链申请提醒代码
    useEffect(() => {
        getCustomConfig()
            .then((r: any) => {
                if (r.code === 1 && r.data) setCustom(r.data);
            })
            .catch(() => {});
    }, []);

    const onFinish = (values: { name: string; url: string; code: string }) => {
        const key = getToken();
        if (!key) {
            message.warning('请先登录后再申请友链');
            return;
        }
        setSubmitting(true);
        message.open({ key: 'pay', type: 'loading', content: '查询余额中…', duration: 0 });
        getBalance(key)
            .then((r: any) => {
                const balance = r.code === 1 && r.data ? Number(r.data.total || 0) : 0;
                if (linkFee > 0 && balance < linkFee) {
                    message.open({ key: 'pay', type: 'error', content: `余额不足，友链申请需 ¥${linkFee}，请先充值`, duration: 2.5 });
                    setTimeout(() => navigate('/user/balance'), 1000);
                    return;
                }
                return addSite(key, {
                    type: 'link',
                    name: values.name,
                    url: values.url,
                    code: values.code,
                    open: 1,
                    xin: 1,
                })
                    .then((r: any) => {
                        if (r.code === 1) {
                            message.open({ key: 'pay', type: 'success', content: linkFee > 0 ? `申请成功，已扣除 ¥${linkFee}` : (r.msg || '申请提交成功，等待审核'), duration: 3 });
                            form.resetFields();
                            refreshCode();
                            loadMyLinks();
                        } else {
                            message.open({ key: 'pay', type: 'error', content: r.msg || '提交失败', duration: 3 });
                            refreshCode();
                        }
                    })
                    .catch(() => message.open({ key: 'pay', type: 'error', content: '提交失败，请稍后重试', duration: 3 }));
            })
            .catch(() => message.open({ key: 'pay', type: 'error', content: '提交失败，请稍后重试', duration: 3 }))
            .finally(() => setSubmitting(false));
    };

    const friendCard = (
        <Card className="links-friend-card">
            <Title level={4}>友情链接</Title>
            {friendLinks.length === 0 ? (
                <Text type="secondary">暂无友情链接</Text>
            ) : (
                <Space size={[12, 12]} wrap className="mt-16">
                    {friendLinks.map((l) => (
                    <Tag key={l.id} color="blue" className="link-tag">
                        <Tooltip title={l.name}>
                            <a href={l.lianjie} target="_blank" rel="noreferrer noopener">
                                {l.name}
                            </a>
                        </Tooltip>
                    </Tag>
                    ))}
                </Space>
            )}
        </Card>
    );

    const descCard = danContent ? (
        <Card className="links-desc-card">
            <Title level={4}>申请友链情况说明</Title>
            {(() => {
                const raw = danContent || '';
                const isHtml = /<[a-z][\s\S]*>/i.test(raw);
                return isHtml ? (
                    <div className="detail-content" dangerouslySetInnerHTML={{ __html: sanitizeHtml(raw) }} />
                ) : (
                    <div className="detail-content md-content" dangerouslySetInnerHTML={{ __html: sanitizeHtml(markdownToHtml(raw)) }} />
                );
            })()}
        </Card>
    ) : null;

    // 复制代码：优先 Clipboard API，失败回退 execCommand
    const fallbackCopy = (code: string, done: () => void, fail: () => void) => {
        const ta = document.createElement('textarea');
        ta.value = code;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
            if (document.execCommand('copy')) done();
            else fail();
        } catch {
            fail();
        }
        document.body.removeChild(ta);
    };
    const copyCode = (code: string) => {
        const done = () => message.success('已复制代码');
        const fail = () => message.error('复制失败，请手动复制');
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(code).then(done).catch(() => fallbackCopy(code, done, fail));
        } else {
            fallbackCopy(code, done, fail);
        }
    };

    // 友情链接申请提醒：从自定义配置读取域名/logo，生成需放在贵站的本站链接代码
    const friendDomain = custom?.domain || '';
    const friendLogo = custom?.logo || '';
    const friendTitle = site?.title || '本站';
    const textLinkCode = friendDomain
        ? `<a href="${friendDomain}" target="_blank">${friendTitle}</a>`
        : '';
    const logoLinkCode =
        friendDomain && friendLogo
            ? `<a href="${friendDomain}" target="_blank"><img src="${friendLogo}" alt="${friendTitle}"></a>`
            : '';

    const applyNotice =
        friendDomain ? (
            <Card className="links-notice-card">
                <Title level={4}>申请友情链接前，请先在贵站做上本站的友情链接</Title>
                <ul className="links-notice-list">
                    <li>如果在贵站未发现本站文字链接或者贵站不符合本站要求，友情链接将不会生效；本站在贵站上只做文字链接就可以了。</li>
                    <li>如果贵站流量高，贵站友情链接可以排在本站前五位展示。</li>
                    <li>申请链接的网站应美观大方，有一定的内容，且内容健康丰富，并基本建设完成。</li>
                </ul>
                <div className="links-code-row">
                    {logoLinkCode ? (
                        <div className="links-code-col">
                            <div className="links-code-label">本站 LOGO 链接地址</div>
                            <pre className="links-code-block">{logoLinkCode}</pre>
                            <Button size="small" onClick={() => copyCode(logoLinkCode)}>复制代码</Button>
                        </div>
                    ) : null}
                    <div className="links-code-col">
                        <div className="links-code-label">本站文字链接地址</div>
                        <pre className="links-code-block">{textLinkCode}</pre>
                        <Button size="small" onClick={() => copyCode(textLinkCode)}>复制代码</Button>
                    </div>
                </div>
            </Card>
        ) : null;

    if (!isLogin) {
        return (
            <div className="container site-content links-page">
            {friendCard}
            {descCard}
            {applyNotice}
            <Card className="links-center-card">
                    <Title level={4}>申请友链</Title>
                    <Paragraph type="secondary">登录后即可提交友链申请，审核通过后展示在上方。</Paragraph>
                    <Button type="primary" onClick={() => navigate('/login')}>
                        登录后申请友链
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="container site-content links-page">
            {friendCard}
            {descCard}
            {applyNotice}
            <div className="links-grid">
                <Card>
                    <Title level={4}>申请友链</Title>
                    <Paragraph type="secondary">
                        填写下方表单申请友链，审核通过后会出现在上方列表与全站底部。
                    </Paragraph>
                    <Paragraph type="secondary">
                        {linkFee > 0
                            ? `提交友链申请将扣除 ¥${linkFee}；余额充足则申请成功并扣费，余额不足将跳转至充值页。`
                            : `本次友链申请免费，提交后等待审核。`}
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
                        <Form.Item
                            label="图形验证码"
                            name="code"
                            rules={[{ required: true, message: '请输入图形验证码' }]}
                        >
                            <Space.Compact className="captcha-compact">
                                <Input placeholder="请输入右侧验证码" />
                                <Tooltip title="点击刷新">
                                    <img
                                        src={codeSrc}
                                        alt="验证码"
                                        className="captcha-img"
                                        onClick={refreshCode}
                                    />
                                </Tooltip>
                            </Space.Compact>
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={submitting}>
                                提交申请
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>

                <Card>
                    <Title level={4}>我的友链</Title>
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
                                            <Tooltip title={l.name}>
                                                <a
                                                    href={l.url}
                                                    target="_blank"
                                                    rel="noreferrer noopener"
                                                    className="mylink-url"
                                                >
                                                    {l.url}
                                                </a>
                                            </Tooltip>
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
            </div>
        </div>
    );
}
