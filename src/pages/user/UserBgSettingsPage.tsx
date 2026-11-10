import React, { useEffect, useMemo, useState } from 'react';
import { Avatar, Button, Card, Empty, Flex, Form, Input, Select, Tabs, Tag, Typography, Upload, message } from 'antd';
import type { UploadFile, UploadProps } from 'antd';
import { UploadOutlined, PlusOutlined } from '@ant-design/icons';

import { getToken } from '@/utils/auth';
import { getMyRender, saveMyRender, type MyRender } from '@/services/renderx';
import { buildCardBodyStyle, fgClassName } from '@/utils/renderxBg';
// 图片一律走上传（长记忆第 0.5 条图片录入铁律：禁止填 URL），复用站点通用上传
import { uploadFile } from '@/services/userCenter';
import { useMember } from '@/context/MemberContext';

const { Text, Title } = Typography;

const BG_TYPE_OPTIONS = [
    { value: 0, label: '无（使用站点默认）' },
    { value: 1, label: '纯色' },
    { value: 2, label: '渐变' },
    { value: 3, label: '图片（上传）' },
];

const FG_OPTIONS = [
    { value: 0, label: '自动（按背景明暗选黑/白字）' },
    { value: 1, label: '浅色文字（白）' },
    { value: 2, label: '深色文字（黑）' },
];

