import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sanitizeHtml } from '@/utils/CommonUtil';
import { getAd, getGrid, type AdPayAd, type AdPayGrid } from '@/services/adpay';
import GridCanvas from './GridCanvas';

interface Props {
  label?: string;
  variant?: 'banner' | 'grid';
  /** 系统广告位标识（与后端 position.pkey 一致）；传入则拉取并渲染该位广告 */
  slot?: string;
  /** 格子广告页：home=首页底部 / grid=单页；传入则渲染格子画布 */
  page?: 'home' | 'grid';
}

/**
 * 广告位组件（广告增强插件 adpay 对接）
 * - 传 slot：拉取该位广告，登录用户优先展示自己的，否则随机；无广告时显示骨架 + 申请入口
 * - 传 page（格子）：渲染该页格子画布，空格可点击跳转申请
 * - 都不传：纯静态骨架（兼容历史用法）
 */
export default function AdSlotSkeleton({ label = '广告位', variant = 'banner', slot, page }: Props): React.JSX.Element {
  const navigate = useNavigate();
  const [ad, setAd] = useState<AdPayAd | null>(null);
  const [adReady, setAdReady] = useState(false);
  const [grid, setGrid] = useState<AdPayGrid | null>(null);

  useEffect(() => {
    if (!slot) return;
    let alive = true;
    setAdReady(false);
    getAd(slot)
      .then((r) => {
        if (alive && r.code === 1) setAd(r.data || null);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setAdReady(true);
      });
    return () => {
      alive = false;
    };
  }, [slot]);

  useEffect(() => {
    if (variant !== 'grid' || !page) return;
    let alive = true;
    getGrid(page)
      .then((r) => {
        if (alive && r.code === 1) setGrid(r.data || null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [variant, page]);

  // 格子模式
  if (variant === 'grid' && page) {
    return (
      <div className="ad-slot-skeleton ad-slot-skeleton-grid" style={{ margin: 'var(--page-gap) 0' }}>
        <GridCanvas grid={grid} onEmptyClick={() => navigate(`/grid?page=${page}`)} />
      </div>
    );
  }

  // 系统广告位：已拉到广告则渲染，否则骨架 + 申请入口
  if (slot) {
    if (adReady && ad) {
      return (
        <div className="ad-slot-filled" style={{ margin: 'var(--page-gap) 0' }}>
          <div className="ad-banner" dangerouslySetInnerHTML={{ __html: sanitizeHtml(ad.content) }} />
        </div>
      );
    }
    if (adReady && !ad) {
      return (
        <div
          className="ad-slot-skeleton ad-slot-skeleton-banner ad-slot-apply"
          style={{ margin: 'var(--page-gap) 0' }}
          onClick={() => navigate(`/user/ad/buy?slot=${slot}`)}
          role="button"
        >
          <span className="ad-slot-skeleton-label">{label}</span>
          <span className="ad-slot-apply-tip">点击申请投放广告</span>
        </div>
      );
    }
    // 加载中
    return (
      <div className="ad-slot-skeleton ad-slot-skeleton-banner" style={{ margin: 'var(--page-gap) 0' }}>
        <span className="ad-slot-skeleton-label">{label}</span>
      </div>
    );
  }

  // 纯静态骨架（无 slot）
  return (
    <div className={`ad-slot-skeleton ad-slot-skeleton-${variant}`} style={{ margin: 'var(--page-gap) 0' }}>
      <span className="ad-slot-skeleton-label">{label}</span>
    </div>
  );
}
