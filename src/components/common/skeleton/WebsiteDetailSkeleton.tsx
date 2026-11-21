import React from 'react';
import { Card, Flex, List } from 'antd';

import Skeleton from './Skeleton';

/** 网址详情骨架：按 WebsiteDetailPage 真实 DOM —— 站点头卡 + 站点信息卡 + 最新文章列表卡 */
export default function WebsiteDetailSkeleton(): React.JSX.Element {
    return (
        <div className="sk-page">
            <Card>
                <Flex gap={20} align="flex-start" wrap className="website-detail-head">
                    <Skeleton className="sk-avatar-square-72" />
                    <Flex vertical gap={10} className="detail-main">
                        <Flex gap={8} wrap className="site-info-pills">
                            <Skeleton className="sk-chip" style={{ width: 72 }} />
                            <Skeleton className="sk-chip" style={{ width: 96 }} />
                            <Skeleton className="sk-chip" style={{ width: 80 }} />
                        </Flex>
                        <Skeleton className="sk-line sk-line-long" />
                        <Skeleton className="sk-line sk-line-mid" />
                    </Flex>
                </Flex>
            </Card>
            <Card title="站点信息">
                <Flex vertical gap={12}>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Flex key={i} gap={16} align="center">
                            <Skeleton className="sk-line" style={{ width: 72 }} />
                            <Skeleton className="sk-line" style={{ width: 120 + (i % 3) * 60 }} />
                        </Flex>
                    ))}
                </Flex>
            </Card>
            <Card title="最新文章">
                <List
                    dataSource={Array.from({ length: 4 })}
                    renderItem={() => (
                        <List.Item>
                            <List.Item.Meta
                                title={<Skeleton className="sk-line sk-line-mid" />}
                                description={<Skeleton className="sk-line sk-line-short" />}
                            />
                        </List.Item>
                    )}
                />
            </Card>
        </div>
    );
}
