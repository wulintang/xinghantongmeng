import React from 'react';
import { useState } from 'react';
import { Input } from 'antd';
import { getURLParameter, redirectTo } from '../../utils/CommonUtil';

interface SearchBoxProps {
    placeholder: string;
    gotoPage: string;
    sortType?: string | null;
}

export default function SearchBox({ placeholder, gotoPage, sortType }: SearchBoxProps): React.JSX.Element {
    const keyword = getURLParameter('keyword');
    const [searchTerm, setSearchTerm] = useState(keyword ?? '');

    const doSearch = (value?: string) => {
        const trimmed = (value ?? searchTerm).trim();
        if (!trimmed) return;

        const goTo =
            sortType != null
                ? `${gotoPage}?sort=${sortType}&keyword=${encodeURIComponent(trimmed)}`
                : `${gotoPage}?keyword=${encodeURIComponent(trimmed)}`;

        redirectTo(goTo);
    };

    return (
        <Input.Search
            className="site-search"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onSearch={doSearch}
            enterButton="搜索"
            allowClear
        />
    );
}
