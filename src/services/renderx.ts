import { request } from '@/utils/request';
import type { ApiResp } from '@/services/userCenter';

// 前端渲染增强插件（renderx）接口：/index.php/renderx/index/{方法}.html
const RENDERX = '/index.php/renderx/index';

/** 站点渲染配置（公开只读） */
export interface RenderConfig {
    foot_code: string;
    custom_css: string;
    default_mode: number; // 0 浅 / 1 深 / 2 跟随定时
    dark_start: string; // HH:MM
    dark_end: string; // HH:MM（可跨午夜）
    font_family: string; // 统一字体（空=系统默认）
    font_size_scale: number; // 统一字号缩放（0.80–1.50）
}

/** 用户主页背景配置（仅 bg_type/bg_value/fg_mode） */
export interface MyRender {
    bg_type: number; // 0 无 / 1 纯色 / 2 渐变 / 3 图片URL
    bg_value: string;
    fg_mode: number; // 0 自动 / 1 浅色文字 / 2 深色文字
}

function post<T>(path: string, data: Record<string, any> = {}): Promise<T> {
    const body = new URLSearchParams();
    Object.keys(data).forEach((k) => {
        const v = data[k];
        if (v === undefined || v === null || v === '') return;
        body.append(k, String(v));
    });
    return request<T>(`${RENDERX}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
    });
}

/** 站点渲染配置（foot_code/custom_css/default_mode/dark_schedule/font） */
export function getRenderConfig() {
    return request<ApiResp<RenderConfig>>(`${RENDERX}/config.html`);
}

/** 我的主页背景（登录） */
export function getMyRender(key: string) {
    return request<ApiResp<MyRender>>(`${RENDERX}/myRender.html?key=${encodeURIComponent(key)}`);
}

/** 保存我的主页背景（登录；仅 bg_type/bg_value/fg_mode） */
export function saveMyRender(key: string, data: { bg_type: number; bg_value?: string; fg_mode: number }) {
    return post<ApiResp>(`/saveMyRender.html`, { key, ...data });
}

/** 他人主页背景（公开，供 /user/:id 装修） */
export function getUserRender(uid: number | string) {
    return request<ApiResp<MyRender>>(`${RENDERX}/userRender.html?uid=${encodeURIComponent(String(uid))}`);
}
