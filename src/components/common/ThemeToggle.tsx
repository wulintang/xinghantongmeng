import React from 'react';

import { useTheme } from '@/context/ThemeProvider';

/** 深浅模式切换按钮：一个圆按钮，太阳（浅）/ 月亮（深），点击即翻转。默认态来自后台定时，手动写 localStorage 优先。 */
export default function ThemeToggle(): React.JSX.Element {
    const { mode, toggle } = useTheme();
    const isDark = mode === 'dark';
    return (
        <button
            type="button"
            onClick={toggle}
            aria-label={isDark ? '切换到浅色' : '切换到深色'}
            title={isDark ? '浅色' : '深色'}
            style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                border: '1px solid var(--c-border)',
                background: 'transparent',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--c-text)',
                padding: 0,
                flex: '0 0 auto',
            }}
        >
            {isDark ? (
                // 太阳
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                </svg>
            ) : (
                // 月亮
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
            )}
        </button>
    );
}
