import React, { useState } from 'react';
import { Form, Input, Button, message, Skeleton, Typography } from 'antd';

import { submitSite } from '@/services/userCenter';
import { getToken } from '@/utils/auth';

const { Title, Text } = Typography;

const SubmitSite: React.FC = () => {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [codeSrc, setCodeSrc] = useState(
        '/index.php/api/generate.html?t=' + Date.now()
    );

    const refreshCode = () => {
        setCodeSrc('/index.php/api/generate.html?t=' + Date.now());
    };

    const onFinish = (values: { name: string; url: string; type?: string; code: string }) => {
        const key = getToken();
        if (!key) {
            message.warning('请先登录');
            return;
        }
        setSubmitting(true);
        submitSite(key, {
            name: values.name,
            url: values.url,
            type: values.type || 'website',
            code: values.code,
        })
            .then((r) => {
                if (r.code === 1) {
                    message.success('提交成功，等待审核');
                    form.resetFields();
                    refreshCode();
                } else {
                    message.error(r.msg || '提交失败，请稍后重试');
                    refreshCode();
                }
            })
            .catch(() => message.error('提交失败，请稍后重试'))
            .finally(() => setSubmitting(false));
    };

    return (
        <div className="submit-site">
            <Title level={4}>提交站点</Title>
            <Text type="secondary">填写你的站点信息，提交后由管理员审核，通过后将收录展示。</Text>
            {submitting ? (
                <Skeleton active paragraph={{ rows: 4 }} />
            ) : (
                <Form
                    form={form}
                    layout="vertical"
                    className="submit-site-form"
                    onFinish={onFinish}
                    initialValues={{ type: 'website' }}
                >
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
                            { type: 'url', message: '请输入合法的链接' },
                        ]}
                    >
                        <Input placeholder="https://example.com" />
                    </Form.Item>
                    <Form.Item label="站点类型" name="type">
                        <Input placeholder="website" />
                    </Form.Item>
                    <Form.Item
                        label="图形验证码"
                        name="code"
                        rules={[{ required: true, message: '请输入图形验证码' }]}
                    >
                        <Input
                            placeholder="请输入右侧验证码"
                            addonAfter={
                                <img
                                    src={codeSrc}
                                    alt="code"
                                    style={{ height: 30, cursor: 'pointer' }}
                                    onClick={refreshCode}
                                />
                            }
                        />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={submitting}>
                            提交
                        </Button>
                    </Form.Item>
                </Form>
            )}
        </div>
    );
};

export default SubmitSite;
