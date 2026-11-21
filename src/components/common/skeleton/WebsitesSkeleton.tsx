import React from 'react';
import { Card, Col, Flex, Row } from 'antd';

import Skeleton from './Skeleton';

/** 网址导航骨架：按 WebsitesPage 真实 DOM —— 搜索框 + 分类胶囊 + site-card 网格 */
export default function WebsitesSkeleton(): React.JSX.Element {
    return (
        <div className="sk-page">
            <div className="sk-block sk-search" style={{ height: 40 }} />
            <Flex wrap gap={8} className="cate-filter-wrap">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="sk-chip" style={{ width: 64 + (i % 3) * 20 }} />
                ))}
            </Flex>
            <Row gutter={[16, 16]}>
                {Array.from({ length: 12 }).map((_, i) => (
                    <Col key={i} xs={24} sm={12} md={8}>
                        <Card className="site-card">
                            <Flex vertical gap={10}>
                                <Flex align="center" gap={10}>
                                    <Skeleton className="sk-avatar-square-48" />
                                    <Flex vertical gap={6} className="site-card-body sk-site-card-titles">
                                        <Skeleton className="sk-line sk-line-mid" />
                                        <Skeleton className="sk-line sk-line-short" />
                                    </Flex>
                                </Flex>
                                <Skeleton className="sk-line sk-line-long" />
                                <Skeleton className="sk-line sk-line-mid" />
                                <Flex justify="space-between" align="center">
                                    <Skeleton className="sk-line sk-line-short" />
                                    <Skeleton className="sk-chip" style={{ width: 56 }} />
                                </Flex>
                            </Flex>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
}
