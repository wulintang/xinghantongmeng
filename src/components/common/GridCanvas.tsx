import React, { useEffect, useRef, useState } from 'react';
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

function RectView({ r }: { r: AdPayGridRect }): React.ReactNode {
  const style: React.CSSProperties = {
    left: r.x * CELL_PX,
    top: r.y * CELL_PX,
    width: r.w * CELL_PX,
    height: r.h * CELL_PX,
  };
  return (
    <div className={`grid-rect${r.mine ? ' grid-rect-mine' : ''}`} style={style}>
      {r.img ? (
        r.link ? (
          <a href={r.link} target="_blank" rel="noreferrer" className="grid-rect-link">
            <img src={r.img} alt="" className="grid-rect-img" />
          </a>
        ) : (
          <img src={r.img} alt="" className="grid-rect-img" />
        )
      ) : (
        <span className="grid-rect-text">{r.link || '广告'}</span>
      )}
    </div>
  );
}

export default function GridCanvas({ grid, selectable, onSelectRect, onEmptyClick }: Props): React.JSX.Element {
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const dragging = useRef(false);
  const [drag, setDrag] = useState<Coord | null>(null);
  const [cur, setCur] = useState<Coord | null>(null);

  const cols = grid?.cols || 0;
  const rows = grid?.rows || 0;
  const rects = grid?.rects || [];
  const innerWidth = cols * CELL_PX;
  const innerHeight = rows * CELL_PX;

  useEffect(() => {
    if (innerWidth < 1) return;
    function resize() {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const w = wrap.clientWidth;
      setScale(w / innerWidth);
    }
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [innerWidth]);

  if (!grid || grid.cols < 1 || grid.rows < 1) {
    return <div className="grid-canvas-empty">该页格子广告尚未配置，请到后台「格子广告配置」开启并设置单价。</div>;
  }

  const previewRect = drag && cur ? normRect(drag, cur) : null;

  function eventToCell(e: React.MouseEvent): Coord {
    const wrap = wrapRef.current;
    if (!wrap) return { x: 0, y: 0 };
    const rect = wrap.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / scale / CELL_PX);
    const y = Math.floor((e.clientY - rect.top) / scale / CELL_PX);
    return { x: clamp(x, 0, cols - 1), y: clamp(y, 0, rows - 1) };
  }

  const onDown = (e: React.MouseEvent) => {
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
      style={{ width: '100%', maxWidth: innerWidth, height: innerHeight * scale }}
    >
      <div
        ref={innerRef}
        className="grid-canvas-inner"
        style={{
          width: innerWidth,
          height: innerHeight,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          backgroundSize: `${CELL_PX}px ${CELL_PX}px`,
        }}
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseLeave={() => onUp()}
      >
        {rects.map((r) => (
          <RectView key={`r-${r.id}`} r={r} />
        ))}
        {previewRect && (
          <div
            className="grid-rect grid-rect-preview"
            style={{
              left: previewRect.x * CELL_PX,
              top: previewRect.y * CELL_PX,
              width: previewRect.w * CELL_PX,
              height: previewRect.h * CELL_PX,
            }}
          />
        )}
      </div>
    </div>
  );
}
