import React from 'react';
import { Col, Row, Skeleton } from 'antd';

/** 常用工具骨架：分类条 + 工具方格（图标居中 + 标题 + 一行说明） */
export default function ToolsSkeleton(): React.JSX.Element {
    return (
        <div className="sk-page">
            <Skeleton active title={{ width: '20%' }} paragraph={{ rows: 1, width: ['40%'] }} />
            <Skeleton.Button active className="sk-filter" />
            <Row gutter={[16, 16]}>
                {Array.from({ length: 8 }).map((_, i) => (
                    <Col key={i} xs={12} sm={8} md={6}>
                        <div className="sk-tool-card">
                            <Skeleton.Avatar active shape="square" size={48} />
                            <Skeleton.Input active size="small" className="sk-tool-name" />
                            <Skeleton.Input active size="small" className="sk-tool-desc" />
                        </div>
                    </Col>
                ))}
            </Row>
        </div>
    );
}
