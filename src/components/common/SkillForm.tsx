import React, { useEffect, useMemo, useState } from 'react';
import { Button, Form, Input, Radio, Select, Space, Typography, message } from 'antd';
import { ClearOutlined, ExperimentOutlined, ThunderboltOutlined } from '@ant-design/icons';

import type { SkillField } from '@/services/userCenter';
import { normalizeSkillFields } from '@/utils/skillFields';

const { Text } = Typography;

/**
 * 全站唯一的「技能信息表」组件。
 * 所有技能共用这一个数据驱动组件：差异只在后端返回的 fields 数据，
 * 不做「一个技能一套表单」，也不做多套聊天框。
 */
export interface SkillFormProps {
    fields: SkillField[];
    /** 指令模板，含 {字段名} 占位符；替换后与字段值一起作为本次输入 */
    template: string;
    disabled?: boolean;
    onGenerate: (text: string) => void;
}

export default function SkillForm({ fields, template, disabled, onGenerate }: SkillFormProps): React.JSX.Element | null {
    const [values, setValues] = useState<Record<string, string>>({});
    const safeFields = useMemo(() => normalizeSkillFields(fields), [fields]);

    useEffect(() => {
        setValues({});
    }, [safeFields]);

    const setValue = (name: string, v: string) => {
        setValues((prev) => ({ ...prev, [name]: v }));
    };

    /** 用字段的示例值 / 提示 / 首个选项一键填充，解决「不知道该输入什么」 */
    const fillExample = () => {
        const next: Record<string, string> = {};
        safeFields.forEach((f) => {
            const v = String(f.example || f.placeholder || (f.options && f.options[0]) || '').trim();
            if (v) next[f.name] = v;
        });
        setValues(next);
        if (!Object.keys(next).length) message.info('该技能没有提供示例值，请按字段说明填写');
    };

    /** 把字段表拼成结构化输入，模板占位符就地替换，末尾附上防照抄约束 */
    const generate = () => {
        const missing = safeFields.filter((f) => f.required && !String(values[f.name] || '').trim());
        if (missing.length) {
            message.warning('请填写：' + missing.map((f) => f.label).join('、'));
            return;
        }
        const lines = safeFields.map(
            (f) => `${f.label}：${String(values[f.name] || '').trim() || '（未提供）'}`
        );
        let text = `【本次填写的信息】\n${lines.join('\n')}`;
        if (template && template.trim()) {
            const tpl = template.replace(/\{([^}]+)\}/g, (_m, key: string) => {
                const k = String(key).trim();
                const f = safeFields.find((x) => x.name === k || x.label === k);
                return f ? String(values[f.name] || '').trim() : '';
            });
            text = `${tpl.trim()}\n\n${text}`;
        }
        text += '\n\n请严格依据以上信息生成结果；技能说明中的示例仅作格式参考，不要照抄其中的人名、事件或数据，未提供的事实不要编造。';
        onGenerate(text);
    };

    if (!safeFields.length) return null;

    return (
        <div className="skill-form">
            <div className="skill-form-head">
                <Text strong>填写信息</Text>
                <Text type="secondary" className="skill-form-hint">
                    按下面的字段填写后生成，结果比直接聊天更准确；每个技能的字段由各自的技能定义给出
                </Text>
            </div>

            <Form layout="vertical" disabled={disabled}>
                {safeFields.map((f, i) => {
                    const opts = (f.options || []).map((o) => ({ label: o, value: o }));
                    const isChoice = f.type === 'select' || f.type === 'radio';
                    const extra = (f.example || f.placeholder)
                        ? `示例：${String(f.example || f.placeholder).trim()}`
                        : isChoice
                            ? `可选：${(f.options || []).join(' / ')}`
                            : opts.length
                                ? `可参考：${(f.options || []).join(' / ')}，也可自行填写`
                                : '';
                    let control: React.ReactNode;
                    switch (f.type) {
                        case 'textarea':
                            control = (
                                <Input.TextArea
                                    value={values[f.name] || ''}
                                    onChange={(e) => setValue(f.name, e.target.value)}
                                    placeholder={f.placeholder || `请填写${f.label}`}
                                    autoSize={{ minRows: 2, maxRows: 6 }}
                                />
                            );
                            break;
                        case 'select':
                            control = (
                                <Select
                                    value={values[f.name] || undefined}
                                    onChange={(v) => setValue(f.name, String(v ?? ''))}
                                    placeholder="请选择"
                                    options={opts}
                                    allowClear
                                />
                            );
                            break;
                        case 'radio':
                            control = (
                                <Radio.Group
                                    value={values[f.name] || undefined}
                                    onChange={(e) => setValue(f.name, String(e.target.value))}
                                    options={opts}
                                />
                            );
                            break;
                        case 'date':
                        case 'time':
                            control = (
                                <Input
                                    type={f.type}
                                    value={values[f.name] || ''}
                                    onChange={(e) => setValue(f.name, e.target.value)}
                                />
                            );
                            break;
                        default:
                            // 开放式列举（如「A、B 等」）不做成残缺下拉，用可自由填写的输入框，
                            // 候选项在下方 extra 里提示，用户可填任意值
                            control = (
                                <Input
                                    value={values[f.name] || ''}
                                    onChange={(e) => setValue(f.name, e.target.value)}
                                    placeholder={f.placeholder || (opts.length
                                        ? `请输入${f.label}，也可自行填写`
                                        : `请输入${f.label}`)}
                                />
                            );
                    }
                    return (
                        <Form.Item
                            key={`${f.name}-${i}`}
                            label={f.label}
                            required={!!f.required}
                            extra={extra ? <span className="skill-form-extra">{extra}</span> : undefined}
                        >
                            {control}
                        </Form.Item>
                    );
                })}
            </Form>

            <Space wrap>
                <Button type="primary" icon={<ThunderboltOutlined />} disabled={disabled} onClick={generate}>
                    按此生成
                </Button>
                <Button icon={<ExperimentOutlined />} disabled={disabled} onClick={fillExample}>
                    填入示例
                </Button>
                <Button icon={<ClearOutlined />} disabled={disabled} onClick={() => setValues({})}>
                    清空
                </Button>
            </Space>
        </div>
    );
}
