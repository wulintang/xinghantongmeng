import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, List, Typography, Empty, Tag } from 'antd';
import { getFavorites } from '@/services/userCenter';
import { getToken } from '@/utils/auth';
import { FavoriteItem } from '@/services/userCenter';
import { usePageMeta } from '@/hooks/usePageMeta';
import { FavoritesSkeleton } from '@components/common/skeleton';
import dayjs from 'dayjs';

const { Title } = Typography;

export default function FavoritesPage() {
  const navigate = useNavigate();
  usePageMeta({ title: '我的收藏' });
  const [list, setList] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const key = getToken();
    if (!key) {
      navigate('/login');
      return;
    }
    getFavorites(key)
      .then((r: any) => {
        if (r.code === 1) setList(r.data || []);
        else navigate('/login');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [navigate]);

  return (
    <Card className="user-card user-card-720">
      <Title level={4}>我的收藏</Title>
      {loading ? (
        <FavoritesSkeleton />
      ) : list.length === 0 ? (
        <Empty description="还没有收藏" />
      ) : (
        <List
          dataSource={list}
          renderItem={(it) => (
            <List.Item>
              <List.Item.Meta
                title={<a href={`https://${it.domain}`} target="_blank" rel="noreferrer">{it.site_name}</a>}
                description={
                  <>
                    <Tag>{it.domain}</Tag>
                    {it.feed_url ? <Tag color="green">有 feed</Tag> : <Tag>无 feed</Tag>}
                    <span className="color-secondary-12">{dayjs(it.time * 1000).format('YYYY-MM-DD')}</span>
                  </>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}
