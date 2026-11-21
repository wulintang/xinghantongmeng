import { useEffect, useRef, useState } from 'react';

/**
 * 让 loading 态至少保持 ms 毫秒（默认 800），避免接口返回太快时骨架屏一闪而过、看不到效果。
 * - 数据早回来：骨架仍展示满 ms
 * - 数据慢回来：按实际请求时间展示（不额外拖延）
 * - 连续触发 loading：从第一次 true 开始计时
 */
export function useMinLoading(loading: boolean, ms = 800): boolean {
    const [display, setDisplay] = useState(loading);
    const startRef = useRef<number | null>(null);

    useEffect(() => {
        if (loading) {
            if (startRef.current === null) startRef.current = Date.now();
            setDisplay(true);
            return;
        }
        // loading 结束：从未开始过则直接隐藏
        if (startRef.current === null) {
            setDisplay(false);
            return;
        }
        const elapsed = Date.now() - startRef.current;
        const remain = Math.max(0, ms - elapsed);
        if (remain === 0) {
            setDisplay(false);
            startRef.current = null;
            return;
        }
        const t = window.setTimeout(() => {
            setDisplay(false);
            startRef.current = null;
        }, remain);
        return () => window.clearTimeout(t);
    }, [loading, ms]);

    return display;
}

export default useMinLoading;