export default function UserBgSettingsPage(): React.JSX.Element {
    // 预览用真实账户信息（与公开主页 /user/:id 一致，不再是"示例用户名"）
    const { info } = useMember();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [bgType, setBgType] = useState(0);
    const [bgValue, setBgValue] = useState('');
    const [fgMode, setFgMode] = useState(0);
    const [uploadList, setUploadList] = useState<UploadFile[]>([]);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const key = getToken();
        if (!key) {
            setLoading(false);
            return;
        }
        let alive = true;
        getMyRender(key)
            .then((r: any) => {
                if (alive && r.code === 1 && r.data) {
                    setBgType(Number(r.data.bg_type) || 0);
                    setBgValue(r.data.bg_value || '');
                    setFgMode(Number(r.data.fg_mode) || 0);
                    if (r.data.bg_value) {
                        setUploadList([{ uid: '-1', name: 'bg', status: 'done', url: r.data.bg_value }]);
                    }
                }
            })
            .catch(() => {})
            .finally(() => {
                if (alive) setLoading(false);
            });
        return () => {
            alive = false;
        };
    }, []);

    const previewBg: MyRender = useMemo(
        () => ({ bg_type: bgType, bg_value: bgValue, fg_mode: fgMode }),
        [bgType, bgValue, fgMode]
    );
    const previewStyle = buildCardBodyStyle(previewBg);
    const previewClass = fgClassName(previewBg);

    const bgValuePlaceholder =
        bgType === 2
            ? '渐变，如 linear-gradient(135deg, #667eea, #764ba2)'
            : '纯色，如 #1f1f2e 或 rgba(0,0,0,.6)';

    // 图片背景：必须上传，禁止粘贴 URL（长记忆第 0.5 条铁律）
    const beforeUpload: UploadProps['beforeUpload'] = async (file) => {
        const key = getToken();
        if (!key) {
            message.error('请先登录');
            return false;
        }
        if (!(file as File).type.startsWith('image/')) {
            message.error('只能上传图片文件（支持 webp/jpg/png/gif）');
            return false;
        }
        setUploading(true);
        uploadFile(key, file as File)
            .then((r: any) => {
                if (r.code === 1 && r.data?.url) {
                    const url = r.data.url;
                    setBgValue(url);
                    setUploadList([{ uid: (file as File).uid, name: (file as File).name, status: 'done', url }]);
                } else {
                    message.error(r.msg || '上传失败');
                }
            })
            .catch((e) => message.error(e?.message || '上传失败'))
            .finally(() => setUploading(false));
        return false;
    };

    const handleRemove = () => {
        setBgValue('');
        setUploadList([]);
    };

    const onSave = () => {
        const key = getToken();
        if (!key) {
            message.error('请先登录');
            return;
        }
        if (bgType === 3 && !bgValue) {
            message.error('请先上传背景图片');
            return;
        }
        setSaving(true);
        saveMyRender(key, { bg_type: bgType, bg_value: bgValue, fg_mode: fgMode })
            .then((r: any) => {
                if (r.code === 1) message.success(r.msg || '保存成功');
                else message.error(r.msg || '保存失败');
            })
            .catch(() => message.error('保存失败'))
            .finally(() => setSaving(false));
    };

    const icon = info?.sex === 1 ? '♂' : info?.sex === 2 ? '♀' : '';

    return (
        <Card className="user-center-card" loading={loading}>
            <Title level={5} style={{ marginBottom: 'var(--space-4)' }}>主页背景</Title>
            <Text type="secondary" style={{ fontSize: 'var(--fs-sm)', display: 'block', marginBottom: 'var(--space-4)' }}>
                仅用于你的公开主页（/user/{info?.id ?? '你的ID'}）。不开放配色/字号，不影响全站与他人。
                背景只作装饰，不会改变卡片高度；图片必须上传，不支持填写网络地址。
            </Text>

            <Form layout="vertical">
                <Form.Item label="背景类型">
                    <Select value={bgType} options={BG_TYPE_OPTIONS} onChange={(v: number) => setBgType(v)} />
                </Form.Item>

                {bgType === 1 || bgType === 2 ? (
                    <Form.Item label="背景值" extra={bgType === 1 ? '纯色会自动按明暗选黑/白字' : undefined}>
                        <Input
                            value={bgValue}
                            placeholder={bgValuePlaceholder}
                            onChange={(e) => setBgValue(e.target.value)}
                        />
                    </Form.Item>
                ) : null}

                {bgType === 3 ? (
                    <Form.Item label="背景图片（上传）" extra="点击上传本地图片（webp/jpg/png/gif），禁止填写网络地址">
                        <Upload
                            listType="picture-card"
                            fileList={uploadList}
                            beforeUpload={beforeUpload}
                            onRemove={handleRemove}
                            accept="image/*"
                            disabled={uploading}
                        >
                            {uploadList.length >= 1 ? null : (
                                <div>
                                    {uploading ? <UploadOutlined /> : <PlusOutlined />}
                                    <div style={{ marginTop: 6 }}>{uploading ? '上传中' : '上传图片'}</div>
                                </div>
                            )}
                        </Upload>
                    </Form.Item>
                ) : null}

                {bgType !== 0 ? (
                    <Form.Item label="前景文字颜色" extra="背景较暗时选浅色文字，较亮时选深色文字，确保文字可读">
                        <Select value={fgMode} options={FG_OPTIONS} onChange={(v: number) => setFgMode(v)} />
                    </Form.Item>
                ) : null}

                <Form.Item>
                    <Button type="primary" loading={saving} onClick={onSave}>保存</Button>
                </Form.Item>
            </Form>

            <div style={{ marginTop: 'var(--space-4)' }}>
                <Title level={5}>预览（你的公开主页真实效果）</Title>
                <Text type="secondary" style={{ fontSize: 'var(--fs-sm)', display: 'block', marginBottom: 12 }}>
                    下方两张卡片与 /user/{info?.id ?? '你的ID'} 完全一致，使用你的真实账户信息。
                </Text>

                {/* 卡片一：账户信息（与 UserHomePage 第一张 Card 同结构） */}
                <Card className={previewClass} styles={{ body: previewStyle }}>
                    <Flex gap={20} align="center" wrap>
                        <Avatar shape="square" size={72} src={info?.head || undefined}>
                            {(info?.name || '?').slice(0, 1)}
                        </Avatar>
                        <Flex vertical gap={6}>
                            <Flex align="center" gap={8}>
                                <Text strong style={{ fontSize: 'var(--fs-xl)' }}>
                                    {info?.name || '你的用户名'}
                                </Text>
                                {icon ? (
                                    <Tag color={info?.sex === 1 ? 'blue' : 'magenta'} style={{ marginInlineEnd: 0 }}>
                                        {icon}
                                    </Tag>
                                ) : null}
                                {info?.home ? (
                                    <Button size="small" type="link" href={info.home} target="_blank" rel="noreferrer">
                                        个人主页
                                    </Button>
                                ) : null}
                            </Flex>
                            <Text type="secondary" style={{ fontSize: 'var(--fs-base)' }}>
                                {info?.description || '你的签名会显示在这里'}
                            </Text>
                        </Flex>
                    </Flex>
                </Card>

                {/* 卡片二：内容 Tabs（与 UserHomePage 第二张 Card 同结构） */}
                <Card className={previewClass} styles={{ body: previewStyle }} style={{ marginTop: 16 }}>
                    <Tabs
                        defaultActiveKey="sites"
                        items={[
                            { key: 'sites', label: '站点', children: <Empty description="你的站点将显示在这里" /> },
                            { key: 'columns', label: '专栏', children: <Empty description="你的专栏将显示在这里" /> },
                            { key: 'skills', label: '技能', children: <Empty description="你的技能将显示在这里" /> },
                        ]}
                    />
                </Card>
            </div>
        </Card>
    );
}
