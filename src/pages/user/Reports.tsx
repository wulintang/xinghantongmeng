import React, { useEffect, useState } from 'react';
import { Card, Empty, List, Tag, Typography, message, Popconfirm, Button, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

import { PageHeader } from '@components/common';
import { ReportsSkeleton } from '@components/common/skeleton';
import { usePageMeta } from '@/hooks/usePageMeta';
import { getReports, type ReportItem } from '@/services/userCenter';
import { getToken } from '@/utils/auth';

const { Title, Text, Paragraph } = Typography;

/** 我的举报：卡片纵向排布（状态行独立一行，杜绝文字重叠），显示后台审核回复 */
const ReportsPage: React.FC = () => {
    const navigate = useNavigate();
    const [list, setList] = useState<ReportItem[]>([]);
    const [loading, setLoading] = useState(true);

    usePageMeta('我的举报');

    const load = () => {
        const key = getToken();
        if (!key) {
            navigate('/login');
            return;
        }
        setLoading(true);
        getReports(key)
            .then((r: any) => {
                if (r.code === 1) setList(r.data || []);
                else if (String(r.msg || '').indexOf('登录') >= 0) navigate('/login');
                else message.error(r.msg || '加载失败');
            })
            .catch((e) => message.error(e?.message || '网络错误'))
            .finally(() => setLoading(false));
    };

    useEffect(load, [navigate]);

    const statusOf = (v: any) => {
        const n = Number(v);
        if (n === 1) return { color: 'green', text: '已处理' };
        if (n === 9) return { color: 'red', text: '已拒绝' };
        return { color: 'orange', text: '待审核' };
    };
    const typeName = (m: any) => ({ website: '站点', article: '文章', tool: '工具', dan: '单页', ziti: '字库' }[m] || '内容');

    return (
        <Card className="user-card">
            <Title level={4}>我的举报</Title>
            {loading ? (
                <ReportsSkeleton />
            ) : list.length === 0 ? (
                <Empty description="暂无举报记录" />
            ) : (
                <List
                    dataSource={list}
                    renderItem={(item: any) => {
                        const st = statusOf(item.status);
                        return (
                            <List.Item className="report-item">
                                <div className="report-line report-head">
                                    <Text strong>{item.title || `举报 #${item.id}`}</Text>
                                    <Space>
                                        <Tag color="default">{typeName(item.m)}</Tag>
                                        <Tag color={st.color}>{st.text}</Tag>
                                    </Space>
                                </div>
                                <div className="report-line report-meta">
                                    <Text type="secondary">
                                        {item.time ? dayjs.unix(Number(item.time)).format('YYYY-MM-DD HH:mm') : ''}
                                        {item.tag ? `　分类：${item.tag}` : ''}
                                    </Text>
                                </div>
                                {item.content ? (
                                    <Paragraph type="secondary" className="report-line" style={{ marginBottom: 0 }}>
                                        举报内容：{item.content}
                                    </Paragraph>
                                ) : null}
                                {item.huifu ? (
                                    <Paragraph className="report-line report-reply" style={{ marginBottom: 0 }}>
                                        <Text type="warning">官方回复：</Text>
                                        {item.huifu}
                                    </Paragraph>
                                ) : null}
                            </List.Item>
                        );
                    }}
                />
            )}
        </Card>
    );
};

export default ReportsPage;
