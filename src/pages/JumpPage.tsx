import React, { useMemo } from 'react';
import { Alert, Button, Card, Flex, Typography } from 'antd';
import { useSearchParams, useNavigate } from 'react-router-dom';

import { PageHeader } from '@components/common';

const { Text, Paragraph, Title } = Typography;

/**
 * 安全跳转中间页：任何跳往站外的链接都先经过这里，
 * 明确提示用户「即将离开本站」，由用户主动点击才真正跳转。
 * 目标 URL 的来源标记 ?lailu=hao.dao.js.cn 由 jumpUrl() 提前拼好。
 */
const JumpPage: React.FC = () => {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const raw = params.get('url') || '';
    const target = useMemo(() => {
        try {
            return decodeURIComponent(raw);
        } catch {
            return raw;
        }
    }, [raw]);

    // 只允许 http/https 外站，拦截 javascript: 等危险协议
    const safe = /^https?:\/\//i.test(target);

    const go = () => {
        if (safe && target) {
            window.location.href = target;
        }
    };

    return (
        <Flex vertical gap={20}>
            <PageHeader title="离开本站提示" crumbs={[{ label: '首页', to: '/' }]} />
            <Card>
                <Flex vertical gap={16} align="center">
                    <Title level={4} style={{ margin: 0 }}>
                        {safe ? '即将离开本站' : '链接无效'}
                    </Title>
                    {safe ? (
                        <Paragraph type="secondary" style={{ textAlign: 'center' }}>
                            你即将访问站外地址，点击「继续访问」后将以新页面打开：
                        </Paragraph>
                    ) : (
                        <Alert type="error" showIcon message="目标地址不合法，已阻止跳转。" />
                    )}
                    {safe ? (
                        <Paragraph copyable className="jump-target">
                            {target}
                        </Paragraph>
                    ) : null}
                    <Flex gap={12} wrap justify="center">
                        <Button type="primary" disabled={!safe} onClick={go}>
                            继续访问
                        </Button>
                        <Button onClick={() => navigate(-1)}>返回上一页</Button>
                    </Flex>
                    <Text type="secondary">本站不对站外内容负责，请注意保护个人信息。</Text>
                </Flex>
            </Card>
        </Flex>
    );
};

export default JumpPage;
