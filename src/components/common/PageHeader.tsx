import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Typography } from 'antd';

import { usePageHeroSlot } from '@/context/PageHeroContext';

const { Title, Paragraph } = Typography;

export interface Crumb {
    label: string;
    to?: string;
}

interface PageHeaderProps {
    title: string;
    description?: string;
    /** 面包屑已全站移除，保留类型以兼容旧调用 */
    crumbs?: Crumb[];
    /** 内页功能按钮：就地渲染在本页 DOM 流里（.site-content 内），不进 hero */
    extra?: React.ReactNode;
    /** hero 内额外内容（如首页搜索框 / 分类标签），渲染在标题描述下方、文字区块内 */
    children?: React.ReactNode;
}

const BG_COUNT = 39;
/** 主推背景：39.html 命中权重 20%；其余 1~38 平分剩余 80%（约每 5 次刷到 1 次） */
const FEATURED_BG = 39;
const FEATURED_WEIGHT = 0.2;
function pickBgNum(): number {
    if (Math.random() < FEATURED_WEIGHT) return FEATURED_BG;
    return Math.floor(Math.random() * (BG_COUNT - 1)) + 1; // 1~38，排除 39
}

/**
 * 静态资源基准：背景动画 html 由「后端」(api.hao.dao.js.cn) 的 public/static/html 提供，
 * 前端 (hao.dao.js.cn) 与后端是不同域名，因此必须走后端域名；可用 .env 的
 * VITE_STATIC_BASE 覆盖（例如本地开发想用同域 public 副本时设为 ''）。
 */
const STATIC_BASE: string =
    ((import.meta as any).env?.VITE_STATIC_BASE as string | undefined) ?? 'https://api.hao.dao.js.cn';

/**
 * 全站统一页面头部（hero）：
 * - 各页照旧传动态 title/description，但 DOM 通过 portal 渲染到 layout 的 hero 插槽，
 *   与 head、container 三者平级，紧贴导航下方，不再靠 100vw 负 margin 破出；
 * - 每次挂载随机渲染 /public/static/html/N.html（N∈1~39）作为全屏背景，左右边距 0；
 * - 标题 + 描述垂直居中，文字用「白填充 + 深色描边 + 阴影」保证在任意深/浅背景上均可辨；
 * - extra 是「内页功能区块」，就地在页面正常 DOM 流里渲染（.site-content 内、
 *   hero 之下），它属于内页内容而非随机背景 hero；hero 本身不含任何操作条。
 */
const PageHeader: React.FC<PageHeaderProps> = ({ title, description, crumbs, extra, children }) => {
    const bgNum = useMemo(pickBgNum, []);
    const bgSrc = `${STATIC_BASE}/public/static/html/${bgNum}.html`;
    // 延后赋值 src，避免首屏与关键 JS 分片争抢连接（与「首屏卡死」解耦，纯防御性优化）
    const [src, setSrc] = useState('');
    const [failed, setFailed] = useState(false);
    const slot = usePageHeroSlot();

    useEffect(() => {
        const t = window.setTimeout(() => setSrc(bgSrc), 0);
        return () => window.clearTimeout(t);
    }, [bgSrc]);

    const hero = (
        <>
            <section className="page-hero">
                {!failed ? (
                    <iframe
                        className="page-hero-bg"
                        src={src}
                        title="random-background"
                        scrolling="no"
                        onError={() => setFailed(true)}
                    />
                ) : null}
                <div className="page-hero-content">
                    <Title level={2} className="page-hero-title">
                        {title}
                    </Title>
                    {description ? (
                        <Paragraph className="page-hero-desc">{description}</Paragraph>
                    ) : null}
                    {children ? <div className="page-hero-children">{children}</div> : null}
                </div>
            </section>
        </>
    );

    // hero portal 到 layout 插槽（与 head、container 平级）；extra 是内页功能区块，
    // 就地渲染在页面正常 DOM 流里（.site-content > .container 内），不进随机背景 hero。
    return (
        <>
            {slot ? createPortal(hero, slot) : null}
            {extra ? (
                <div className="page-actions">
                    <div className="page-actions-inner">{extra}</div>
                </div>
            ) : null}
        </>
    );
};

export default PageHeader;
