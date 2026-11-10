import React, { useEffect } from 'react';

import { getRenderConfig } from '@/services/renderx';

/**
 * 全站自定义 CSS + 后台统一字体/字号注入。
 * - custom_css：管理员信任内容，原样注入 <style>（与 head_code 同策略）。
 * - 字体/字号：把 font_family / font_size_scale 写到 <html> 根的内联样式（--rx-font-family / --rx-fs-scale），
 *   覆盖 styles.css 的默认值，实现"后台一处改、全站生效"。
 */
export default function CustomCss(): null {
    useEffect(() => {
        let alive = true;
        getRenderConfig()
            .then((r: any) => {
                if (!alive || !r || r.code !== 1 || !r.data) return;
                const { custom_css, font_family, font_size_scale } = r.data;

                if (custom_css && !document.getElementById('custom-site-css')) {
                    const style = document.createElement('style');
                    style.id = 'custom-site-css';
                    style.textContent = custom_css;
                    document.head.appendChild(style);
                }

                const root = document.documentElement;
                if (font_size_scale && Number(font_size_scale) !== 1) {
                    root.style.setProperty('--rx-fs-scale', String(font_size_scale));
                }
                if (font_family) {
                    root.style.setProperty('--rx-font-family', font_family);
                }
            })
            .catch(() => {});
        return () => {
            alive = false;
        };
    }, []);
    return null;
}
