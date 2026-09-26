import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Tag, Space, Popconfirm, Tooltip, message, Typography } from 'antd';
import { Link } from 'react-router-dom';

import { getMySites, delMySite, delMySiteApply } from '@/services/userCenter';
import { getToken } from '@/utils/auth';
import { usePageMeta } from '@/hooks/usePageMeta';
import CardTable from '@components/common/CardTable';
import type { WebsiteItem } from '@/services/userCenter';

const { Text } = Typography;

export default function MySitesPage() {
  const navigate = useNavigate();
  usePageMeta({ title: '我的站点' });
  const [list, setList] = useState<WebsiteItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    const key = getToken();
    if (!key) {
      navigate('/login');
      return;
    }
    setLoading(true);
    getMySites(key)
      .then((r: any) => {
        if (r.code === 1) setList(r.data || []);
        else {
          message.error(r.msg || '加载失败');
          if (r.msg && r.msg.indexOf('登录') >= 0) navigate('/login');
        }
      })
      .catch(() => message.error('网络错误'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [navigate]);

  const onDelete = (row: WebsiteItem) => {
    const key = getToken();
    const api = row.pending ? delMySiteApply : delMySite;
    api(key || '', row.id)
      .then((r: any) => {
        if (r.code === 1) {
          message.success('已删除');
          load();
        } else {
          message.error(r.msg || '删除失败');
        }
      })
      .catch(() => message.error('网络错误'));
  };

  const columns = [
    {
      title: '站点',
      dataIndex: 'title',
      render: (v: string, row: WebsiteItem) => (
        <Space>
          {row.ico ? <img src={row.ico} alt={row.title || ''} className="mysite-ico" /> : null}
          {row.pending ? (
            <Tooltip title={row.title || row.www || row.domain || v}>
              <span>{v}</span>
            </Tooltip>
          ) : (
            <Tooltip title={row.title || row.www || row.domain || v}>
              <Link to={`/${row.www || row.domain}`}>{v}</Link>
            </Tooltip>
          )}
        </Space>
      ),
    },
    { title: '域名', dataIndex: 'www', render: (v: string) => v || '-' },
    {
      title: '状态',
      dataIndex: 'open',
      render: (v: number) =>
        Number(v) === 1 ? (
          <Tag color="success">已收录</Tag>
        ) : Number(v) === 9 ? (
          <Tag color="error">已拒绝</Tag>
        ) : (
          <Tag color="warning">待审核</Tag>
        ),
    },
    { title: '浏览', dataIndex: 'view' },
    { title: '点赞', dataIndex: 'zan' },
    {
      title: '操作',
      render: (_: any, row: WebsiteItem) => (
        <Space wrap className="mysite-actions">
          {!row.pending && (
            <Button size="small" onClick={() => navigate(`/user/submit?mode=edit&siteId=${row.id}`)}>
              编辑
            </Button>
          )}
          <Popconfirm
            title={row.pending ? '确认撤回该申请？' : '确认删除该站点？'}
            onConfirm={() => onDelete(row)}
            okText="删除"
            cancelText="取消"
          >
            <Button size="small" danger>
              {row.pending ? '撤回' : '删除'}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      className="user-center-card"
      title="我的站点"
      extra={
        <Button type="primary" shape="round" onClick={() => navigate('/user/submit')}>
          + 提交站点
        </Button>
      }
    >
      <Text type="secondary">
        认领/提交的站点会出现在这里。点击「编辑」修改资料（仅改域名或 Feed 需重新验证域名归属），待审核的站点由管理员收录后对外展示。
      </Text>
      <CardTable<WebsiteItem>
        className="mt-16"
        rowKey="id"
        loading={loading}
        pagination={false}
        columns={columns}
        dataSource={list}
      />
    </Card>
  );
}
