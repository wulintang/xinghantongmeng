import React from 'react';
import { Segmented } from 'antd';

import type { CateItem } from '@/services/userCenter';

interface CateFilterProps {
    cates: CateItem[];
    /** 当前选中的分类 id（字符串），空串表示全部 */
    value: string;
    onChange: (value: string) => void;
    allLabel?: string;
}

/** 分类筛选（数据来自后端 my_website_cate / my_article_cate / app_toolbox_cate） */
export default function CateFilter({
    cates,
    value,
    onChange,
    allLabel = '全部',
}: CateFilterProps): React.JSX.Element | null {
    if (!cates || cates.length === 0) return null;

    const options = [
        { label: allLabel, value: '' },
        ...cates.map((c) => ({ label: c.name, value: String(c.id) })),
    ];

    return (
        <Segmented
            className="cate-filter"
            options={options}
            value={value}
            onChange={(v) => onChange(String(v))}
        />
    );
}
