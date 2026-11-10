import React, { useEffect } from 'react';

import { getRenderConfig } from '@/services/renderx';
import { injectCode } from '@/utils/injectCode';

/**
 * 全站 Foot 注入：renderx 后台「Foot 自定义代码」一个框。
 * 走统一注入器重建 <script> 节点，统计代码放这里也能真正执行。
 */
export default function CustomFoot(): null {
    useEffect(() => {
        let alive = true;
        getRenderConfig()
            .then((r: any) => {
                if (!alive || !r || r.code !== 1 || !r.data) return;
                if (r.data.foot_code) injectCode(r.data.foot_code, 'foot', 'rx-foot-code');
            })
            .catch(() => {});
        return () => {
            alive = false;
        };
    }, []);
    return null;
}
