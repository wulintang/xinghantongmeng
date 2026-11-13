import React from 'react';
import { Col, Row, Skeleton } from 'antd';

/** 商品详情骨架：封面 + 标题/价格/标签 + 正文 + 店铺信息 */
export default function ShopGoodsDetailSkeleton(): React.JSX.Element {
    return (
        <div className="sk-page shop-detail-page">
            <div className="shop-detail-card">
                <Row gutter={24}>
                    <Col xs={24} md={8}>
                        <Skeleton.Image active style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: 12 }} />
                    </Col>
                    <Col xs={24} md={16}>
                        <Skeleton active title={{ width: '60%' }} paragraph={{ rows: 3 }} />
                        <Skeleton.Button active style={{ width: 120, marginRight: 10 }} />
                        <Skeleton.Button active style={{ width: 120 }} />
                        <Skeleton active title={false} paragraph={{ rows: 2, width: ['70%', '50%'] }} />
                    </Col>
                </Row>
                <Skeleton active title={false} paragraph={{ rows: 4 }} style={{ marginTop: 24 }} />
            </div>
            <div className="shop-detail-card" style={{ marginTop: 16 }}>
                <Skeleton avatar={{ shape: 'circle', size: 48 }} active title paragraph={{ rows: 1 }} />
            </div>
        </div>
    );
}
