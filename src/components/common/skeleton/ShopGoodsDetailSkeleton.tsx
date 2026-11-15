import React from 'react';
import { Col, Row, Skeleton } from 'antd';

/** 商品详情骨架：封面 + 标题/价格/标签 + 正文 + 店铺信息 */
export default function ShopGoodsDetailSkeleton(): React.JSX.Element {
    return (
        <div className="sk-page shop-detail-page">
            <div className="shop-detail-card">
                <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}>
                        <Skeleton.Image active className="u-w-100 u-ar-1-1 u-radius-12px" />
                    </Col>
                    <Col xs={24} md={16}>
                        <Skeleton active title={{ width: '60%' }} paragraph={{ rows: 3 }} />
                        <Skeleton.Button active className="u-w-120px u-mr-10px" />
                        <Skeleton.Button active className="u-w-120px" />
                        <Skeleton active title={false} paragraph={{ rows: 2, width: ['70%', '50%'] }} />
                    </Col>
                </Row>
                <Skeleton active title={false} paragraph={{ rows: 4 }} className="u-mt-24px" />
            </div>
            <div className="shop-detail-card u-mt-16px" >
                <Skeleton avatar={{ shape: 'circle', size: 48 }} active title paragraph={{ rows: 1 }} />
            </div>
        </div>
    );
}
