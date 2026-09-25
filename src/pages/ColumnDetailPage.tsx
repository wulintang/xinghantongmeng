import React, { useEffect, useState } from 'react';
import { Alert, Avatar, Card, Divider, Flex, Space, Tooltip, Typography } from 'antd';
import { Link, useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';

import { PageHeader, AdSlotSkeleton } from '@components/common';
import { usePageMeta } from '@/hooks/usePageMeta';
import { getColumns, getColumnArticles, type ColumnItem, type ColumnArticleItem } from '@/services/column';
import { assetUrl } from '@/utils/route';

const { Text } = Typography;

// 内联 SVG 图标（项目未安装 @ant-design/icons，复用 BlogsPage 同款）
const ClockIcon = () => (
  <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
    <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z" />
    <path d="M686.7 638.6L544.1 535.5V288c0-4.4-3.6-8-8-8H488c-4.4 0-8 3.6-8 8v275.4c0 2.6 1.2 5 3.3 6.5l165.4 120.6c3.6 2.6 8.6 1.8 11.2-1.7l28.6-39c2.6-3.7 1.8-8.7-1.8-11.2z" />
  </svg>
);
const EyeIcon = () => (
  <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
    <path d="M942.2 486.2C847.4 286.5 704.1 186 512 186c-192.2 0-335.4 100.5-430.2 300.3a60.3 60.3 0 000 51.5C176.6 737.5 319.9 838 512 838c192.2 0 335.4-100.5 430.2-300.3 7.7-16.2 7.7-35 0-51.5zM512 766c-161.3 0-279.4-81.8-362.7-254C232.6 339.8 350.7 258 512 258c161.3 0 279.4 81.8 362.7 254C791.5 684.2 673.4 766 512 766zm-4-430c-97.2 0-176 78.8-176 176s78.8 176 176 176 176-78.8 176-176-78.8-176-176-176zm0 288c-61.9 0-112-50.1-112-112s50.1-112 112-112 112 50.1 112 112-50.1 112-112 112z" />
  </svg>
);
const HeartIcon = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

/** 相对时间：刚刚 / x 分钟前 / x 小时前 / x 天前 / x 个月前 / 日期（与 BlogsPage 同款） */
function timeAgo(t?: number): string {
  if (!t) return '';
  const d = dayjs.unix(t);
  if (!d.isValid()) return '';
  const now = dayjs();
  const diffMin = now.diff(d, 'minute');
  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin} 分钟前`;
  const diffH = now.diff(d, 'hour');
  if (diffH < 24) return `${diffH} 小时前`;
  const diffD = now.diff(d, 'day');
  if (diffD < 30) return `${diffD} 天前`;
  const diffM = now.diff(d, 'month');
  if (diffM < 12) return `${diffM} 个月前`;
  return d.format('YYYY-MM-DD');
}

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
        <PageHeader title="专栏详情" crumbs={[{ label: '首页', to: '/' }, { label: '专栏', to: '/article' }, { label: '详情' }]} />
        <Card loading />
      </Flex>
    );
  }

  if (error || !column) {
    return (
      <Flex vertical gap={16}>
        <PageHeader title="专栏详情" crumbs={[{ label: '首页', to: '/' }, { label: '专栏', to: '/article' }, { label: '详情' }]} />
        <Alert type="warning" showIcon message={error || '专栏不存在'} />
        <div>
          <Link to="/article">返回专栏列表</Link>
        </div>
      </Flex>
    );
  }

  return (
    <Flex vertical gap={20}>
      <PageHeader
        title={column.name}
        crumbs={[{ label: '首页', to: '/' }, { label: '专栏', to: '/article' }, { label: column.name }]}
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
        <div className="feed-empty">该专栏暂无文章</div>
      ) : (
        <div className="feed-timeline">
          {articles.map((a) => {
            const detailRoute = `/article/detail/${a.id}`;
            const authorAvatar = assetUrl(column.author_head || '');
            const authorName = column.name || a.author || '专栏';
            return (
              <div className="feed-timeline-item" key={a.id}>
                <div className="feed-author-col">
                  <Avatar
                    className="feed-author-avatar"
                    shape="circle"
                    src={authorAvatar || undefined}
                  >
                    {(authorName || '?').slice(0, 1)}
                  </Avatar>
                  <span className="feed-author-name">{authorName}</span>
                </div>

                <div className="feed-bubble" onClick={() => navigate(detailRoute)}>
                  <div className="feed-bubble-arrow feed-bubble-arrow-border" />
                  <div className="feed-bubble-arrow feed-bubble-arrow-fill" />
                  <div className="feed-bubble-inner">
                    <Link
                      to={detailRoute}
                      className="feed-bubble-title"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {a.title}
                    </Link>
                    {a.description ? (
                      <div className="feed-bubble-desc">{a.description}</div>
                    ) : null}
                    <Divider dashed className="feed-bubble-divider" />
                    <div className="feed-bubble-foot">
                      <Space size={16} className="feed-bubble-foot-left">
                        <span className="feed-bubble-time">
                          <ClockIcon /> {timeAgo(a.time)}
                        </span>
                        <span className="feed-bubble-views">
                          <EyeIcon /> {a.view || 0}
                        </span>
                        <span className="feed-bubble-views">
                          <HeartIcon /> {a.zan || 0}
                        </span>
                      </Space>
                      <Space size={12} className="feed-bubble-actions">
                        <Tooltip title="查看文章">
                          <Link
                            to={detailRoute}
                            className="feed-bubble-action feed-bubble-icon-only"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <EyeIcon />
                          </Link>
                        </Tooltip>
                      </Space>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Flex>
  );
};

export default ColumnDetailPage;
