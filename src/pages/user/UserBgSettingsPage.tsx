import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Form, Select, Typography, Upload, message } from 'antd';
import type { UploadFile, UploadProps } from 'antd';
import { UploadOutlined, PlusOutlined } from '@ant-design/icons';

import { getToken } from '@/utils/auth';
import { getMyRender, saveMyRender, type MyRender } from '@/services/renderx';
// 图片一律走上传（长记忆第 0.5 条图片录入铁律：禁止填 URL），复用站点通用上传
import { uploadFile } from '@/services/userCenter';
import { useMember } from '@/context/MemberContext';
import { UserHomePreview } from './UserHomeCards';

const { Text, Title } = Typography;

/** 背景类型：统一两字，格式一致 */
const BG_TYPE_OPTIONS = [
    { value: 0, label: '默认' },
    { value: 1, label: '纯色' },
    { value: 2, label: '渐变' },
    { value: 3, label: '图片' },
];

/** 前景文字：统一两字 */
const FG_OPTIONS = [
    { value: 0, label: '自动' },
    { value: 1, label: '浅色' },
    { value: 2, label: '深色' },
];

interface Swatch {
    name: string;
    value: string;
    /** 推荐前景：1 浅色字 / 2 深色字 */
    fg: 1 | 2;
}

/** 纯色预设（点选即可，无需填写） */
const SOLID_PRESETS: Swatch[] = [
    { name: '雾白', value: '#f2f4f8', fg: 2 },
    { name: '米杏', value: '#f7efe0', fg: 2 },
    { name: '浅蓝', value: '#dbeafe', fg: 2 },
    { name: '薄荷', value: '#dcf5e9', fg: 2 },
    { name: '藕粉', value: '#fbe4ec', fg: 2 },
    { name: '岩灰', value: '#4b5563', fg: 1 },
    { name: '墨黑', value: '#1f2430', fg: 1 },
    { name: '深蓝', value: '#1e3a5f', fg: 1 },
    { name: '墨绿', value: '#1b4332', fg: 1 },
    { name: '酒红', value: '#5c2233', fg: 1 },
    { name: '紫棠', value: '#3b2b58', fg: 1 },
    { name: '暖棕', value: '#5b3d29', fg: 1 },
];

/** 渐变预设（点选即可，无需填写） */
const GRADIENT_PRESETS: Swatch[] = [
    { name: '暮蓝', value: 'linear-gradient(135deg, #667eea, #764ba2)', fg: 1 },
    { name: '晨曦', value: 'linear-gradient(135deg, #ff9a9e, #fecfef)', fg: 2 },
    { name: '极光', value: 'linear-gradient(135deg, #43cea2, #185a9d)', fg: 1 },
    { name: '晚霞', value: 'linear-gradient(135deg, #ff6a88, #ff99ac)', fg: 1 },
    { name: '深海', value: 'linear-gradient(135deg, #0f2027, #2c5364)', fg: 1 },
    { name: '森林', value: 'linear-gradient(135deg, #134e5e, #71b280)', fg: 1 },
    { name: '暖阳', value: 'linear-gradient(135deg, #f6d365, #fda085)', fg: 2 },
    { name: '星夜', value: 'linear-gradient(135deg, #232526, #414345)', fg: 1 },
    { name: '青瓷', value: 'linear-gradient(135deg, #a8edea, #fed6e3)', fg: 2 },
    { name: '紫金', value: 'linear-gradient(135deg, #42275a, #734b6d)', fg: 1 },
];

/** 预设色板：纯色与渐变共用同一套 .rx-swatch 样式，避免两套视觉 */
function SwatchPicker({
    items,
    value,
    onPick,
}: {
    items: Swatch[];
    value: string;
    onPick: (s: Swatch) => void;
}) {
    return (
        <div className="rx-swatch-grid">
            {items.map((s) => (
                <button
                    key={s.name}
                    type="button"
                    className={`rx-swatch${value === s.value ? ' rx-swatch-on' : ''}`}
                    onClick={() => onPick(s)}
                    aria-pressed={value === s.value}
                >
                    <span className="rx-swatch-color" style={{ background: s.value }} />
                    <span className="rx-swatch-name">{s.name}</span>
                </button>
            ))}
        </div>
    );
}

export default function UserBgSettingsPage(): React.JSX.Element {
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
                    if (r.data.bg_type === 3 && r.data.bg_value) {
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

    const pick = (s: Swatch) => {
        setBgValue(s.value);
        setFgMode(s.fg);
    };

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
                    setFgMode(1); // 图片叠暗色遮罩，推荐浅色字
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
        if ((bgType === 1 || bgType === 2) && !bgValue) {
            message.error('请先选择一个背景');
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

    const uid = String(info?.id ?? '');

    return (
        <Card className="user-center-card" loading={loading}>
            <Title level={5} style={{ marginBottom: 'var(--space-4)' }}>主页背景</Title>
            <Text type="secondary" style={{ fontSize: 'var(--fs-sm)', display: 'block', marginBottom: 'var(--space-4)' }}>
                仅用于你的公开主页（/user/{uid || '你的ID'}）。背景只作装饰，不会改变卡片高度；图片必须上传，不支持填写网络地址。
            </Text>

            <Form layout="vertical">
                <Form.Item label="背景类型" extra="默认＝使用站点统一背景；纯色、渐变从下方色板点选，图片通过上传获得。">
                    <Select value={bgType} options={BG_TYPE_OPTIONS} onChange={(v: number) => setBgType(v)} />
                </Form.Item>

                {bgType === 1 ? (
                    <Form.Item label="纯色" extra="点选色板即可，无需填写任何代码。">
                        <SwatchPicker items={SOLID_PRESETS} value={bgValue} onPick={pick} />
                    </Form.Item>
                ) : null}

                {bgType === 2 ? (
                    <Form.Item label="渐变" extra="点选色板即可，无需填写任何代码。">
                        <SwatchPicker items={GRADIENT_PRESETS} value={bgValue} onPick={pick} />
                    </Form.Item>
                ) : null}

                {bgType === 3 ? (
                    <Form.Item label="图片" extra="点击上传本地图片（webp/jpg/png/gif），禁止填写网络地址。">
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
                                    <div style={{ marginTop: 6 }}>{uploading ? '上传中' : '上传'}</div>
                                </div>
                            )}
                        </Upload>
                    </Form.Item>
                ) : null}

                {bgType !== 0 ? (
                    <Form.Item label="文字" extra="自动＝按背景明暗选黑/白字；浅色＝白字，深色＝黑字。">
                        <Select value={fgMode} options={FG_OPTIONS} onChange={(v: number) => setFgMode(v)} />
                    </Form.Item>
                ) : null}

                <Form.Item>
                    <Button type="primary" loading={saving} onClick={onSave}>保存</Button>
                </Form.Item>
            </Form>

            <div style={{ marginTop: 'var(--space-4)' }}>
                <Title level={5}>预览</Title>
                <Text type="secondary" style={{ fontSize: 'var(--fs-sm)', display: 'block', marginBottom: 12 }}>
                    与 /user/{uid || '你的ID'} 完全一致的真实主页，使用你真实的账户信息；修改上方选项即时生效。
                </Text>
                {uid ? (
                    <UserHomePreview uid={uid} bg={previewBg} />
                ) : (
                    <Text type="secondary">请先登录后再预览。</Text>
                )}
            </div>
        </Card>
    );
}
