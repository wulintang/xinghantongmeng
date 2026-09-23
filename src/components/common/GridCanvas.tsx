import React, { useRef, useState } from 'react';
import { Tooltip } from 'antd';
import type { AdPayGrid, AdPayGridRect } from '@/services/adpay';

interface Props {
  grid: AdPayGrid | null;
  /** 可选模式：拖拽框选矩形 */
  selectable?: boolean;
  /** 框选完成（归一化的矩形 x,y,w,h，均为 0 起索引） */
  onSelectRect?: (rect: { x: number; y: number; w: number; h: number }) => void;
  /** 只读模式点击画布空白区 */
  onEmptyClick?: () => void;
}

type Coord = { x: number; y: number };

const CELL_PX = 10;

function normRect(a: Coord, b: Coord) {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  const w = Math.abs(a.x - b.x) + 1;
  const h = Math.abs(a.y - b.y) + 1;
  return { x, y, w, h };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function RectView({ r, cols, rows }: { r: AdPayGridRect; cols: number; rows: number }): React.ReactNode {
  const style: React.CSSProperties = {
    left: `${(r.x / cols) * 100}%`,
    top: `${(r.y / rows) * 100}%`,
    width: `${(r.w / cols) * 100}%`,
    height: `${(r.h / rows) * 100}%`,
  };
  const title = r.title || '广告';
  return (
    <div
      className={`grid-rect${r.mine ? ' grid-rect-mine' : ''}`}
      style={style}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {r.img ? (
        r.link ? (
          <Tooltip title={title}>
            <a href={r.link} target="_blank" rel="noreferrer" className="grid-rect-link">
              <img src={r.img} alt={title} className="grid-rect-img" />
            </a>
          </Tooltip>
        ) : (
          <img src={r.img} alt={title} className="grid-rect-img" />
        )
      ) : (
        <span className="grid-rect-text">{title}</span>
      )}
    </div>
  );
}

export default function GridCanvas({ grid, selectable, onSelectRect, onEmptyClick }: Props): React.JSX.Element {
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [drag, setDrag] = useState<Coord | null>(null);
  const [cur, setCur] = useState<Coord | null>(null);

  const cols = grid?.cols || 0;
  const rows = grid?.rows || 0;
  const rects = grid?.rects || [];
  const pageCls = grid?.page === 'grid' ? 'grid-canvas-inner-grid' : 'grid-canvas-inner-home';

  if (!grid || grid.cols < 1 || grid.rows < 1) {
    return <div className="grid-canvas-empty">该页格子广告尚未配置，请到后台「格子广告配置」开启并设置单价。</div>;
  }

  const previewRect = drag && cur ? normRect(drag, cur) : null;

  function eventToCell(e: React.MouseEvent): Coord {
    const wrap = wrapRef.current;
    if (!wrap) return { x: 0, y: 0 };
    const rect = wrap.getBoundingClientRect();
    const inner = wrap.firstElementChild as HTMLElement | null;
    const cellW = inner ? inner.offsetWidth / cols : CELL_PX;
    const cellH = inner ? inner.offsetHeight / rows : CELL_PX;
    const x = Math.floor((e.clientX - rect.left + wrap.scrollLeft) / cellW);
    const y = Math.floor((e.clientY - rect.top) / cellH);
    return { x: clamp(x, 0, cols - 1), y: clamp(y, 0, rows - 1) };
  }

  const onDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (!selectable) {
      onEmptyClick?.();
      return;
    }
    e.preventDefault();
    const c = eventToCell(e);
    dragging.current = true;
    setDrag(c);
    setCur(c);
  };
  const onMove = (e: React.MouseEvent) => {
    if (!selectable || !dragging.current) return;
    setCur(eventToCell(e));
  };
  const onUp = (e?: React.MouseEvent) => {
    if (!selectable || !dragging.current) return;
    dragging.current = false;
    const c = e ? eventToCell(e) : cur;
    if (drag && c) {
      const r = normRect(drag, c);
      if (r.w > 0 && r.h > 0) onSelectRect?.(r);
    }
    setDrag(null);
    setCur(null);
  };

  return (
    <div
      ref={wrapRef}
      className="grid-canvas-wrap"
    >
      <div
        className={`grid-canvas-inner ${pageCls}`}
        style={{ '--grid-cols': cols, '--grid-rows': rows } as React.CSSProperties}
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={onUp}
      >
        {rects.map((r) => (
          <RectView key={`r-${r.id}`} r={r} cols={cols} rows={rows} />
        ))}
        {previewRect && (
          <div
            className="grid-rect grid-rect-preview"
            style={{
              left: `${(previewRect.x / cols) * 100}%`,
              top: `${(previewRect.y / rows) * 100}%`,
              width: `${(previewRect.w / cols) * 100}%`,
              height: `${(previewRect.h / rows) * 100}%`,
            }}
          >
            <span className="grid-rect-preview-label">
              {previewRect.w}×{previewRect.h}（{previewRect.w * previewRect.h}格）
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
