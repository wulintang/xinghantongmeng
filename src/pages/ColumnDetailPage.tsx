import React, { useEffect, useState } from 'react';
import { Alert, Avatar, Card, Empty, Flex, List, Typography, message } from 'antd';
import { Link, useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';

import { PageHeader, AdSlotSkeleton } from '@components/common';
import { usePageMeta } from '@/hooks/usePageMeta';
import { getColumns, getColumnArticles, type ColumnItem, type ColumnArticleItem } from '@/services/column';
import { assetUrl } from '@/utils/route';

const { Text } = Typography;

const ColumnDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const columnId = Number(id) || 0;

  const [loading, setLoading] = useState(true);
  const [column, setColumn] = useState<ColumnItem | null>(null);
  const [articles, setArticles] = useState<ColumnArticleItem[]>([]);
  const [error, setError] = useState('');

  usePageMeta({
    title: column?.name || '专栏详情',
    description: column?.description || undefined,
  });

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    setColumn(null);
    Promise.all([getColumns(), getColumnArticles(columnId)])
      .then(([cols, arts]) => {
        if (!alive) return;
        const c = (cols.data || []).find((x) => x.id === columnId) || null;
        if (!c) {
          setError('专栏不存在或未通过审核');
          return;
        }
        setColumn(c);
        setArticles(arts.code === 1 ? arts.data || [] : []);
      })
      .catch((e) => {
        if (alive) setError(e?.message || '加载失败');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [columnId]);

  if (loading) {
    return (
      <Flex vertical gap={20}>
        <PageHeader title="专栏详情" crumbs={[{ label: '首页', to: '/' }, { label: '专栏', to: '/columns' }, { label: '详情' }]} />
        <Card loading />
      </Flex>
    );
  }

  if (error || !column) {
    return (
      <Flex vertical gap={16}>
        <PageHeader title="专栏详情" crumbs={[{ label: '首页', to: '/' }, { label: '专栏', to: '/columns' }, { label: '详情' }]} />
        <Alert type="warning" showIcon message={error || '专栏不存在'} />
        <div>
          <Link to="/columns">返回专栏列表</Link>
        </div>
      </Flex>
    );
  }

  return (
    <Flex vertical gap={20}>
      <PageHeader
        title={column.name}
        crumbs={[{ label: '首页', to: '/' }, { label: '专栏', to: '/columns' }, { label: column.name }]}
      />

      <AdSlotSkeleton slot="detail_column_top" />

      <Card>
        <Flex gap={16} align="center" wrap>
          <Avatar shape="square" size={72} src={assetUrl(column.pic) || undefined}>
            {(column.name || '?').slice(0, 1)}
          </Avatar>
          <Flex vertical gap={6}>
            <Text strong style={{ fontSize: 'var(--fs-xl)' }}>
              {column.name}
            </Text>
            <Text type="secondary" style={{ fontSize: 'var(--fs-base)' }}>
              {column.description || '该专栏暂无简介'}
            </Text>
            <Flex align="center" gap={8}>
              <Avatar size={20} src={assetUrl(column.author_head) || undefined}>
                {(column.author || '官方').slice(0, 1)}
              </Avatar>
              <Text type="secondary" style={{ fontSize: 'var(--fs-sm)' }}>
                {column.uid === 0 ? '官方' : `作者：${column.author || '匿名'}`}
              </Text>
            </Flex>
          </Flex>
        </Flex>
      </Card>

      <Text type="secondary">共 {articles.length} 篇</Text>

      {articles.length === 0 ? (
        <Empty description="该专栏暂无文章" />
      ) : (
        <Card>
          <List
            itemLayout="vertical"
            dataSource={articles}
            rowKey={(a) => a.id}
            renderItem={(a) => (
              <List.Item
                actions={[
                  <Text type="secondary" key="time">
                    {dayjs.unix(a.time).format('YYYY-MM-DD HH:mm')}
                  </Text>,
                  <Text type="secondary" key="view">
                    浏览 {a.view}
                  </Text>,
                  <Text type="secondary" key="zan">
                    点赞 {a.zan}
                  </Text>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Link to={`/columns/article/${a.id}`} onClick={(e) => e.stopPropagation()}>
                      {a.title}
                    </Link>
                  }
                  description={a.description ? <Text type="secondary">{a.description}</Text> : null}
                />
              </List.Item>
            )}
          />
        </Card>
      )}
    </Flex>
  );
};

export default ColumnDetailPage;
