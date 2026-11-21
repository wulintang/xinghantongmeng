import React from 'react';
import { Card, Col, Flex, Row } from 'antd';

import Skeleton from './Skeleton';

/** 首页骨架：按 HomePage 真实 DOM —— 站点卡片网格 + 专栏/文章双列 + 集市网格 */
export default function HomeSkeleton(): React.JSX.Element {
    return (
        <div className="sk-page">
            <Flex justify="space-between" align="center">
                <Skeleton className="sk-line-title" />
                <Skeleton className="sk-chip" style={{ width: 80 }} />
            </Flex>
            <Row gutter={[16, 16]}>
                {Array.from({ length: 8 }).map((_, i) => (
                    <Col key={i} xs={12} sm={12} md={8} lg={6}>
                        <Card className="site-card" size="small">
                            <Flex vertical gap={10}>
                                <Flex align="center" gap={10}>
                                    <Skeleton className="sk-avatar-square-40" />
                                    <Skeleton className="sk-line sk-line-mid" />
                                </Flex>
                                <Skeleton className="sk-line sk-line-long" />
                                <Skeleton className="sk-line sk-line-mid" />
                            </Flex>
                        </Card>
                    </Col>
                ))}
            </Row>
            <Row gutter={[16, 16]}>
                {[0, 1].map((col) => (
                    <Col key={col} xs={24} lg={12}>
                        <Skeleton className="sk-line-title" />
                        <div className="home-list">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="sk-list-item">
                                    <Flex gap={10} align="center">
                                        <Skeleton className="sk-avatar-square-40" />
                                        <Flex vertical gap={6} style={{ flex: 1 }}>
                                            <Skeleton className="sk-line sk-line-mid" />
                                            <Skeleton className="sk-line sk-line-short" />
                                        </Flex>
                                    </Flex>
                                </div>
                            ))}
                        </div>
                    </Col>
                ))}
            </Row>
        </div>
    );
}
