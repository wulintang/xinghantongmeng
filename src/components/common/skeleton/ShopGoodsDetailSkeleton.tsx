import React from 'react';
import { Card, Flex } from 'antd';

import Skeleton from './Skeleton';

/** 商品详情骨架：按 ShopGoodsDetailPage 真实 DOM —— 左封面右信息卡 + 商品介绍卡 */
export default function ShopGoodsDetailSkeleton(): React.JSX.Element {
    return (
        <div className="sk-page shop-detail-page">
            <Card className="shop-detail-card">
                <Flex gap={24} wrap className="shop-detail-flex">
                    <Skeleton className="sk-cover-1x1" style={{ width: 320, maxWidth: '100%', flex: 'none' }} />
                    <Flex vertical gap={16} className="u-flex-1 u-minw-240px shop-detail-info">
                        <Flex gap={8} wrap align="center" className="goods-pills">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <Skeleton key={i} className="sk-chip" style={{ width: 64 + (i % 3) * 16 }} />
                            ))}
                        </Flex>
                        <Skeleton className="sk-block" style={{ height: 56 }} />
                        <Flex justify="flex-end" align="center" gap={16}>
                            <Skeleton className="sk-line" style={{ width: 100, height: 28 }} />
                            <Skeleton className="sk-chip" style={{ width: 96 }} />
                        </Flex>
                    </Flex>
                </Flex>
            </Card>
            <Card className="shop-detail-card" title="商品介绍">
                <Flex vertical gap={10}>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="sk-line sk-line-long" />
                    ))}
                </Flex>
            </Card>
        </div>
    );
}
