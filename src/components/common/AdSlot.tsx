import React, { useEffect, useState } from 'react';

import { getAd, type AdPayAd } from '@/services/adpay';
import { sanitizeHtml } from '@/utils/CommonUtil';

/**
 * 广告位（后端 my_ad）。
 * 后端按别名下发启用的广告代码；没有数据时整个区块不渲染。
 */
export default function AdSlot({ alias }: { alias?: string }): React.JSX.Element | null {
    const [ad, setAd] = useState<AdPayAd | null>(null);
    const [adReady, setAdReady] = useState(false);

    useEffect(() => {
        if (!alias) return;
        let alive = true;
        setAdReady(false);
        getAd(alias)
            .then((r) => {
                if (alive && r.code === 1) setAd(r.data || null);
            })
            .catch(() => {})
            .finally(() => {
                if (alive) setAdReady(true);
            });
        return () => {
            alive = false;
        };
    }, [alias]);

    if (!adReady || !ad) return null;

    return (
        <div className="ad-slot-filled">
            <div className="ad-banner" dangerouslySetInnerHTML={{ __html: sanitizeHtml(ad.content) }} />
        </div>
    );
}
