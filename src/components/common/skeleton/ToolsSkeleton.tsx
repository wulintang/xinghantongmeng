import React from 'react';
import { Card, Col, Flex, Row } from 'antd';

import Skeleton from './Skeleton';

/** 技能广场骨架：按 ToolsPage 真实 DOM —— tool-card 网格（图标居中 + 名称 + 说明 + 胶囊） */
export default function ToolsSkeleton(): React.JSX.Element {
    return (
        <div className="sk-page">
            <Row gutter={[16, 16]}>
                {Array.from({ length: 8 }).map((_, i) => (
                    <Col key={i} xs={12} sm={8} md={6}>
                        <Card className="tool-card">
                            <div className="sk-tool-card-inner">
                                <Skeleton className="sk-avatar-square-48" />
                                <Skeleton className="sk-line sk-line-mid" />
                                <Skeleton className="sk-line sk-line-long" />
                                <Flex gap={4} justify="center">
                                    <Skeleton className="sk-chip" style={{ width: 40, height: 20 }} />
                                    <Skeleton className="sk-chip" style={{ width: 40, height: 20 }} />
                                </Flex>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
}
