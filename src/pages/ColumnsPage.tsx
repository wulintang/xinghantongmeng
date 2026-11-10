import React, { useEffect, useMemo, useState } from 'react';
import { Avatar, Card, Empty, Flex, List, Space, Tag, Typography, message } from 'antd';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';

import { PageHeader } from '@components/common';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useSite } from '@/context/SiteContext';
import {
  getColumns,
  getColumnArticles,
  columnLink,
  type ColumnItem,
  type ColumnArticleItem,
} from '@/services/column';
import { assetUrl } from '@/utils/route';

const { Text, Title } = Typography;

/** 每个专栏默认展示自己最新的文章条数 */
const LATEST_LIMIT = 10;

interface ColumnGroup {
  column: ColumnItem;
  articles: ColumnArticleItem[];
  total: number;
}

/** 单个专栏区块：只展示该专栏自己的文章（按时间倒序，默认最新 10 篇） */
function ColumnArticleGroup({ group, siteTitle }: { group: ColumnGroup; siteTitle?: string }) {
  const c = group.column;
  const link = columnLink(c);
  const author = c.uid === 0 ? siteTitle || '官方' : c.author || '作者';

  return (
    <Card
      className="column-card"
      styles={{ body: { padding: 0 } }}
      title={
        <Flex gap={12} align="center" wrap>
          <Avatar shape="square" size={40} src={assetUrl(c.pic) || undefined}>
            {(c.name || '?').slice(0, 1)}
          </Avatar>
          <Flex vertical gap={2} style={{ minWidth: 0 }}>
            <Link to={link} className="column-card-name" style={{ fontSize: 'var(--fs-md)' }}>
              {c.name}
            </Link>
            <Text type="secondary" style={{ fontSize: 'var(--fs-xs)' }}>
              {c.uid === 0 ? (
                <Tag color="blue" style={{ marginInlineEnd: 4 }}>作者：{author}</Tag>
              ) : (
                <Link to={`/user/${c.uid}`}>
                  <Tag color="blue" style={{ marginInlineEnd: 4 }}>作者：{author}</Tag>
                </Link>
              )}
              {c.description || '暂无简介'}
            </Text>
          </Flex>
        </Flex>
      }
      extra={
        <Space size={8} wrap>
          <Text type="secondary" style={{ fontSize: 'var(--fs-xs)' }}>
            共 {group.total} 篇 · 展示最新 {Math.min(group.total, LATEST_LIMIT)} 篇
          </Text>
          <Link to={link}>进入专栏 →</Link>
        </Space>
      }
    >
      <List
        dataSource={group.articles}
        locale={{ emptyText: <Empty description="该专栏暂无文章" /> }}
        renderItem={(a) => (
          <List.Item
            actions={[
              <Text key="view" type="secondary" style={{ fontSize: 'var(--fs-xs)' }}>
                {a.view || 0} 浏览
              </Text>,
              a.time ? (
                <Text key="date" type="secondary" style={{ fontSize: 'var(--fs-xs)' }}>
                  {dayjs.unix(a.time).format('YYYY-MM-DD')}
                </Text>
              ) : null,
            ].filter(Boolean) as React.ReactNode[]}
          >
            <List.Item.Meta
              title={<Link to={`/article/detail/${a.id}`}>{a.title || '未命名文章'}</Link>}
              description={
                a.description ? (
                  <Text type="secondary" style={{ fontSize: 'var(--fs-xs)' }}>
                    {a.description.replace(/<[^>]+>/g, '').slice(0, 80)}
                  </Text>
                ) : null
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
}

const ColumnsPage: React.FC = () => {
  const { site } = useSite();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<ColumnGroup[]>([]);

  usePageMeta({
    title: '专栏',
    keywords: '专栏, 用户专栏, 作者专栏',
    description: '兴汉同盟用户与官方创建的专栏矩阵，每个专栏展示自己的最新文章。',
  });

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getColumns()
      .then(async (r) => {
        const columns = r.code === 1 && r.data ? r.data : [];
        // 每个专栏单独取自己的文章：严格保证「哪个专栏就展示哪个专栏的文章」
        const results = await Promise.all(
          columns.map(async (c) => {
            try {
              const ar = await getColumnArticles(c.id);
              return ar.code === 1 && ar.data ? ar.data : [];
            } catch {
              return [] as ColumnArticleItem[];
            }
          })
        );
        if (!alive) return;
        const next: ColumnGroup[] = columns.map((c, i) => {
          // 按发布时间倒序（置顶优先由后端保证，这里只做时间兜底）
          const sorted = [...results[i]].sort((a, b) => (b.time || 0) - (a.time || 0));
          return { column: c, articles: sorted.slice(0, LATEST_LIMIT), total: sorted.length };
        });
        setGroups(next);
      })
      .catch((e) => {
        if (alive) {
          setGroups([]);
          message.error(e?.message || '专栏加载失败');
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const totalArticles = useMemo(
    () => groups.reduce((sum, g) => sum + g.total, 0),
    [groups]
  );

  return (
    <Flex vertical gap={20}>
      <PageHeader
        title="专栏"
        description="按专栏浏览文章，每个专栏展示自己最新的 10 篇"
        crumbs={[{ label: '首页', to: '/' }, { label: '专栏', to: '/article' }]}
      />

      <Title level={5} style={{ margin: 0 }}>
        全部专栏
        {!loading ? (
          <Text type="secondary" style={{ fontSize: 'var(--fs-sm)', fontWeight: 400, marginLeft: 12 }}>
            {groups.length} 个专栏 · {totalArticles} 篇文章
          </Text>
        ) : null}
      </Title>

      {loading ? (
        <Flex vertical gap={16}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} loading />
          ))}
        </Flex>
      ) : groups.length === 0 ? (
        <Empty description="暂无专栏" />
      ) : (
        <Flex vertical gap={16}>
          {groups.map((g) => (
            <ColumnArticleGroup key={g.column.id} group={g} siteTitle={site?.title} />
          ))}
        </Flex>
      )}
    </Flex>
  );
};

export default ColumnsPage;
