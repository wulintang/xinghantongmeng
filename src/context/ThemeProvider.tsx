import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { getRenderConfig, type RenderConfig } from '@/services/renderx';

type Mode = 'light' | 'dark';

interface ThemeContextValue {
    /** 当前模式 */
    mode: Mode;
    /** 是否深色（驱动 antd token） */
    dark: boolean;
    /** 点击切换（写 localStorage，手动优先于定时） */
    toggle: () => void;
    /** 站点渲染配置（可能为 null，未加载完） */
    config: RenderConfig | null;
}

const ThemeContext = createContext<ThemeContextValue>({
    mode: 'light',
    dark: false,
    toggle: () => {},
    config: null,
});

const LS_KEY = 'renderx_theme';

/** 当前分钟是否处在深色时间段（支持跨午夜，如 18:00–06:00） */
function inDarkSchedule(cfg: RenderConfig, now = new Date()): boolean {
    const [sh, sm] = cfg.dark_start.split(':').map(Number);
    const [eh, em] = cfg.dark_end.split(':').map(Number);
    const s = sh * 60 + sm;
    const e = eh * 60 + em;
    if (s === e) return false;
    const cur = now.getHours() * 60 + now.getMinutes();
    if (s < e) return cur >= s && cur < e; // 同一天
    return cur >= s || cur < e; // 跨午夜
}

/** 解析最终模式：localStorage 手动优先；否则按站点 default_mode（0 浅 / 1 深 / 2 定时） */
function resolveMode(cfg: RenderConfig | null): Mode {
    const saved = localStorage.getItem(LS_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    if (!cfg) return 'light';
    if (cfg.default_mode === 1) return 'dark';
    if (cfg.default_mode === 2) return inDarkSchedule(cfg) ? 'dark' : 'light';
    return 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
    const [config, setConfig] = useState<RenderConfig | null>(null);
    const [mode, setMode] = useState<Mode>(() => resolveMode(null));
    const timerRef = useRef<number | null>(null);

    const stopSchedule = () => {
        if (timerRef.current !== null) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const startSchedule = (cfg: RenderConfig) => {
        stopSchedule();
        timerRef.current = window.setInterval(() => {
            // 一旦用户手动切换（写了 localStorage），停止定时跟随
            if (localStorage.getItem(LS_KEY)) {
                stopSchedule();
                return;
            }
            setMode(inDarkSchedule(cfg) ? 'dark' : 'light');
        }, 60 * 1000);
    };

    useEffect(() => {
        let alive = true;
        getRenderConfig()
            .then((r: any) => {
                if (!alive || !r || r.code !== 1 || !r.data) return;
                setConfig(r.data);
                setMode(resolveMode(r.data));
                // 仅当未手动选择且站点设了跟随定时，才启动定时切换
                if (!localStorage.getItem(LS_KEY) && Number(r.data.default_mode) === 2) {
                    startSchedule(r.data);
                }
            })
            .catch(() => {});
        return () => {
            alive = false;
            stopSchedule();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 把最终模式写到 <html data-theme>，驱动 CSS 变量
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', mode);
    }, [mode]);

    const toggle = () => {
        const next: Mode = mode === 'dark' ? 'light' : 'dark';
        localStorage.setItem(LS_KEY, next);
        stopSchedule();
        setMode(next);
    };

    const value = useMemo<ThemeContextValue>(
        () => ({ mode, dark: mode === 'dark', toggle, config }),
        [mode, config]
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
    return useContext(ThemeContext);
}
