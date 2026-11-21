import React from 'react';
import { Card, Col, Flex, Row } from 'antd';

import Skeleton from './Skeleton';

/** 集市列表骨架：按 ShopPage 真实 DOM —— 筛选卡 + shop-goods-card 网格（方图 + 标题/描述/价格胶囊） */
export default function ShopSkeleton(): React.JSX.Element {
    return (
        <div className="sk-page">
            <Card className="shop-filter-card">
                <Flex vertical gap={14} align="center">
                    <div className="sk-block sk-search" style={{ height: 40 }} />
                    <Flex wrap gap={8} justify="center">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="sk-chip" style={{ width: 60 }} />
                        ))}
                    </Flex>
                </Flex>
            </Card>
            <Row gutter={[16, 16]} align="stretch">
                {Array.from({ length: 12 }).map((_, i) => (
                    <Col key={i} xs={12} sm={12} md={8} lg={6}>
                        <Card className="shop-goods-card">
                            <Skeleton className="sk-cover-1x1" style={{ borderRadius: 0 }} />
                            <div className="sk-shop-goods-body">
                                <Skeleton className="sk-line sk-line-long" />
                                <Skeleton className="sk-line sk-line-mid" />
                                <Flex justify="space-between" align="center">
                                    <Skeleton className="sk-line sk-line-short" />
                                    <Skeleton className="sk-chip" style={{ width: 48 }} />
                                </Flex>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
}
