/**
 * 通用请求封装。
 * 后端根地址只从构建期注入的环境变量读取，仓库内不落任何真实域名。
 * 业务约定：后端统一返回 { code, msg, data }，code=1 为成功。
 */

const TIMEOUT_MS = 20000;

export async function request<T>(url: string, options?: RequestInit): Promise<T> {
    const base = (process.env.BOYOUQUAN_API_ADDRESS || '').replace(/\/+$/, '');
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
            // 部分后端应用（verify/user）开启 debug 时会在 JSON 后附加 trace HTML，
            // 这里截取首尾大括号之间的内容二次解析，避免整条请求白白失败。
            const s = text.indexOf('{');
            const e = text.lastIndexOf('}');
            if (s >= 0 && e > s) {
                try {
                    return JSON.parse(text.slice(s, e + 1)) as T;
                } catch {
                    /* 落到下面的统一报错 */
                }
            }
            throw new Error('接口返回的不是合法 JSON');
        }
    } finally {
        if (timer) clearTimeout(timer);
    }
}
