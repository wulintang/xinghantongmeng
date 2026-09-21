import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, List, Typography, Empty, Tag, Alert, Checkbox, Button, Space, message } from 'antd';
import { getFavorites, toggleFavorite } from '@/services/userCenter';
import { FavoriteItem } from '@/services/userCenter';
import { getToken } from '@/utils/auth';
import { usePageMeta } from '@/hooks/usePageMeta';
import { FavoritesSkeleton } from '@components/common/skeleton';
import dayjs from 'dayjs';

const { Title } = Typography;

export default function FavoritesPage() {
  const navigate = useNavigate();
  usePageMeta({ title: '我的收藏' });
  const [list, setList] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [checkedIds, setCheckedIds] = useState<number[]>([]);
  const [canceling, setCanceling] = useState(false);

  const load = () => {
    const key = getToken();
    if (!key) {
      navigate('/login');
      return;
    }
    getFavorites(key)
      .then((r: any) => {
        if (r.code === 1) {
          setList(r.data || []);
          setErr('');
        } else {
          setErr(r.msg || '加载收藏失败');
        }
      })
      .catch((e: any) => setErr(e?.message || '加载收藏失败'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [navigate]);

  const linkOf = (it: FavoriteItem): string => {
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
  const nameOf = (it: FavoriteItem) => it.name || it.url || `收藏 #${it.tid}`;

  const allChecked = list.length > 0 && checkedIds.length === list.length;

  const onToggleCheck = (favId: number, checked: boolean) => {
    setCheckedIds((ids) => (checked ? [...new Set([...ids, favId])] : ids.filter((x) => x !== favId)));
  };
  const onToggleAll = (checked: boolean) => {
    setCheckedIds(checked ? list.map((it) => it.fav_id) : []);
  };

  const doCancel = (it: FavoriteItem) => {
    const key = getToken();
    if (!key) {
      message.warning('请先登录');
      return;
    }
    setCanceling(true);
    toggleFavorite(key, it.tid, it.m)
      .then((r: any) => {
        if (r.code === 1) {
          message.success('已取消收藏');
          setCheckedIds((ids) => ids.filter((x) => x !== it.fav_id));
          load();
        } else {
          message.error(r.msg || '取消失败');
        }
      })
      .catch(() => message.error('取消失败，请稍后重试'))
      .finally(() => setCanceling(false));
  };

  const onCancelChecked = () => {
    if (checkedIds.length === 0) return;
    const key = getToken();
    if (!key) {
      message.warning('请先登录');
      return;
    }
    setCanceling(true);
    const targets = list.filter((it) => checkedIds.includes(it.fav_id));
    let done = 0;
    const next = () => {
      if (done >= targets.length) {
        message.success('已取消选中收藏');
        setCheckedIds([]);
        setCanceling(false);
        load();
        return;
      }
      const it = targets[done++];
      toggleFavorite(key, it.tid, it.m)
        .then(next)
        .catch(next);
    };
    next();
  };

  return (
    <Card className="user-center-card">
      <Title level={4}>我的收藏</Title>
      <div className="msg-toolbar">
        <Checkbox checked={allChecked} onChange={(e) => onToggleAll(e.target.checked)}>全选</Checkbox>
        <Button size="small" danger onClick={onCancelChecked} disabled={checkedIds.length === 0 || canceling}>
          取消选中收藏{checkedIds.length ? `(${checkedIds.length})` : ''}
        </Button>
      </div>
      {loading ? (
        <FavoritesSkeleton />
      ) : err ? (
        <Alert type="error" showIcon message={err} />
      ) : list.length === 0 ? (
        <Empty description="还没有收藏" />
      ) : (
        <List
          dataSource={list}
          renderItem={(it) => (
            <List.Item
              actions={[
                <Button key="cancel" size="small" danger onClick={() => doCancel(it)} disabled={canceling}>
                  取消收藏
                </Button>,
              ]}
            >
              <div className="fav-item-wrap">
                <Checkbox
                  checked={checkedIds.includes(it.fav_id)}
                  onChange={(e) => onToggleCheck(it.fav_id, e.target.checked)}
                />
                <List.Item.Meta
                  title={
                    (() => {
                      const href = linkOf(it);
                      const label = nameOf(it);
                      return href === '#' ? <span>{label}</span> : <a href={href} target={it.m === 'website' ? '_blank' : undefined} rel={it.m === 'website' ? 'noreferrer' : undefined}>{label}</a>;
                    })()
                  }
                  description={
                    <Space size={8} wrap>
                      <Tag>{labelOf(it.m)}</Tag>
                      {it.feed_url ? <Tag color="green">有 feed</Tag> : null}
                      <span className="color-secondary-12">{dayjs(it.time * 1000).format('YYYY-MM-DD')}</span>
                    </Space>
                  }
                />
              </div>
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}
