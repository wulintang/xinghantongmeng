import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Flex, Input, Select, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';

import { PageHeader } from '@components/common';
import { getToken } from '@/utils/auth';
import { getMyRender, saveMyRender, type MyRender } from '@/services/renderx';
import { buildCardBodyStyle, fgClassName } from '@/utils/renderxBg';

const { Text, Title } = Typography;

const BG_TYPE_OPTIONS = [
    { value: 0, label: '无（使用站点默认）' },
    { value: 1, label: '纯色' },
    { value: 2, label: '渐变' },
    { value: 3, label: '图片 URL' },
];

const FG_OPTIONS = [
    { value: 0, label: '自动（图片默认浅色文字）' },
    { value: 1, label: '浅色文字（白）' },
    { value: 2, label: '深色文字（黑）' },
];

export default function UserBgSettingsPage(): React.JSX.Element {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [bgType, setBgType] = useState(0);
    const [bgValue, setBgValue] = useState('');
    const [fgMode, setFgMode] = useState(0);

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
        bgType === 3
            ? '图片地址（必须以 http:// 或 https:// 开头）'
            : bgType === 2
            ? '渐变，如 linear-gradient(135deg, #667eea, #764ba2)'
            : '纯色，如 #1f1f2e 或 rgba(0,0,0,.6)';

    const onSave = () => {
        const key = getToken();
        if (!key) {
            message.error('请先登录');
            return;
        }
        if (bgType === 3 && bgValue && !/^https?:\/\//i.test(bgValue)) {
            message.error('图片地址必须以 http:// 或 https:// 开头');
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

    return (
        <Flex vertical gap={20}>
            <PageHeader
                title="主页背景"
                crumbs={[{ label: '首页', to: '/' }, { label: '用户中心', to: '/user' }, { label: '主页背景' }]}
            />

            <Text type="secondary" style={{ fontSize: 'var(--fs-sm)' }}>
                仅用于你的公开主页（/user/你的ID）。不开放配色/字号，不影响全站与他人。
            </Text>

            <Flex gap={20} wrap>
                {/* 左：设置表单 */}
                <Card style={{ flex: '1 1 360px', minWidth: 320 }} loading={loading}>
                    <Flex vertical gap={16}>
                        <div>
                            <Text strong style={{ fontSize: 'var(--fs-base)' }}>背景类型</Text>
                            <Select
                                style={{ width: '100%', marginTop: 8 }}
                                value={bgType}
                                options={BG_TYPE_OPTIONS}
                                onChange={(v: number) => setBgType(v)}
                            />
                        </div>

                        {bgType !== 0 ? (
                            <div>
                                <Text strong style={{ fontSize: 'var(--fs-base)' }}>背景值</Text>
                                <Input
                                    style={{ marginTop: 8 }}
                                    value={bgValue}
                                    placeholder={bgValuePlaceholder}
                                    onChange={(e) => setBgValue(e.target.value)}
                                />
                            </div>
                        ) : null}

                        {bgType !== 0 ? (
                            <div>
                                <Text strong style={{ fontSize: 'var(--fs-base)' }}>前景文字颜色</Text>
                                <Select
                                    style={{ width: '100%', marginTop: 8 }}
                                    value={fgMode}
                                    options={FG_OPTIONS}
                                    onChange={(v: number) => setFgMode(v)}
                                />
                                <Text type="secondary" style={{ fontSize: 'var(--fs-xs)', display: 'block', marginTop: 6 }}>
                                    背景较暗时选「浅色文字」，较亮时选「深色文字」，确保文字可读。
                                </Text>
                            </div>
                        ) : null}

                        <Button type="primary" loading={saving} onClick={onSave}>
                            保存
                        </Button>
                    </Flex>
                </Card>

                {/* 右：实时预览（与 /user/:id 主页两张 Card 同款渲染） */}
                <Card
                    title="预览"
                    style={{ flex: '1 1 360px', minWidth: 320 }}
                    className={previewClass}
                    styles={{ body: previewStyle }}
                >
                    <Flex vertical gap={10}>
                        <Title level={4} style={{ margin: 0 }}>
                            示例用户名
                        </Title>
                        <Text type="secondary">这是一段简介文字，用于预览背景上的可读性效果。</Text>
                        <Text>普通正文链接示例</Text>
                        <Button size="small" type="link" style={{ paddingLeft: 0 }}>
                            个人主页
                        </Button>
                    </Flex>
                </Card>
            </Flex>

            <div>
                <Button onClick={() => navigate('/user')}>返回个人资料</Button>
            </div>
        </Flex>
    );
}
