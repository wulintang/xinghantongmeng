import React, { useEffect } from 'react';

import { getRenderConfig } from '@/services/renderx';

/**
 * 后台统一字体 / 字号注入。
 * 自定义代码（含 CSS）统一由 CustomHead / CustomFoot 的两个框注入，
 * 这里只负责把 font_family / font_size_scale 写到 <html> 根的内联样式，避免重复注入。
 */
export default function CustomCss(): null {
    useEffect(() => {
        let alive = true;
        getRenderConfig()
            .then((r: any) => {
                if (!alive || !r || r.code !== 1 || !r.data) return;
                const { font_family, font_size_scale } = r.data;
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
