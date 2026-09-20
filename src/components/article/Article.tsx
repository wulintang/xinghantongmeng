import React from 'react';
import { Card, Space, Typography } from 'antd';

const { Title, Text, Paragraph } = Typography;

interface ArticleProps {
    title: string;
    content: React.ReactNode;
    publishedAt?: string;
}

export default function Article({ title, content, publishedAt }: ArticleProps): React.JSX.Element {
    return (
        <Space direction="vertical" size="middle" className="article-wrap">
            <div className="article-header">
                <Title level={4} className="article-title">
                    {title}
                </Title>
                {publishedAt ? (
                    <Text type="secondary" className="article-time">
                        {publishedAt}
                    </Text>
                ) : null}
            </div>

            <Card>
                {typeof content === 'string' ? (
                    <Paragraph className="article-body">{content}</Paragraph>
                ) : (
                    content
                )}
            </Card>
        </Space>
    );
}
