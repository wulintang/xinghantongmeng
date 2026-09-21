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

  const linkOf = (it: any): string => {
    switch (it.m) {
      case 'website': return it.url ? `https://${it.url}` : '#';
      case 'article': return it.tid ? `/articles/${it.tid}` : '#';
      case 'tool': return it.tid ? `/tools/${it.tid}` : '#';
      case 'dan': return it.url ? `/dan/${it.url}` : '#';
      case 'feed': return it.url ? `/abstract?link=${encodeURIComponent(it.url)}` : '#';
      default: return '#';
    }
  };
  const labelOf = (m: string) => ({ website: '站点', article: '文章', tool: '工具', dan: '单页', feed: '动态' }[m] || '内容');

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
                title={
                  (() => {
                    const href = linkOf(it as any);
                    const label = it.name || `收藏 #${it.tid}`;
                    return href === '#' ? <span>{label}</span> : <a href={href} target={it.m === 'website' ? '_blank' : undefined} rel={it.m === 'website' ? 'noreferrer' : undefined}>{label}</a>;
                  })()
                }
                description={
                  <>
                    <Tag>{labelOf(it.m)}</Tag>
                    {it.feed_url ? <Tag color="green">有 feed</Tag> : null}
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
