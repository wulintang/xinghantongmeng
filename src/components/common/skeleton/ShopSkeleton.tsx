import React from 'react';
import { Col, Row, Skeleton } from 'antd';

/** 集市列表骨架：与 ShopPage 网格一致的在售商品卡片占位 */
export default function ShopSkeleton(): React.JSX.Element {
    return (
        <div className="sk-page">
            <Row gutter={[16, 16]} align="stretch">
                {Array.from({ length: 12 }).map((_, i) => (
                    <Col key={i} xs={12} sm={12} md={8} lg={6}>
                        <div className="sk-card shop-goods-card">
                            <Skeleton.Image active style={{ width: '100%', height: 150 }} />
                            <div style={{ padding: '12px 14px' }}>
                                <Skeleton active title={{ width: '80%' }} paragraph={{ rows: 2 }} />
                                <Skeleton active title={false} paragraph={{ rows: 1, width: ['40%'] }} />
                            </div>
                        </div>
                    </Col>
                ))}
            </Row>
        </div>
    );
}
