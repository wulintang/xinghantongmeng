import React from 'react';
import { Breadcrumb, Flex, Typography } from 'antd';
import { Link } from 'react-router-dom';

const { Title, Paragraph } = Typography;

export interface Crumb {
    label: string;
    to?: string;
}

interface PageHeaderProps {
    title: string;
    description?: string;
    crumbs?: Crumb[];
    extra?: React.ReactNode;
}

/** 统一页面头部：面包屑 + 标题 + 描述 + 右侧操作区 */
export default function PageHeader({ title, description, crumbs, extra }: PageHeaderProps): React.JSX.Element {
    return (
        <Flex vertical gap={12} className="page-header">
            {crumbs && crumbs.length > 0 ? (
                <Breadcrumb
                    items={crumbs.map((c) => ({
                        title: c.to ? <Link to={c.to} title={c.label}>{c.label}</Link> : c.label,
                    }))}
                />
            ) : null}
            <Flex justify="space-between" align="center" gap={16} wrap>
                <Flex vertical gap={4} className="page-header-main">
                    <Title level={3} className="page-title">
                        {title}
                    </Title>
                    {description ? (
                        <Paragraph type="secondary" className="page-desc">
                            {description}
                        </Paragraph>
                    ) : null}
                </Flex>
                {extra ? <div className="page-header-extra">{extra}</div> : null}
            </Flex>
        </Flex>
    );
}
