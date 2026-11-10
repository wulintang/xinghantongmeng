import React, { useEffect, useState } from 'react';
import { Avatar, Card, Col, Empty, Flex, List, Row, Space, Tag, Typography, message } from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import dayjs from 'dayjs';

import { PageHeader } from '@components/common';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useSite } from '@/context/SiteContext';
import {
  getColumns,
  getSquareArticles,
  columnLink,
  type ColumnItem,
  type SquareArticleItem,
} from '@/services/column';
import { assetUrl } from '@/utils/route';

const { Text, Title } = Typography;

/** 所有专栏默认展示的最新文章条数 */
const LATEST_LIMIT = 10;

/** 所有专栏的最新 10 篇文章（后端 square 聚合，按置顶 + 时间倒序） */
function LatestArticles({ siteTitle }: { siteTitle?: string }) {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<SquareArticleItem[]>([]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getSquareArticles(1, LATEST_LIMIT)
      .then((r) => {
        if (alive) setList(r.code === 1 ? r.data || [] : []);
      })
      .catch(() => {
        if (alive) setList([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <Card
      title={<Title level={5} style={{ margin: 0 }}>最新文章</Title>}
      extra={
        <Text type="secondary" style={{ fontSize: 'var(--fs-sm)' }}>
          所有专栏 · 最新 {LATEST_LIMIT} 篇
        </Text>
      }
    >
      <List
        loading={loading}
        dataSource={list}
        locale={{ emptyText: <Empty description="暂无文章" /> }}
        renderItem={(a) => (
          <List.Item
            actions={[
              <Text key="view" type="secondary" style={{ fontSize: 'var(--fs-xs)' }}>
                {a.view || 0} 浏览
              </Text>,
            ]}
          >
            <List.Item.Meta
              title={<Link to={`/article/detail/${a.id}`}>{a.title}</Link>}
              description={
                <Space size={[8, 8]} wrap style={{ fontSize: 'var(--fs-xs)' }}>
                  {a.cate_name ? <Tag color="blue">{a.cate_name}</Tag> : null}
                  <Text type="secondary">
                    {a.uid === 0 ? siteTitle || '官方' : a.author || '匿名'}
                  </Text>
                  {a.time ? (
                    <Text type="secondary">{dayjs.unix(a.time).format('YYYY-MM-DD')}</Text>
                  ) : null}
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
}

const ColumnsPage: React.FC = () => {
  const navigate = useNavigate();
  const { site } = useSite();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<ColumnItem[]>([]);

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

  return (
    <Flex vertical gap={20}>
      <PageHeader
        title="专栏"
        description="作者与官方创建的专栏矩阵"
        crumbs={[{ label: '首页', to: '/' }, { label: '专栏', to: '/article' }]}
      />

      {/* 所有专栏默认展示最新十条文章内容 */}
      <LatestArticles siteTitle={site?.title} />

      <Title level={5} style={{ margin: 0 }}>全部专栏</Title>

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
          {list.map((c) => (
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
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Flex>
  );
};

export default ColumnsPage;
