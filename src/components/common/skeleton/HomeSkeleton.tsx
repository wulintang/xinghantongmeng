import React from 'react';
import { Col, Row, Skeleton } from 'antd';

/** 首页骨架：横幅 + 搜索条 + 站点卡片网格（与首页三段结构一一对应） */
export default function HomeSkeleton(): React.JSX.Element {
    return (
        <div className="sk-page">
            <div className="sk-hero">
                <Skeleton active title={{ width: '45%' }} paragraph={{ rows: 2 }} />
            </div>
            <Skeleton.Input active block size="large" className="sk-search" />
            <Skeleton.Input active size="small" className="sk-section-title" />
            <Row gutter={[16, 16]}>
                {Array.from({ length: 8 }).map((_, i) => (
                    <Col key={i} xs={24} sm={12} md={8} lg={6}>
                        <div className="sk-card">
                            <Skeleton avatar={{ shape: 'square', size: 40 }} active title paragraph={{ rows: 2 }} />
                        </div>
                    </Col>
                ))}
            </Row>
        </div>
    );
}
