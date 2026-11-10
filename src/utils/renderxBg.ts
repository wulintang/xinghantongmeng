import type { CSSProperties } from 'react';

import type { MyRender } from '@/services/renderx';

/**
 * 计算颜色亮度（近似 0~255）。用于纯色背景自动选前景色，保证任意背景上文字可读。
 * 支持 #rgb / #rrggbb / rgb() / rgba()。
 */
function colorLuminance(c: string): number | null {
    const s = (c || '').trim();
    let m = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (m) {
        let hex = m[1];
        if (hex.length === 3) hex = hex.split('').map((x) => x + x).join('');
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }
    m = s.match(/rgba?\(([^)]+)\)/i);
    if (m) {
        const p = m[1].split(',').map((x) => parseFloat(x));
        if (p.length >= 3) {
            return 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2];
        }
    }
    return null;
}

/** 浅色文字（白系）覆盖 */
function lightText(): Record<string, any> {
    return {
        '--c-text': 'rgba(255,255,255,0.92)',
        '--c-text-2': 'rgba(255,255,255,0.72)',
        '--c-text-3': 'rgba(255,255,255,0.55)',
        '--c-link': '#9ecbff',
        color: 'rgba(255,255,255,0.92)',
    };
}

/** 深色文字（黑系）覆盖 */
function darkText(): Record<string, any> {
    return {
        '--c-text': 'rgba(0,0,0,0.92)',
        '--c-text-2': 'rgba(0,0,0,0.72)',
        '--c-text-3': 'rgba(0,0,0,0.55)',
        '--c-link': '#1677ff',
        color: 'rgba(0,0,0,0.92)',
    };
}

/**
 * 计算用户主页背景 + 前景文字的 Card body 内联样式（严格限定在 /user/:id 的 card body 内）。
 * 关键铁律：只走 CSS background（background / backgroundImage / 多重背景遮罩），绝不渲染 <img>，
 * 因此背景对卡片高度零贡献——卡片高度永远由内容决定，与背景图尺寸无关（cover 仅裁剪填充）。
 *
 * 前景色保证可读：fg_mode=1 浅色 / 2 深色；fg_mode=0 自动时：
 *  - 图片：叠暗色遮罩 + 浅色字
 *  - 渐变：默认浅色字（用户可在设置页改深色）
 *  - 纯色：按亮度自动选黑/白字，杜绝"深底深字看不见"
 */
export function buildCardBodyStyle(bg?: MyRender | null): CSSProperties {
    const style: Record<string, any> = { overflow: 'hidden' };
    if (!bg || bg.bg_type === 0) return style as CSSProperties;

    if (bg.bg_type === 1 || bg.bg_type === 2) {
        style.background = bg.bg_value;
    } else if (bg.bg_type === 3) {
        // 图片：客户端再次校验（/ 相对路径或 http(s)，他人内容防御）；叠半透明遮罩保障对比度
        if (!/^(https?:\/\/|\/)/i.test(bg.bg_value)) {
            return style as CSSProperties; // 非法图片地址：不注入
        }
        style.backgroundImage = `linear-gradient(rgba(0,0,0,0.38), rgba(0,0,0,0.38)), url("${bg.bg_value}")`;
        style.backgroundSize = 'cover';
        style.backgroundPosition = 'center';
        style.backgroundRepeat = 'no-repeat';
    }

    const fg = bg.fg_mode; // 0 自动 / 1 浅色文字 / 2 深色文字
    if (fg === 1) {
        Object.assign(style, lightText());
    } else if (fg === 2) {
        Object.assign(style, darkText());
    } else if (bg.bg_type === 3 || bg.bg_type === 2) {
        // 图片 / 渐变：默认浅色字（渐变用户可在设置页改深色）
        Object.assign(style, lightText());
    } else if (bg.bg_type === 1) {
        // 纯色：按亮度自动
        const lum = colorLuminance(bg.bg_value);
        Object.assign(style, lum !== null && lum < 140 ? lightText() : darkText());
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
    if (fg === 1) return 'rx-fg-light';
    // 自动
    if (bg.bg_type === 3 || bg.bg_type === 2) return 'rx-fg-light';
    if (bg.bg_type === 1) {
        const lum = colorLuminance(bg.bg_value);
        if (lum !== null) return lum < 140 ? 'rx-fg-light' : 'rx-fg-dark';
    }
    return '';
}
