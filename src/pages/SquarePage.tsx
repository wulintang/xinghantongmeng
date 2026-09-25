import React, { useEffect, useState } from 'react';
import { Avatar, Card, Empty, Flex, Pagination, Typography, message } from 'antd';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';

import { PageHeader, AdSlotSkeleton } from '@components/common';
import { usePageMeta } from '@/hooks/usePageMeta';
import { getSquare, type ColumnArticleItem } from '@/services/column';
import { assetUrl } from '@/utils/route';

const { Text, Paragraph } = Typography;

const PAGE_SIZE = 10;

const SquarePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<ColumnArticleItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  usePageMeta({
    title: '广场',
    keywords: '广场, 文章聚合, 专栏文章',
    description: '兴汉同盟官方与用户专栏文章的聚合广场。',
  });

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getSquare(page, PAGE_SIZE)
      .then((r) => {
        if (!alive) return;
        if (r.code === 1 && r.data) {
          setList(r.data);
          // 后端按页返回固定条数，用实际返回长度粗略估算总量；不足一页视为末页
          setTotal(r.data.length < PAGE_SIZE ? (page - 1) * PAGE_SIZE + r.data.length : page * PAGE_SIZE + 1);
        } else {
          setList([]);
          setTotal(0);
        }
      })
      .catch((e) => {
        if (alive) {
          setList([]);
          setTotal(0);
          message.error(e?.message || '广场加载失败');
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [page]);

  return (
    <Flex vertical gap={20}>
      <PageHeader
        title="广场"
        description="官方与用户专栏的最新文章聚合"
        crumbs={[{ label: '首页', to: '/' }, { label: '广场' }]}
      />

      <AdSlotSkeleton slot="list_column_square_top" />

      {loading ? (
        <Card loading />
      ) : list.length === 0 ? (
        <Empty description="暂无文章" />
      ) : (
        <>
          <div className="square-list">
            {list.map((a) => (
              <Card key={a.id} hoverable className="square-card" styles={{ body: { padding: 16 } }}>
                <Flex gap={12} align="center" className="square-card-head">
                  <Avatar size={32} src={assetUrl(a.author_head) || undefined}>
                    {(a.author || '?').slice(0, 1)}
                  </Avatar>
                  <Text type="secondary" className="square-card-author">
                    {a.author || '匿名'}
                  </Text>
                  <Text type="secondary" className="square-card-time">
                    {dayjs.unix(a.time).format('YYYY-MM-DD HH:mm')}
                  </Text>
                </Flex>
                <Link to={`/columns/article/${a.id}`} className="square-card-title">
                  {a.title}
                </Link>
                {a.description ? (
                  <Paragraph type="secondary" ellipsis={{ rows: 2 }} className="square-card-desc">
                    {a.description}
                  </Paragraph>
                ) : null}
                <Flex gap={16} className="square-card-foot">
                  <Text type="secondary">浏览 {a.view}</Text>
                  <Text type="secondary">点赞 {a.zan}</Text>
                </Flex>
              </Card>
            ))}
          </div>
          {total > PAGE_SIZE ? (
            <Flex justify="center">
              <Pagination
                current={page}
                pageSize={PAGE_SIZE}
                total={total}
                showSizeChanger={false}
                onChange={setPage}
              />
            </Flex>
          ) : null}
        </>
      )}
    </Flex>
  );
};

export default SquarePage;
