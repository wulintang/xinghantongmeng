import React, { useEffect, useState } from 'react';
import { Input } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface SearchBoxProps {
    placeholder?: string;
    /** 提交后跳转的前端路由，如 /websites、/feed */
    gotoPage: string;
    /** 搜索关键词写进 URL 的参数名，默认 keyword */
    paramName?: string;
}

/** 站内搜索：走 SPA 路由跳转，不做整页刷新 */
export default function SearchBox({
    placeholder = '搜索',
    gotoPage,
    paramName = 'keyword',
}: SearchBoxProps): React.JSX.Element {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const [value, setValue] = useState('');

    // 地址栏关键词变化时同步回输入框（含浏览器前进后退）
    useEffect(() => {
        setValue(params.get(paramName) || '');
    }, [params, paramName]);

    const submit = (raw?: string) => {
        const keyword = (raw ?? value).trim();
        const next = new URLSearchParams();
        if (keyword) next.set(paramName, keyword);
        const query = next.toString();
        navigate(`${gotoPage}${query ? `?${query}` : ''}`);
    };

    return (
        <Input.Search
            className="site-search"
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onSearch={submit}
            enterButton="搜索"
            allowClear
            size="large"
        />
    );
}
