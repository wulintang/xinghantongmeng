import React, { useEffect, useMemo, useState } from 'react';
import { Col, Divider, Flex, Row, Space, Tooltip, Typography } from 'antd';
import { Link } from 'react-router-dom';

import { fetchLatestSha } from '@/utils/gitCommits';
import { useSite } from '@/context/SiteContext';
import type { CustomConfig, LinkItem } from '@/services/userCenter';
import { getCustomConfig } from '@/services/userCenter';
import { sanitizeHtml } from '@/utils/CommonUtil';
import { toRoute } from '@/utils/route';

const { Title, Text, Paragraph, Link: AntLink } = Typography;

/** 后端链接项渲染成链接（外链新窗口、站内走 SPA 路由） */
function FooterLink({ item }: { item: LinkItem }): React.JSX.Element {
    const target = toRoute(item.lianjie);
    const external = item.xin === 1 || target.external;

    if (target.external) {
        return (
            <Tooltip title={item.name}>
                <a href={target.href} target="_blank" rel="noreferrer noopener">
                    {item.name}
                </a>
            </Tooltip>
        );
    }
    return (
        <Tooltip title={item.name}>
            <Link to={target.to || '/'} {...(external ? { target: '_blank' } : {})}>
                {item.name}
            </Link>
        </Tooltip>
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
                <Flex vertical gap={8} align="flex-start">
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
    // 广告价格单为硬编码入口（与 Header 的 GRID_ENTRY 同理，后端 my_link 无此条目）
    const adPriceEntry: LinkItem = { id: -2, name: '广告价格', lianjie: '/dan/ad', xin: 0 } as LinkItem;
    const siteNav = useMemo<LinkItem[]>(() => {
        const list = footLinks.slice();
        if (!list.some((l) => (l.lianjie || '').startsWith('/dan/ad'))) list.push(adPriceEntry);
        return list;
    }, [footLinks]);
    // 友情链接：底部展示前 4 条真实友链，「更多」入口永远显示（独立 /links 页展示全部）
    const friendPreview = useMemo<LinkItem[]>(() => [
        ...friendLinks.slice(0, 4),
        { id: -1, name: '更多', lianjie: '/links', xin: 0 } as LinkItem,
    ], [friendLinks]);

    const year = new Date().getFullYear();
    const gonganHtml = useMemo(() => sanitizeHtml(site?.gonganbei || ''), [site?.gonganbei]);

    // 页脚版本号：运行时从 GitHub 拉取最新提交短哈希（不写死在前端）
    const [version, setVersion] = useState<string>('');
    useEffect(() => {
        let alive = true;
        fetchLatestSha()
            .then((s) => {
                if (alive) setVersion(s);
            })
            .catch(() => {});
        return () => {
            alive = false;
        };
    }, []);

    // Footer 左侧版权内容：优先读取后台「自定义配置」的 footer_left（支持 HTML），未配置则回退默认文案
    const [custom, setCustom] = useState<CustomConfig | null>(null);
    useEffect(() => {
        let alive = true;
        getCustomConfig()
            .then((r) => {
                if (alive && r && r.code === 1) setCustom(r.data || null);
            })
            .catch(() => {});
        return () => {
            alive = false;
        };
    }, []);
    const footerLeftHtml = useMemo(
        () => (custom?.footer_left ? sanitizeHtml(custom.footer_left) : ''),
        [custom?.footer_left]
    );

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

                    <Col xs={12} sm={12} md={7}>
                        <LinkColumn title="站内导航" items={siteNav} />
                    </Col>

                    <Col xs={12} sm={12} md={7}>
                        <LinkColumn title="友情链接" items={friendPreview} emptyText="暂无友情链接" />
                    </Col>
                </Row>

                <Divider className="site-footer-divider" />

                <Flex className="site-footer-bottom" justify="space-between" align="center" gap={12} wrap>
                    <Text type="secondary">
                        {footerLeftHtml ? (
                            <span dangerouslySetInnerHTML={{ __html: footerLeftHtml }} />
                        ) : (
                            <>© {year} {site?.title || '兴汉同盟'} 版权所有</>
                        )}
                        、前端：兴汉同盟{' '}
                        <Link to="/dan/update">{version || '更新日志'}</Link>
                    </Text>
                    <Space split={<Divider type="vertical" />} wrap>
                        {site?.beian ? (
                            <Tooltip title="ICP备案查询">
                                <a className="site-footer-beian" href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer">
                                    {site.beian}
                                </a>
                            </Tooltip>
                        ) : null}
                        {gonganHtml ? (
                            <Tooltip title="公安备案查询">
                                <span dangerouslySetInnerHTML={{ __html: gonganHtml }} />
                            </Tooltip>
                        ) : null}
                    </Space>
                </Flex>
            </div>
        </footer>
    );
}
