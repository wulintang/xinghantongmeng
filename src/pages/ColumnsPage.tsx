import React, { useEffect, useState } from 'react';
import { Alert, Avatar, Card, Col, Empty, Flex, Row, Tag, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
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

const { Text } = Typography;

/** 每个专栏展示自己的最新 10 篇文章 */
const ARTICLE_LIMIT = 10;

const ColumnsPage: React.FC = () => {
  const navigate = useNavigate();
  const { site } = useSite();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<ColumnItem[]>([]);
  const [articlesMap, setArticlesMap] = useState<Record<number, ColumnArticleItem[]>>({});

  usePageMeta({
    title: '专栏',
    keywords: '专栏, 用户专栏, 作者专栏',
    description: '兴汉同盟用户与官方创建的专栏矩阵。',
  });

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getColumns()
      .then((r) => {
        if (!alive) return;
        if (r.code === 1 && r.data) setList(r.data);
        else setList([]);
      })
      .catch((e) => {
        if (alive) {
          setList([]);
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

  // 每个专栏只拉自己的文章，按发布时间倒序取最新 10 篇；不跨专栏混合
  useEffect(() => {
    if (!list.length) {
      setArticlesMap({});
      return;
    }
    let alive = true;
    Promise.all(
      list.map(async (c) => {
        try {
          const r = await getColumnArticles(c.id);
          const arts = r.code === 1 && r.data ? r.data : [];
          const latest = [...arts]
            .sort((x, y) => (y.time || 0) - (x.time || 0))
            .slice(0, ARTICLE_LIMIT);
          return [c.id, latest] as const;
        } catch {
          return [c.id, []] as const;
        }
      })
    ).then((pairs) => {
      if (!alive) return;
      const next: Record<number, ColumnArticleItem[]> = {};
      for (const [id, arts] of pairs) next[id] = arts;
      setArticlesMap(next);
    });
    return () => {
      alive = false;
    };
  }, [list]);

  return (
    <Flex vertical gap={20}>
      <PageHeader
        title="专栏"
        description="作者与官方创建的专栏矩阵"
        crumbs={[{ label: '首页', to: '/' }, { label: '专栏', to: '/article' }]}
      />

      {loading ? (
        <Row gutter={[16, 16]} align="stretch">
          {Array.from({ length: 6 }).map((_, i) => (
            <Col key={i} xs={24} sm={12} md={8}>
              <Card loading />
            </Col>
          ))}
        </Row>
      ) : list.length === 0 ? (
        <Empty description="暂无专栏" />
      ) : (
        <Row gutter={[16, 16]} align="stretch">
          {list.map((c) => {
            const arts = articlesMap[c.id] || [];
            return (
              <Col key={c.id} xs={24} sm={12} md={8}>
                <Card
                  hoverable
                  className="column-card"
                  style={{ height: '100%' }}
                  onClick={() => navigate(columnLink(c))}
                  styles={{ body: { padding: 16, height: '100%' } }}
                >
                  <Flex gap={14} align="center">
                    <Avatar shape="square" size={56} src={assetUrl(c.pic) || undefined}>
                      {(c.name || '?').slice(0, 1)}
                    </Avatar>
                    <div className="column-card-body">
                      <div className="column-card-name">
                        <Link
                          to={columnLink(c)}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {c.name}
                        </Link>
                      </div>
                      <Text type="secondary" className="column-card-desc">
                        {c.description || '暂无简介'}
                      </Text>
                      <div className="column-card-author">
                        {c.uid === 0 ? (
                          <Tag color="blue">
                            <Link to="/dan/about" style={{ color: 'inherit' }}>
                              作者：{site?.title || '官方'}
                            </Link>
                          </Tag>
                        ) : (
                          <Tag color="blue">
                            <Link to={`/user/${c.uid}`} style={{ color: 'inherit' }}>
                              作者：{c.author || '作者'}
                            </Link>
                          </Tag>
                        )}
                      </div>
                    </div>
                  </Flex>

                  {/* 本专栏自己的最新 10 篇；只用站点变量，不改卡片外壳样式 */}
                  {arts.length ? (
                    <Flex
                      vertical
                      gap={4}
                      style={{
                        marginTop: 12,
                        paddingTop: 10,
                        borderTop: '1px solid var(--c-border)',
                      }}
                    >
                      {arts.map((a) => (
                        <Link
                          key={a.id}
                          to={`/article/detail/${a.id}`}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontSize: 'var(--fs-xs)',
                            color: 'var(--c-text-2)',
                          }}
                        >
                          <span
                            style={{
                              flex: 1,
                              minWidth: 0,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {a.title}
                          </span>
                          {a.time ? (
                            <span style={{ flex: 'none', color: 'var(--c-text-3)' }}>
                              {dayjs.unix(Number(a.time)).format('YYYY-MM-DD')}
                            </span>
                          ) : null}
                        </Link>
                      ))}
                    </Flex>
                  ) : null}
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </Flex>
  );
};

export default ColumnsPage;
