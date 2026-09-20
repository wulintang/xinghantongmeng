import React, { useEffect, useState } from 'react';
import { Card, Flex } from 'antd';

import { getAds, type AdItem } from '@/services/userCenter';
import { sanitizeHtml } from '@/utils/CommonUtil';

/**
 * 广告位（后端 my_ad）。
 * 后端按别名下发启用的广告代码；没有数据时整个区块不渲染。
 */
export default function AdSlot({ alias }: { alias?: string }): React.JSX.Element | null {
    const [ads, setAds] = useState<AdItem[]>([]);

    useEffect(() => {
        let alive = true;
        getAds(alias)
            .then((r) => {
                if (alive && r.code === 1 && Array.isArray(r.data)) setAds(r.data);
            })
            .catch(() => {});
        return () => {
            alive = false;
        };
    }, [alias]);

    if (ads.length === 0) return null;

    return (
        <Flex vertical gap={12}>
            {ads.map((ad) => (
                <Card key={ad.id} size="small" title={ad.name}>
                    <div
                        className="detail-content"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(ad.content) }}
                    />
                </Card>
            ))}
        </Flex>
    );
}
