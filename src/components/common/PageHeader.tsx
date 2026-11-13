import React from 'react';
import { Flex, Typography } from 'antd'

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

/** 统一页面头部：标题 + 描述 + 右侧操作区（面包屑已全站移除，不再渲染） */
export default function PageHeader({ title, description, crumbs, extra }: PageHeaderProps): React.JSX.Element {
    return (
        <Flex vertical gap={12} className="page-header">
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
