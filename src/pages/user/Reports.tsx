import React, { useEffect, useState } from 'react';
import { Card, Empty, Table, Tag, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

import { PageHeader } from '@components/common';
import { ReportsSkeleton } from '@components/common/skeleton';
import { usePageMeta } from '@/hooks/usePageMeta';
import { getReports, type ReportItem } from '@/services/userCenter';
import { getToken } from '@/utils/auth';

const { Title, Text } = Typography;

const typeName = (m: any) => ({ website: '站点', article: '文章', tool: '工具', dan: '单页', ziti: '字库' }[m] || '内容');
const statusOf = (v: any) => {
    const n = Number(v);
    if (n === 1) return { color: 'green', text: '已处理' };
    if (n === 9) return { color: 'red', text: '已拒绝' };
    return { color: 'orange', text: '待审核' };
};

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

    return (
    <Card className="user-center-card">
      <Title level={4}>我的举报</Title>
            {loading ? (
                <ReportsSkeleton />
            ) : list.length === 0 ? (
                <Empty description="暂无举报记录" />
            ) : (
                <Table<ReportItem>
                    className="user-center-table"
                    dataSource={list}
                    rowKey="id"
                    pagination={false}
                    scroll={{ x: 'max-content' }}
                    expandable={{
                        expandedRowRender: (item: any) => (
                            <div className="report-detail">
                                {item.content ? (
                                    <div className="report-detail-line">
                                        <Text type="secondary">举报内容：</Text>
                                        <span>{item.content}</span>
                                    </div>
                                ) : null}
                                {item.tag ? (
                                    <div className="report-detail-line">
                                        <Text type="secondary">分类：</Text>
                                        <span>{item.tag}</span>
                                    </div>
                                ) : null}
                                {item.huifu ? (
                                    <div className="report-detail-line">
                                        <Text type="secondary">官方回复：</Text>
                                        <span>{item.huifu}</span>
                                    </div>
                                ) : null}
                            </div>
                        ),
                    }}
                    columns={[
                        {
                            title: '标题',
                            dataIndex: 'title',
                            render: (v: any, item: any) => v || `举报 #${item.id}`,
                        },
                        {
                            title: '类型',
                            dataIndex: 'm',
                            render: (m: any) => <Tag color="default">{typeName(m)}</Tag>,
                        },
                        {
                            title: '状态',
                            dataIndex: 'status',
                            render: (v: any) => {
                                const s = statusOf(v);
                                return <Tag color={s.color}>{s.text}</Tag>;
                            },
                        },
                        {
                            title: '时间',
                            dataIndex: 'time',
                            render: (t: any) => (t ? dayjs.unix(Number(t)).format('YYYY-MM-DD HH:mm') : ''),
                        },
                    ]}
                />
            )}
        </Card>
    );
};

export default ReportsPage;
