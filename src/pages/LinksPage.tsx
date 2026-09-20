import React, { useState } from 'react';
import { useSite } from '@/context/SiteContext';
import { Button, Card, Form, Input, Space, Typography, message, Tag } from 'antd';
import { addSite, captchaUrl } from '@/services/userCenter';
import { getToken } from '@/utils/auth';
import { usePageMeta } from '@/hooks/usePageMeta';

const { Title, Text, Paragraph } = Typography;

export default function LinksPage() {
    usePageMeta({ title: '友情链接' });
    const { friendLinks } = useSite();
    const [codeSrc, setCodeSrc] = useState(() => captchaUrl());
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();

    const refreshCode = () => setCodeSrc(captchaUrl());

    const onFinish = (values: { name: string; url: string; code: string }) => {
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
        })
            .then((r: any) => {
                if (r.code === 1) {
                    message.success(r.msg || '申请提交成功，等待审核');
                    form.resetFields();
                    refreshCode();
                } else {
                    message.error(r.msg || '提交失败');
                    refreshCode();
                }
            })
            .catch(() => message.error('提交失败，请稍后重试'))
            .finally(() => setSubmitting(false));
    };

    return (
        <div className="container site-content links-page">
            <Card className="user-card">
                <Title level={4}>友情链接</Title>
                {friendLinks.length === 0 ? (
                    <Text type="secondary">暂无友情链接</Text>
                ) : (
                    <Space size={[12, 12]} wrap className="mt-16">
                        {friendLinks.map((l) => (
                            <Tag key={l.id} color="blue" style={{ fontSize: 14, padding: '4px 10px' }}>
                                <a href={l.lianjie} target="_blank" rel="noreferrer noopener">
                                    {l.name}
                                </a>
                            </Tag>
                        ))}
                    </Space>
                )}

                <DividerOr className="mt-24" />

                <Title level={5}>申请友链</Title>
                <Paragraph type="secondary">
                    登录后填写下方表单申请友链，审核通过后会出现在上方列表与全站底部。
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
        </div>
    );
}

function DividerOr({ className }: { className?: string }) {
    return <div className={className} style={{ borderTop: '1px solid #f0f0f0', margin: '20px 0' }} />;
}
