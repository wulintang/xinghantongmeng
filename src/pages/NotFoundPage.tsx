import React from 'react';
import { Button, Result, Space } from 'antd';
import { useNavigate } from 'react-router-dom';

import { usePageMeta } from '@/hooks/usePageMeta';

const NotFoundPage: React.FC = () => {
    const navigate = useNavigate();
    usePageMeta({ title: '页面不存在' });

    return (
        <Result
            status="404"
            title="404"
            subTitle="抱歉，未找到你要访问的页面。"
            extra={
                <Space>
                    <Button type="primary" onClick={() => navigate('/home')}>
                        返回首页
                    </Button>
                    <Button onClick={() => navigate('/websites')}>去网址导航</Button>
                    <Button onClick={() => navigate('/blogs')}>去博客广场</Button>
                </Space>
            }
        />
    );
};

export default NotFoundPage;
