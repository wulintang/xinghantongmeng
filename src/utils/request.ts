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

/** 跳转好道原生支付宝收银台（Pay::alipay($uid) 按 uid+amount 建单并跳支付宝） */
export function openAlipayPay(uid: number, amount: number) {
    const base = apiBase();
    window.open(`${base}/index.php/pay/alipay.html?uid=${uid}&amount=${Number(amount)}`, '_blank');
}

function extractJson(text: string): any {
    const trimmed = text.trim();
    try {
        return JSON.parse(trimmed);
    } catch {
        const start = trimmed.indexOf('{');
        if (start === -1) throw new Error('接口返回的不是合法 JSON');
        let depth = 0;
        let inStr = false;
        let esc = false;
        let end = -1;
        for (let i = start; i < trimmed.length; i++) {
            const c = trimmed[i];
            if (inStr) {
                if (esc) esc = false;
                else if (c === '\\') esc = true;
                else if (c === '"') inStr = false;
            } else {
                if (c === '"') inStr = true;
                else if (c === '{') depth++;
                else if (c === '}') {
                    depth--;
                    if (depth === 0) {
                        end = i;
                        break;
                    }
                }
            }
        }
        if (end === -1) throw new Error('接口返回的不是合法 JSON');
        return JSON.parse(trimmed.slice(start, end + 1));
    }
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
        return extractJson(text) as T;
    } finally {
        if (timer) clearTimeout(timer);
    }
}
