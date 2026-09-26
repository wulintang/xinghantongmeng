import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Empty,
  Flex,
  Popconfirm,
  Tag,
  Typography,
  message,
} from 'antd';
import { Link, useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';

import { usePageMeta } from '@/hooks/usePageMeta';
import {
  getMyColumns,
  getMyArticles,
  articleDel,
  COLUMN_STATUS_TEXT,
  type ColumnItem,
  type ColumnArticleItem,
} from '@/services/column';
import { getToken } from '@/utils/auth';
import { assetUrl } from '@/utils/route';

const { Text } = Typography;

const MyColumnDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const columnId = Number(id) || 0;
  const key = getToken();

  const [loading, setLoading] = useState(true);
  const [column, setColumn] = useState<ColumnItem | null>(null);
  const [articles, setArticles] = useState<ColumnArticleItem[]>([]);

  usePageMeta({
    title: column?.name ? `${column.name} - 文章管理` : '专栏文章管理',
    description: '管理专栏内的文章',
  });

  const load = () => {
    if (!key || !columnId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([getMyColumns(key), getMyArticles(key)])
      .then(([cols, arts]) => {
        const list = cols.code === 1 ? cols.data || [] : [];
        const c = list.find((x) => x.id === columnId) || null;
        setColumn(c);
        const allArts = arts.code === 1 ? arts.data || [] : [];
        // 文章 tid 是真实分类 id（my_article_cate.id），不是申请记录 id
        setArticles(allArts.filter((a) => a.tid === (c?.article_cate_id || 0)));
      })
      .catch(() => {
        setColumn(null);
        setArticles([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, columnId]);

  const openCreate = () => {
    if (!column || column.status !== 1) {
      message.warning('专栏通过审核后才能投稿');
      return;
    }
    navigate(`/user/article/create?tid=${column.article_cate_id}`);
  };

  const openEdit = (a: ColumnArticleItem) => {
    navigate(`/user/article/edit/${a.id}`);
  };

  const onDelete = (a: ColumnArticleItem) => {
    articleDel(a.id)
      .then((r) => {
        if (r.code === 1) {
          message.success('文章已删除，已发放的奖励将退还');
          load();
        } else {
          message.error(r.msg || '删除失败');
        }
      })
      .catch((e) => message.error(e?.message || '删除失败'));
  };

  const statusTag = (a: ColumnArticleItem) => {
    const map: Record<number, { color: string; text: string }> = {
      0: { color: 'gold', text: COLUMN_STATUS_TEXT[0] },
      1: { color: 'green', text: COLUMN_STATUS_TEXT[1] },
      2: { color: 'red', text: COLUMN_STATUS_TEXT[2] },
    };
    const s = map[a.status] || map[0];
    return <Tag color={s.color}>{s.text}</Tag>;
  };

  const columnStatusTag = useMemo(() => {
    if (!column) return null;
    const map: Record<number, { color: string; text: string }> = {
      0: { color: 'gold', text: COLUMN_STATUS_TEXT[0] },
      1: { color: 'green', text: COLUMN_STATUS_TEXT[1] },
      2: { color: 'red', text: COLUMN_STATUS_TEXT[2] },
    };
    const s = map[column.status] || map[0];
    return <Tag color={s.color}>{s.text}</Tag>;
  }, [column]);

  if (!key) {
    return (
      <Card className="user-center-card">
        <Alert type="info" showIcon message="请先登录" description="登录后可管理专栏文章。" />
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="user-center-card">
        <Flex vertical gap={16}>
          <Flex justify="space-between" align="center">
            <Text strong style={{ fontSize: 'var(--fs-lg)' }}>
              专栏文章管理
            </Text>
            <Button type="primary" disabled>
              投稿文章
            </Button>
          </Flex>
          <Card loading />
        </Flex>
      </Card>
    );
  }

  if (!column) {
    return (
      <Card className="user-center-card">
        <Flex vertical gap={16}>
          <Flex justify="space-between" align="center">
            <Text strong style={{ fontSize: 'var(--fs-lg)' }}>
              专栏文章管理
            </Text>
          </Flex>
          <Alert type="warning" showIcon message="专栏不存在或无权访问" />
          <Button type="link" onClick={() => navigate('/user/columns')}>
            返回我的专栏
          </Button>
        </Flex>
      </Card>
    );
  }

  return (
    <Card className="user-center-card">
      <Flex vertical gap={16}>
      <Flex justify="space-between" align="center" wrap gap={8}>
        <Flex align="center" gap={12} wrap>
          <Avatar shape="square" size={48} src={assetUrl(column.pic) || undefined}>
            {(column.name || '?').slice(0, 1)}
          </Avatar>
          <Flex vertical>
            <Flex align="center" gap={8}>
              <Text strong style={{ fontSize: 'var(--fs-lg)' }}>
                {column.name}
              </Text>
              {columnStatusTag}
            </Flex>
            <Text type="secondary" style={{ fontSize: 'var(--fs-sm)' }}>
              {column.description || '暂无简介'} · 共 {articles.length} 篇文章
            </Text>
          </Flex>
        </Flex>
        <Button type="primary" onClick={openCreate} disabled={column.status !== 1}>
          投稿文章
        </Button>
      </Flex>

      {column.status === 2 && column.reason ? (
        <Alert type="error" showIcon message={`拒绝原因：${column.reason}`} />
      ) : null}

      {column.status !== 1 ? (
        <Alert
          type="warning"
          showIcon
          message="专栏尚未通过审核"
          description="通过审核后才能向该专栏投稿文章。"
        />
      ) : null}

      {articles.length === 0 ? (
        <Empty description="该专栏暂无文章，点击右上角投稿" />
      ) : (
        articles.map((a) => (
          <Card key={a.id}>
            <Flex gap={12} align="center" wrap>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Flex align="center" gap={8} wrap>
                  <Text strong ellipsis>
                    <Link to={`/article/detail/${a.id}`} onClick={(e) => e.stopPropagation()}>
                      {a.title}
                    </Link>
                  </Text>
                  {statusTag(a)}
                </Flex>
                {a.status === 2 && a.reason ? (
                  <Text type="danger" style={{ fontSize: 'var(--fs-sm)' }}>
                    拒绝原因：{a.reason}
                  </Text>
                ) : null}
                <Text type="secondary" style={{ fontSize: 'var(--fs-sm)' }}>
                  {a.description || '暂无摘要'} · {dayjs.unix(a.time).format('YYYY-MM-DD')}
                </Text>
              </div>
            </Flex>
            <Flex justify="flex-end" gap={8} style={{ marginTop: 'var(--space-3)' }} wrap>
              <Button size="small" onClick={() => window.open(`/article/detail/${a.id}`, '_blank')}>
                查看
              </Button>
              <Button size="small" onClick={() => openEdit(a)}>
                编辑
              </Button>
              <Popconfirm
                title="确认删除该文章？"
                description="已发放的奖励将退还"
                onConfirm={() => onDelete(a)}
                okText="删除"
                cancelText="取消"
              >
                <Button size="small" danger>
                  删除
                </Button>
              </Popconfirm>
            </Flex>
          </Card>
        ))
      )}
      </Flex>
    </Card>
  );
};

export default MyColumnDetailPage;
