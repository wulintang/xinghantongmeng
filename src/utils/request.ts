/**
 * 通用请求封装。
 * 后端根地址只从构建期注入的环境变量读取，仓库内不落任何真实域名。
 * 业务约定：后端统一返回 { code, msg, data }，code=1 为成功。
 */

const TIMEOUT_MS = 20000;

/** 后端根地址（构建期注入），供验证码图片等非 fetch 场景拼绝对 URL */
export function apiBase(): string {
    return (process.env.BOYOUQUAN_API_ADDRESS || '').replace(/\/+$/, '');
}

export async function request<T>(url: string, options?: RequestInit): Promise<T> {
    const base = apiBase();
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), TIMEOUT_MS) : null;

    try {
        const res = await fetch(base + url, {
            ...options,
            signal: controller ? controller.signal : undefined,
        });
        if (!res.ok) throw new Error(`请求异常（HTTP ${res.status}）`);
        const text = await res.text();
        const parsed = extractJson(text);
        if (parsed === null) throw new Error('接口返回的不是合法 JSON');
        return parsed as T;
    } finally {
        if (timer) clearTimeout(timer);
    }
}

/**
 * 提取响应体开头的第一个完整 JSON 对象。
 * 部分 后端应用（verify/user）开 debug 时会在 JSON 后附加 trace HTML，内含 JS 大括号，
 * 简单的 indexOf/lastIndexOf 截取会被干扰，这里做平衡扫描：字符串感知 + 花括号计数。
 */
function extractJson(text: string): unknown {
    const start = text.indexOf('{');
    if (start < 0) return null;
    let depth = 0;
    let inStr = false;
    let esc = false;
    for (let i = start; i < text.length; i++) {
        const ch = text[i];
        if (inStr) {
            if (esc) esc = false;
            else if (ch === '\\') esc = true;
            else if (ch === '"') inStr = false;
            continue;
        }
        if (ch === '"') inStr = true;
        else if (ch === '{') depth++;
        else if (ch === '}') {
            depth--;
            if (depth === 0) {
                try {
                    return JSON.parse(text.slice(start, i + 1));
                } catch {
                    return null;
                }
            }
        }
    }
    return null;
}
