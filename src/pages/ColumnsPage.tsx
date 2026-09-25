import React, { useEffect, useState } from 'react';
import { Alert, Avatar, Card, Col, Empty, Flex, Row, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

import { PageHeader } from '@components/common';
import { usePageMeta } from '@/hooks/usePageMeta';
import { getColumns, type ColumnItem } from '@/services/column';
import { assetUrl } from '@/utils/route';

const { Text } = Typography;

const ColumnsPage: React.FC = () => {
  const navigate = useNavigate();
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
        crumbs={[{ label: '首页', to: '/' }, { label: '专栏' }]}
      />

      {loading ? (
        <Row gutter={[16, 16]}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Col key={i} xs={24} sm={12} md={8}>
              <Card loading />
            </Col>
          ))}
        </Row>
      ) : list.length === 0 ? (
        <Empty description="暂无专栏" />
      ) : (
        <Row gutter={[16, 16]}>
          {list.map((c) => (
            <Col key={c.id} xs={24} sm={12} md={8}>
              <Card
                hoverable
                className="column-card"
                onClick={() => navigate(`/columns/${c.id}`)}
                styles={{ body: { padding: 16 } }}
              >
                <Flex gap={14} align="center">
                  <Avatar shape="square" size={56} src={assetUrl(c.pic) || undefined}>
                    {(c.name || '?').slice(0, 1)}
                  </Avatar>
                  <div className="column-card-body">
                    <div className="column-card-name">
                      <Link
                        to={`/columns/${c.id}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {c.name}
                      </Link>
                    </div>
                    <Text type="secondary" className="column-card-desc">
                      {c.description || '暂无简介'}
                    </Text>
                    <div className="column-card-author">
                      <Avatar size={18} src={assetUrl(c.author_head) || undefined}>
                        {(c.author || '官方').slice(0, 1)}
                      </Avatar>
                      <Text type="secondary" className="column-card-author-name">
                        {c.uid === 0 ? '官方' : c.author || '作者'}
                      </Text>
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
