import React, { useEffect, useRef, useState } from 'react';
import { Button, Input, Space, message, Spin } from 'antd';
import { SendOutlined, ReloadOutlined, PauseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

import MdView from '@components/common/MdView';
import SkillForm from '@components/common/SkillForm';
import { apiBase } from '@/utils/request';
import { getToken } from '@/utils/auth';
import { getSkillFields, type SkillField } from '@/services/userCenter';

/**
 * 全站唯一的技能运行区：每个技能一份独立字段表（数据驱动，由同一个 SkillForm 渲染）
 * + 一个聊天框。表单负责「按字段生成」，聊天框负责追问，二者共用同一条 SSE 通道。
 */
export interface SkillChatProps {
    toolId: number;
    title: string;
}

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

const CHAT_URL = '/index.php/skills/chat/index.html';

export default function SkillChat({ toolId, title }: SkillChatProps): React.JSX.Element {
    const navigate = useNavigate();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [streaming, setStreaming] = useState(false);
    const [fields, setFields] = useState<SkillField[]>([]);
    const [template, setTemplate] = useState('');
    const [example, setExample] = useState('');
    const [fieldsLoading, setFieldsLoading] = useState(true);
    const abortRef = useRef<AbortController | null>(null);
    const logRef = useRef<HTMLDivElement>(null);

    // 每个技能独立加载自己的字段表；老技能由后端从 md 参数行自动解析
    useEffect(() => {
        let alive = true;
        setFieldsLoading(true);
        setFields([]);
        setTemplate('');
        setExample('');
        getSkillFields(toolId)
            .then((r) => {
                if (!alive) return;
                if (r.code === 1 && r.data) {
                    setFields(Array.isArray(r.data.fields) ? r.data.fields : []);
                    setTemplate(r.data.template || '');
                    setExample(r.data.example || '');
                }
            })
            .catch(() => {})
            .finally(() => { if (alive) setFieldsLoading(false); });
        return () => { alive = false; };
    }, [toolId]);

    useEffect(() => {
        const el = logRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages]);

    useEffect(() => () => abortRef.current?.abort(), []);

    const stop = () => {
        abortRef.current?.abort();
        abortRef.current = null;
        setStreaming(false);
    };

    /** 表单生成与手动输入走同一个发送函数，保证全站只有一个对话通道 */
    const send = async (external?: string) => {
        const text = String(external ?? input).trim();
        if (!text || streaming) return;
        const key = getToken();
        if (!key) {
            message.warning('请先登录后再使用技能');
            navigate('/login');
            return;
        }

        const history: ChatMessage[] = [...messages, { role: 'user', content: text }];
        setMessages([...history, { role: 'assistant', content: '' }]);
        setInput('');
        setStreaming(true);

        const ctrl = new AbortController();
        abortRef.current = ctrl;
        try {
            const res = await fetch(`${apiBase()}${CHAT_URL}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: toolId,
                    key,
                    messages: history.map((m) => ({ role: m.role, content: m.content })),
                }),
                signal: ctrl.signal,
            });
            if (!res.ok || !res.body) throw new Error('HTTP ' + res.status);

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                let i: number;
                while ((i = buffer.indexOf('\n\n')) >= 0) {
                    const part = buffer.slice(0, i).trim();
                    buffer = buffer.slice(i + 2);
                    if (!part.startsWith('data:')) continue;
                    const raw = part.slice(5).trim();
                    if (!raw || raw === '[DONE]') continue;
                    try {
                        const chunk = JSON.parse(raw)?.data?.content;
                        if (typeof chunk === 'string' && chunk) {
                            setMessages((prev) => {
                                const copy = [...prev];
                                const last = copy.length - 1;
                                if (last >= 0 && copy[last].role === 'assistant') {
                                    copy[last] = { ...copy[last], content: copy[last].content + chunk };
                                }
                                return copy;
                            });
                        }
                    } catch {
                        // 忽略心跳与非 JSON 行
                    }
                }
            }
        } catch (e: any) {
            if (e?.name !== 'AbortError') {
                setMessages((prev) => {
                    const copy = [...prev];
                    const last = copy.length - 1;
                    if (last >= 0 && copy[last].role === 'assistant' && !copy[last].content) {
                        copy[last] = { ...copy[last], content: '服务暂时不可用，请稍后重试。' };
                    }
                    return copy;
                });
            }
        } finally {
            setStreaming(false);
            abortRef.current = null;
        }
    };

    return (
        <div className="skill-chat">
            <Spin spinning={fieldsLoading} size="small">
                <SkillForm
                    fields={fields}
                    template={template}
                    disabled={streaming}
                    onGenerate={(text) => void send(text)}
                />
            </Spin>

            <div className="skill-chat-bar">
                <span className="skill-chat-title">与「{title}」对话</span>
                <Space size={8}>
                    <Button
                        size="small"
                        icon={<ReloadOutlined />}
                        onClick={() => { stop(); setMessages([]); }}
                    >
                        新会话
                    </Button>
                    {streaming ? (
                        <Button size="small" icon={<PauseOutlined />} onClick={stop}>停止</Button>
                    ) : null}
                </Space>
            </div>

            <div className="skill-chat-log" ref={logRef}>
                {messages.length === 0 ? (
                    <div className="skill-chat-empty">
                        {fields.length > 0
                            ? '先填写上方「填写信息」表并点「按此生成」；生成后可在这里继续追问或修改要求。'
                            : '在下方输入你的需求开始对话。'}
                        {example ? (
                            <div>
                                <Button type="link" size="small" onClick={() => setInput(example)}>
                                    把示例填入输入框
                                </Button>
                            </div>
                        ) : null}
                    </div>
                ) : messages.map((m, i) => (
                    <div key={i} className={`skill-chat-msg skill-chat-${m.role}`}>
                        <div className="skill-chat-who">{m.role === 'user' ? '你' : title}</div>
                        <div className="skill-chat-body">
                            {m.role === 'user' ? m.content : (
                                m.content
                                    ? <MdView id={`skill-chat-${toolId}-${i}`} modelValue={m.content} />
                                    : <span className="skill-chat-typing">正在思考…</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="skill-chat-input">
                <Input.TextArea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onPressEnter={(e) => {
                        if (!e.shiftKey) { e.preventDefault(); void send(); }
                    }}
                    placeholder={fields.length > 0 ? '补充要求或继续追问；首次使用建议先填上方信息表' : '输入内容，Enter 发送，Shift + Enter 换行'}
                    autoSize={{ minRows: 2, maxRows: 6 }}
                    disabled={streaming}
                />
                <Button type="primary" icon={<SendOutlined />} onClick={() => void send()} loading={streaming}>
                    发送
                </Button>
            </div>
        </div>
    );
}
