import React, { useEffect, useState } from 'react';
import { Button, Card, Form, Input, Select, Space, Spin, Typography, Upload, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

import { addSite, captchaUrl, getWebsiteCates, uploadFile, type CateItem } from '@/services/userCenter';
import { getToken } from '@/utils/auth';
import { usePageMeta } from '@/hooks/usePageMeta';

const { Title, Text } = Typography;

/** 提交站点：分类=后台真实网站分类（my_website_cate），图标/截图直接上传，feed 填订阅地址 */
const SubmitSite: React.FC = () => {
    usePageMeta({ title: '提交站点' });
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [cates, setCates] = useState<CateItem[]>([]);
    const [catesLoading, setCatesLoading] = useState(true);
    const [codeSrc, setCodeSrc] = useState(() => captchaUrl());
    const [ico, setIco] = useState('');
    const [pic, setPic] = useState('');
    const [uploading, setUploading] = useState<'ico' | 'pic' | null>(null);

    const refreshCode = () => setCodeSrc(captchaUrl());

    useEffect(() => {
        let alive = true;
        getWebsiteCates()
            .then((r) => {
                if (alive && r.code === 1 && Array.isArray(r.data)) setCates(r.data);
            })
            .catch(() => {})
            .finally(() => alive && setCatesLoading(false));
        return () => {
            alive = false;
        };
    }, []);

    const doUpload = (file: File, target: 'ico' | 'pic') => {
        const key = getToken();
        if (!key) {
            message.warning('请先登录');
            return;
        }
        setUploading(target);
        uploadFile(key, file)
            .then((r) => {
                if (r.code === 1 && r.data?.url) {
                    if (target === 'ico') setIco(r.data.url);
                    else setPic(r.data.url);
                    message.success('上传成功');
                } else {
                    message.error(r.msg || '上传失败');
                }
            })
            .catch(() => message.error('上传失败'))
            .finally(() => setUploading(null));
    };

    const onFinish = (values: { name: string; url: string; cate?: number; feed_url?: string; code: string }) => {
        const key = getToken();
        if (!key) {
            message.warning('请先登录');
            return;
        }
        setSubmitting(true);
        addSite(key, {
            name: values.name,
            url: values.url,
            cate: values.cate,
            ico,
            pic,
            feed_url: values.feed_url,
            type: 'website',
            code: values.code,
        })
            .then((r) => {
                if (r.code === 1) {
                    message.success(r.msg || '提交成功，等待审核');
                    form.resetFields();
                    setIco('');
                    setPic('');
                    refreshCode();
                } else {
                    message.error(r.msg || '提交失败');
                    refreshCode();
                }
            })
            .catch(() => message.error('提交失败，请稍后重试'))
            .finally(() => setSubmitting(false));
    };

    const uploadButton = (target: 'ico' | 'pic', done: string) => (
        <Upload
            accept="image/*"
            showUploadList={false}
            beforeUpload={(file) => {
                doUpload(file, target);
                return false;
            }}
        >
            <Button size="small" loading={uploading === target}>
                {done}
            </Button>
        </Upload>
    );

    return (
        <Card className="user-center-card">
            <Title level={4}>提交站点</Title>
            <Text type="secondary">填写你的站点信息并上传图标/截图，提交后由管理员审核收录。</Text>
            <Spin spinning={catesLoading}>
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
                            { type: 'url', message: '请输入合法的链接' },
                        ]}
                    >
                        <Input placeholder="https://example.com" />
                    </Form.Item>
                    <Form.Item label="网站分类" name="cate" rules={[{ required: true, message: '请选择网站分类' }]}>
                        <Select placeholder="选择后台网站分类">
                            {cates.map((c) => (
                                <Select.Option key={c.id} value={c.id}>
                                    {c.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item label="网站图标" required>
                        <Space>
                            <Input
                                style={{ width: 260 }}
                                value={ico}
                                onChange={(e) => setIco(e.target.value)}
                                placeholder="图标地址（可上传自动填充）"
                            />
                            {uploadButton('ico', '上传图标')}
                            {ico ? <img src={ico} alt="ico" style={{ width: 24, height: 24 }} /> : null}
                        </Space>
                    </Form.Item>
                    <Form.Item label="网站截图" required>
                        <Space>
                            <Input
                                style={{ width: 260 }}
                                value={pic}
                                onChange={(e) => setPic(e.target.value)}
                                placeholder="截图地址（可上传自动填充）"
                            />
                            {uploadButton('pic', '上传截图')}
                            {pic ? <img src={pic} alt="shot" style={{ width: 48, height: 32, objectFit: 'cover' }} /> : null}
                        </Space>
                    </Form.Item>
                    <Form.Item
                        label="Feed 订阅地址"
                        name="feed_url"
                        rules={[{ type: 'url', message: '请输入合法的链接' }]}
                    >
                        <Input placeholder="https://example.com/feed（选填，收录后自动聚合文章）" />
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
                        <Button type="primary" htmlType="submit" loading={submitting} icon={<PlusOutlined />}>
                            提交
                        </Button>
                    </Form.Item>
                </Form>
            </Spin>
        </Card>
    );
};

export default SubmitSite;
