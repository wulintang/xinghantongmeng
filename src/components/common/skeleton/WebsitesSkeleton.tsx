import React from 'react';
import { Col, Row, Skeleton } from 'antd';

/** 网址导航骨架：标题 + 分类条 + 站点卡片网格 */
export default function WebsitesSkeleton(): React.JSX.Element {
    return (
        <div className="sk-page">
            <Skeleton active title={{ width: '20%' }} paragraph={{ rows: 1, width: ['40%'] }} />
            <Skeleton.Input active block size="large" className="sk-search" />
            <Skeleton.Button active className="sk-filter" />
            <Row gutter={[16, 16]}>
                {Array.from({ length: 12 }).map((_, i) => (
                    <Col key={i} xs={24} sm={12} md={8}>
                        <div className="sk-card">
                            <Skeleton avatar={{ shape: 'square', size: 44 }} active title paragraph={{ rows: 2 }} />
                        </div>
                    </Col>
                ))}
            </Row>
        </div>
    );
}
