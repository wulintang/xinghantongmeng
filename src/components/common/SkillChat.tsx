import React, { useEffect, useRef, useState } from 'react';
import { Button, Input, Space, message } from 'antd';
import { SendOutlined, ReloadOutlined, PauseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

import MdView from '@components/common/MdView';
import { apiBase } from '@/utils/request';
import { getToken } from '@/utils/auth';

/** 全站唯一一个技能聊天框：所有技能共用此组件，差异只在各自 md 内容（由后端作 system prompt） */
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
    const abortRef = useRef<AbortController | null>(null);
    const logRef = useRef<HTMLDivElement>(null);

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

    const send = async () => {
        const text = input.trim();
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
                        直接在下方输入内容开始对话。上方技能说明会自动作为系统提示词生效，无需填写任何参数表单。
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
                    placeholder="输入内容，Enter 发送，Shift + Enter 换行"
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
