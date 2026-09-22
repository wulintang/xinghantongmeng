import React from 'react';
import { sanitizeHtml } from '@/utils/CommonUtil';
import type { AdPayGrid, AdPayGridCell } from '@/services/adpay';

interface Props {
  grid: AdPayGrid | null;
  /** 可选模式：点击空格切换选中（用于申请页） */
  selectable?: boolean;
  /** 已选中的格子 id（可选模式） */
  selected?: number[];
  /** 切换选中 */
  onToggle?: (id: number) => void;
  /** 只读模式下点击空格（跳转申请） */
  onEmptyClick?: (cell: AdPayGridCell) => void;
}

function CellInner({ cell }: { cell: AdPayGridCell }): React.ReactNode {
  if (cell.img) {
    const inner = <img src={cell.img} alt={cell.link} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />;
    return cell.link ? (
      <a href={cell.link} target="_blank" rel="noreferrer" style={{ display: 'block', width: '100%', height: '100%' }}>
        {inner}
      </a>
    ) : (
      inner
    );
  }
  if (cell.content) {
    return <div className="grid-cell-html" dangerouslySetInnerHTML={{ __html: sanitizeHtml(cell.content) }} />;
  }
  return <span className="grid-cell-link">{cell.link || '广告'}</span>;
}

export default function GridCanvas({ grid, selectable, selected = [], onToggle, onEmptyClick }: Props): React.JSX.Element {
  if (!grid || grid.cols < 1 || grid.rows < 1) {
    return <div className="grid-canvas-empty">该页格子广告尚未配置，请到后台「格子广告位管理」生成。</div>;
  }
  return (
    <div
      className="grid-canvas"
      style={{
        gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
        gridTemplateRows: `repeat(${grid.rows}, minmax(48px, auto))`,
      }}
    >
      {grid.cells.map((c) => {
        const isEmpty = c.active !== 1;
        const isSelected = selectable && selected.includes(c.id);
        const cls = [
          'grid-cell',
          isEmpty ? 'grid-cell-empty' : 'grid-cell-filled',
          c.mine ? 'grid-cell-mine' : '',
          isSelected ? 'grid-cell-selected' : '',
          c.status === 2 ? 'grid-cell-reserved' : '',
        ]
          .filter(Boolean)
          .join(' ');
        const style: React.CSSProperties = {
          gridColumn: `${c.x + 1} / span ${c.w}`,
          gridRow: `${c.y + 1} / span ${c.h}`,
        };
        const handle = () => {
          if (selectable && isEmpty) onToggle?.(c.id);
          else if (!selectable && isEmpty) onEmptyClick?.(c);
        };
        return (
          <div
            key={c.id}
            className={cls}
            style={style}
            onClick={isEmpty ? handle : undefined}
            title={selectable && isEmpty ? '点击选择/取消该格子' : undefined}
          >
            {isEmpty ? (
              <span className="grid-cell-tip">{selectable ? (isSelected ? '已选' : '空闲') : '广告位招租'}</span>
            ) : (
              <CellInner cell={c} />
            )}
          </div>
        );
      })}
    </div>
  );
}
