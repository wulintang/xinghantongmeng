import React, { useRef, useState } from 'react';
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

function rectStyle(r: { x: number; y: number; w: number; h: number }, cols: number, rows: number): React.CSSProperties {
  return {
    left: `${(r.x / cols) * 100}%`,
    top: `${(r.y / rows) * 100}%`,
    width: `${(r.w / cols) * 100}%`,
    height: `${(r.h / rows) * 100}%`,
  };
}

function normRect(a: Coord, b: Coord) {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  const w = Math.abs(a.x - b.x) + 1;
  const h = Math.abs(a.y - b.y) + 1;
  return { x, y, w, h };
}

function RectView({ r, cols, rows }: { r: AdPayGridRect; cols: number; rows: number }): React.ReactNode {
  return (
    <div className={`grid-rect${r.mine ? ' grid-rect-mine' : ''}`} style={rectStyle(r, cols, rows)}>
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
  const dragging = useRef(false);
  const [drag, setDrag] = useState<Coord | null>(null);
  const [cur, setCur] = useState<Coord | null>(null);

  if (!grid || grid.cols < 1 || grid.rows < 1) {
    return <div className="grid-canvas-empty">该页格子广告尚未配置，请到后台「格子广告配置」开启并设行列。</div>;
  }
  const { cols, rows, rects } = grid;

  const cells: Coord[] = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) cells.push({ x, y });

  const previewRect = drag && cur ? normRect(drag, cur) : null;

  const onDown = (c: Coord) => {
    if (!selectable) {
      onEmptyClick?.();
      return;
    }
    dragging.current = true;
    setDrag(c);
    setCur(c);
  };
  const onEnter = (c: Coord) => {
    if (!selectable || !dragging.current) return;
    setCur(c);
  };
  const onUp = () => {
    if (!selectable || !dragging.current) return;
    dragging.current = false;
    if (drag && cur) onSelectRect?.(normRect(drag, cur));
    setDrag(null);
    setCur(null);
  };

  return (
    <div
      className="grid-canvas"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}
      onMouseLeave={onUp}
    >
      {cells.map((c) => {
        const inPreview =
          previewRect && c.x >= previewRect.x && c.x < previewRect.x + previewRect.w && c.y >= previewRect.y && c.y < previewRect.y + previewRect.h;
        return (
          <div
            key={`${c.x}-${c.y}`}
            className={`grid-cell${inPreview ? ' grid-cell-preview' : ''}`}
            onMouseDown={() => onDown(c)}
            onMouseEnter={() => onEnter(c)}
            onMouseUp={onUp}
          />
        );
      })}
      {rects.map((r) => (
        <RectView key={`r-${r.id}`} r={r} cols={cols} rows={rows} />
      ))}
      {previewRect && <div className="grid-rect grid-rect-preview" style={rectStyle(previewRect, cols, rows)} />}
    </div>
  );
}
