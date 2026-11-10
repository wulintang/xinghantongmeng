import { request } from '@/utils/request';
import type { ApiResp } from '@/services/userCenter';

/** 用户公开主页背景：接口由「后台数据 API（openapi）」插件提供 */
const OPEN = '/index.php/openapi/index';

export interface MyRender {
    bg_type: number; // 0 默认 / 1 纯色 / 2 渐变 / 3 图片
    bg_value: string;
    fg_mode: number; // 0 自动 / 1 浅色文字 / 2 深色文字
    /** 审核状态：0 待审 / 1 通过 / 2 拒绝（仅「我的背景」接口返回） */
    status?: number;
    /** 拒绝原因 */
    reason?: string;
}

function post<T>(path: string, data: Record<string, any> = {}): Promise<T> {
    const body = new URLSearchParams();
    Object.keys(data).forEach((k) => {
        const v = data[k];
        if (v === undefined || v === null || v === '') return;
        body.append(k, String(v));
    });
    return request<T>(`${OPEN}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
    });
}

/** 我的主页背景（登录）：含审核状态与拒绝原因 */
export function getMyRender(key: string) {
    return request<ApiResp<MyRender>>(`${OPEN}/myRender.html?key=${encodeURIComponent(key)}`);
}

/** 保存我的主页背景（图片会进入待审，前台暂不生效） */
export function saveMyRender(key: string, data: { bg_type: number; bg_value?: string; fg_mode: number }) {
    return post<ApiResp<{ status: number }>>('/saveMyRender.html', { key, ...data });
}

/** 他人主页背景（公开，仅返回审核通过的背景） */
export function getUserRender(uid: number | string) {
    return request<ApiResp<MyRender>>(`${OPEN}/userRender.html?uid=${encodeURIComponent(String(uid))}`);
}
