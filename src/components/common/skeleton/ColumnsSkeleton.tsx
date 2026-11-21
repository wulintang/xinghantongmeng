import React from 'react';
import { Card, Col, Flex, Row } from 'antd';

import Skeleton from './Skeleton';

/** 专栏列表骨架：按 ColumnsPage 真实 DOM —— column-card 网格（方图 + 名称 + 描述 + 作者） */
export default function ColumnsSkeleton(): React.JSX.Element {
    return (
        <Row gutter={[16, 16]} align="stretch">
            {Array.from({ length: 6 }).map((_, i) => (
                <Col key={i} xs={12} sm={12} md={8}>
                    <Card className="column-card u-h-100" styles={{ body: { padding: 16, height: '100%' } }}>
                        <Flex gap={14} align="center">
                            <Skeleton className="sk-avatar-square-56" />
                            <Flex vertical gap={8} style={{ flex: 1 }}>
                                <Skeleton className="sk-line" style={{ width: '70%', height: 16 }} />
                                <Skeleton className="sk-line sk-line-mid" />
                                <Skeleton className="sk-line sk-line-short" />
                            </Flex>
                        </Flex>
                    </Card>
                </Col>
            ))}
        </Row>
    );
}
