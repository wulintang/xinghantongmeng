import React from 'react';
import { Flex } from 'antd';

import type { CateItem } from '@/services/userCenter';

interface CateFilterProps {
    cates: CateItem[];
    value: string;
    onChange: (value: string) => void;
    allLabel?: string;
}

/**
 * 分类筛选：可换行胶囊（替代会横向滚动的 Segmented）。
 * 移动端自然折行，不再出现横向滚动条；样式 token 化，随深浅模式翻色（见 .cate-chip）。
 */
export default function CateFilter({
    cates,
    value,
    onChange,
    allLabel = '全部',
}: CateFilterProps): React.JSX.Element | null {
    if (!cates || cates.length === 0) return null;

    const items = [
        { label: allLabel, value: '' },
        ...cates.map((c) => ({ label: c.name, value: String(c.id) })),
    ];

    return (
        <Flex wrap gap={8} className="cate-filter-wrap">
            {items.map((it) => (
                <button
                    key={it.value}
                    type="button"
                    className={`cate-chip${value === it.value ? ' cate-chip--active' : ''}`}
                    onClick={() => onChange(it.value)}
                >
                    {it.label}
                </button>
            ))}
        </Flex>
    );
}
