import React, { useEffect } from 'react';

import { getRenderConfig } from '@/services/renderx';

/**
 * 自定义 Foot 代码注入：读取站点渲染配置，把 foot_code 原样注入全站页脚区域（管理员信任）。
 * 与 CustomHead 对称：用 DOMParser 解析后把节点移到真实 DOM（保留 <script>/<style>/<link> 及其属性）。
 */
export default function CustomFoot(): null {
    useEffect(() => {
        let alive = true;
        getRenderConfig()
            .then((r: any) => {
                if (!alive || !r || r.code !== 1 || !r.data?.foot_code) return;
                if (document.getElementById('custom-foot-code')) return;
                const doc = new DOMParser().parseFromString(
                    `<!DOCTYPE html><html><head></head><body>${r.data.foot_code}</body></html>`,
                    'text/html'
                );
                const fragment = document.createDocumentFragment();
                doc.body.childNodes.forEach((node: ChildNode) => {
                    fragment.appendChild(document.importNode(node, true));
                });
                const marker = document.createElement('div');
                marker.id = 'custom-foot-code';
                // 注入到页脚容器内（存在 footer 元素则插入其前）；否则追加到 body 末尾
                const footer = document.querySelector('footer') || document.querySelector('.site-footer');
                if (footer && footer.parentNode) {
                    footer.parentNode.insertBefore(marker, footer);
                    footer.parentNode.insertBefore(fragment, footer);
                } else {
                    document.body.appendChild(marker);
                    document.body.appendChild(fragment);
                }
            })
            .catch(() => {});
        return () => {
            alive = false;
        };
    }, []);
    return null;
}
