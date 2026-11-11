import React, { useEffect, useState } from 'react';
import { Input } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface SearchBoxProps {
    placeholder?: string;
    /** 提交后跳转的前端路由，如 /websites、/feed（与 onSearch 二选一） */
    gotoPage?: string;
    /** 搜索关键词写进 URL 的参数名，默认 keyword */
    paramName?: string;
    /** 原地筛选回调：传入时只回调并同步 URL 参数，不跳转页面（集市列表用） */
    onSearch?: (keyword: string) => void;
}

/** 站内搜索（全站统一形态）：site-search 样式、large、蓝色「搜索」按钮、关键词同步 URL */
export default function SearchBox({
    placeholder = '搜索',
    gotoPage,
    paramName = 'keyword',
    onSearch,
}: SearchBoxProps): React.JSX.Element {
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const [value, setValue] = useState(params.get(paramName) || '');

    // 地址栏关键词变化时同步回输入框（含浏览器前进后退）
    useEffect(() => {
        setValue(params.get(paramName) || '');
    }, [params, paramName]);

    const submit = (raw?: string) => {
        const keyword = (raw ?? value).trim();
        if (onSearch) {
            // 原地筛选：只更新地址栏参数，不跳转、不重置列表其它状态
            const next = new URLSearchParams(params);
            if (keyword) next.set(paramName, keyword);
            else next.delete(paramName);
            setParams(next, { replace: true });
            onSearch(keyword);
            return;
        }
        // 站内跳转式搜索：保持原有行为，只带关键词参数
        const next = new URLSearchParams();
        if (keyword) next.set(paramName, keyword);
        const query = next.toString();
        navigate(`${gotoPage || ''}${query ? `?${query}` : ''}`);
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
