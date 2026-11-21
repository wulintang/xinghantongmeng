import React from 'react';
import { Avatar, Button, Card, Flex, Typography, Tag } from 'antd';
import AppTooltip from '@/components/common/AppTooltip';
import { Link } from 'react-router-dom';

import type { WebsiteItem } from '@/services/userCenter';
import { domainOf } from '@/utils/route';

const { Text, Paragraph } = Typography;

/**
 * 统一站点卡片：/websites 列表 与 首页「最新收录」复用同一套展示。
 * 右上角履约标识：已履约绿 / 未履约灰（灰也可隐藏，由 showFulfillBadge 控制）。
 * 按钮统一为「详细信息」，点击进入站点内页（不止展示 feed 文章）。
 */
interface SiteCardProps {
    item: WebsiteItem;
    size?: 'default' | 'small';
    /** 是否显示未履约灰色标识；首页最新收录可不显示未履约，仅显示已履约 */
    showFulfillBadge?: boolean;
}

const SiteCard: React.FC<SiteCardProps> = ({ item, size = 'default', showFulfillBadge = true }) => {
    const fulfill = item.fulfill;
    const isFulfilled = fulfill?.status === 1;
    const badgeText = isFulfilled ? `${fulfill?.agree || ''} · 已履约` : '未履约';
    const avatarSize = size === 'small' ? 40 : 48;
    const gap = size === 'small' ? 10 : 12;

    return (
        <Card className="site-card" size={size}>
            <div className="site-card-badge-wrap">
                {(isFulfilled || showFulfillBadge) && (
                    <Tag
                        color={isFulfilled ? 'success' : 'default'}
                        className={`site-fulfill-badge ${isFulfilled ? 'is-on' : 'is-off'}`}
                    >
                        {isFulfilled ? '✓ ' : '○ '}{badgeText}
                    </Tag>
                )}
            </div>
            <Flex vertical gap={gap}>
                <Flex align="center" gap={gap} className={(isFulfilled || showFulfillBadge) ? 'site-card-head has-badge' : 'site-card-head'}>
                    <Avatar shape="square" size={avatarSize} src={item.ico || item.pic || undefined}>
                        {(item.title || item.name || '?').slice(0, 1)}
                    </Avatar>
                    <Flex vertical gap={2} className="site-card-body">
                        <AppTooltip title={item.title || item.name}>
                            <Link to={`/${domainOf(item)}`} className="site-card-name">
                                {item.title || item.name}
                            </Link>
                        </AppTooltip>
                        <Text type="secondary" className="site-card-domain">
                            {item.domain || item.www}
                        </Text>
                    </Flex>
                </Flex>
                <Paragraph type="secondary" ellipsis={{ rows: 2 }} className="site-card-desc">
                    {item.content || item.keywords || item.domain}
                </Paragraph>
                <Flex justify="space-between" align="center" wrap gap={8}>
                    <Text type="secondary" className="site-card-meta">
                        浏览 {item.view} · 点赞 {item.zan}
                    </Text>
                    {item.url ? (
                        <AppTooltip title={item.title || item.name}>
                            <Link to={`/${domainOf(item)}`}>
                                <Button type="link" size="small">详细信息</Button>
                            </Link>
                        </AppTooltip>
                    ) : null}
                </Flex>
            </Flex>
        </Card>
    );
};

export default SiteCard;
