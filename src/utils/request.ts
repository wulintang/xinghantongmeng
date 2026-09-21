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
        try {
            return JSON.parse(text) as T;
        } catch {
            throw new Error('接口返回的不是合法 JSON');
        }
    } finally {
        if (timer) clearTimeout(timer);
    }
}
