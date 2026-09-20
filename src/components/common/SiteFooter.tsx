import React, { useMemo } from 'react';
import { Col, Divider, Flex, Row, Space, Typography } from 'antd';
import { Link } from 'react-router-dom';

import { useSite } from '@/context/SiteContext';
import type { LinkItem } from '@/services/userCenter';
import { sanitizeHtml } from '@/utils/CommonUtil';
import { toRoute } from '@/utils/route';

const { Title, Text, Paragraph, Link: AntLink } = Typography;

/** 后端链接项渲染成链接（外链新窗口、站内走 SPA 路由） */
function FooterLink({ item }: { item: LinkItem }): React.JSX.Element {
    const target = toRoute(item.lianjie);
    const external = item.xin === 1 || target.external;

    if (target.external) {
        return (
            <a href={target.href} target="_blank" rel="noreferrer noopener">
                {item.name}
            </a>
        );
    }
    return (
        <Link to={target.to || '/'} {...(external ? { target: '_blank' } : {})}>
            {item.name}
        </Link>
    );
}

function LinkColumn({
    title,
    items,
    emptyText,
}: {
    title: string;
    items: LinkItem[];
    emptyText?: string;
}): React.JSX.Element {
    return (
        <Flex vertical gap={10}>
            <Title level={5} className="site-footer-col-title">
                {title}
            </Title>
            {items.length === 0 ? (
                <Text type="secondary">{emptyText || '暂无'}</Text>
            ) : (
                <Flex vertical gap={8}>
                    {items.map((l) => (
                        <FooterLink key={l.id} item={l} />
                    ))}
                </Flex>
            )}
        </Flex>
    );
}

export default function SiteFooter(): React.JSX.Element {
    const { site, footLinks, friendLinks } = useSite();

    // 站内导航 = 后台配置的底部导航（不再并入顶部导航，避免上下重复）
    const siteNav = useMemo(() => footLinks, [footLinks]);
    // 友情链接：底部展示前 4 条真实友链，「更多」入口永远显示（独立 /links 页展示全部）
    const friendPreview = useMemo<LinkItem[]>(() => [
        ...friendLinks.slice(0, 4),
        { id: -1, name: '更多', lianjie: '/links', xin: 0 } as LinkItem,
    ], [friendLinks]);

    const year = new Date().getFullYear();
    const gonganHtml = useMemo(() => sanitizeHtml(site?.gonganbei || ''), [site?.gonganbei]);

    return (
        <footer className="site-footer">
            <div className="container">
                <Row gutter={[32, 28]}>
                    <Col xs={24} md={10}>
                        <Flex vertical gap={12}>
                            <Flex align="center" gap={10}>
                                {site?.logo ? (
                                    <img src={site.logo} alt={site.title || ''} className="site-footer-logo" />
                                ) : null}
                            </Flex>
                            {site?.description ? (
                                <Paragraph type="secondary" className="site-footer-desc">
                                    {site.description}
                                </Paragraph>
                            ) : null}
                        </Flex>
                    </Col>

                    <Col xs={24} sm={12} md={7}>
                        <LinkColumn title="站内导航" items={siteNav} />
                    </Col>

                    <Col xs={24} sm={12} md={7}>
                        <LinkColumn title="友情链接" items={friendPreview} emptyText="暂无友情链接" />
                    </Col>
                </Row>

                <Divider className="site-footer-divider" />

                <Flex className="site-footer-bottom" justify="space-between" align="center" gap={12} wrap>
                    <Text type="secondary">
                        © {year} {site?.title || '兴汉同盟'} 版权所有
                    </Text>
                    <Space split={<Divider type="vertical" />} wrap>
                        {site?.beian ? (
                            <a className="site-footer-beian" href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer">
                                {site.beian}
                            </a>
                        ) : null}
                        {gonganHtml ? <span dangerouslySetInnerHTML={{ __html: gonganHtml }} /> : null}
                    </Space>
                </Flex>
            </div>
        </footer>
    );
}
