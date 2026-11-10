import type { CSSProperties } from 'react';

import type { MyRender } from '@/services/renderx';

/**
 * 计算用户主页背景 + 前景文字的 Card body 内联样式（严格限定在 /user/:id 的 card body 内）。
 * 关键铁律：只走 CSS background（background / backgroundImage / 多重背景遮罩），绝不渲染 <img>，
 * 因此背景对卡片高度零贡献——卡片高度永远由内容决定，与背景图尺寸无关（cover 仅裁剪填充）。
 */
export function buildCardBodyStyle(bg?: MyRender | null): CSSProperties {
    const style: Record<string, any> = { overflow: 'hidden' };
    if (!bg || bg.bg_type === 0) return style as CSSProperties;

    if (bg.bg_type === 1 || bg.bg_type === 2) {
        // 纯色 / 渐变：直接设 background
        style.background = bg.bg_value;
    } else if (bg.bg_type === 3) {
        // 图片：客户端再次校验（/ 相对路径或 http(s)，他人内容防御）；多重背景叠半透明遮罩保障对比度
        if (!/^(https?:\/\/|\/)/i.test(bg.bg_value)) {
            return style as CSSProperties; // 非法图片地址：不注入
        }
        style.backgroundImage = `linear-gradient(rgba(0,0,0,0.38), rgba(0,0,0,0.38)), url("${bg.bg_value}")`;
        style.backgroundSize = 'cover';
        style.backgroundPosition = 'center';
        style.backgroundRepeat = 'no-repeat';
    }

    const fg = bg.fg_mode; // 0 自动 / 1 浅色文字 / 2 深色文字
    if (fg === 1 || (fg === 0 && bg.bg_type === 3)) {
        // 浅色文字（白系）
        style['--c-text'] = 'rgba(255,255,255,0.92)';
        style['--c-text-2'] = 'rgba(255,255,255,0.72)';
        style['--c-text-3'] = 'rgba(255,255,255,0.55)';
        style['--c-link'] = '#9ecbff';
        style.color = 'rgba(255,255,255,0.92)';
    } else if (fg === 2) {
        // 深色文字（黑系）
        style['--c-text'] = 'rgba(0,0,0,0.92)';
        style['--c-text-2'] = 'rgba(0,0,0,0.72)';
        style['--c-text-3'] = 'rgba(0,0,0,0.55)';
        style['--c-link'] = '#1677ff';
        style.color = 'rgba(0,0,0,0.92)';
    }
    return style as CSSProperties;
}

/**
 * 前景文字对应的卡片 className（驱动 styles.css 中 .rx-fg-* 规则，使 antd Typography
 * 的 secondary 文字也随背景翻色，保证任意背景上文字可读）。
 */
export function fgClassName(bg?: MyRender | null): string {
    if (!bg || bg.bg_type === 0) return '';
    const fg = bg.fg_mode;
    if (fg === 2) return 'rx-fg-dark';
    if (fg === 1 || (fg === 0 && bg.bg_type === 3)) return 'rx-fg-light';
    return '';
}
