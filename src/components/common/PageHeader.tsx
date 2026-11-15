import React, { useEffect, useMemo, useState } from 'react';
import { Typography } from 'antd';

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
    /** 操作胶囊（按钮等）：自动移入 hero 下方的统一操作条，不再压在标题上 */
    extra?: React.ReactNode;
    /** hero 内额外内容（如首页搜索框 / 分类标签），渲染在标题描述下方、文字区块内 */
    children?: React.ReactNode;
    /** 随机背景高度（默认 240px） */
    height?: number;
}

const BG_COUNT = 39;

/**
 * 静态资源基准：背景动画 html 由「后端」(api.hao.dao.js.cn) 的 public/static/html 提供，
 * 前端 (hao.dao.js.cn) 与后端是不同域名，因此必须走后端域名；可用 .env 的
 * VITE_STATIC_BASE 覆盖（例如本地开发想用同域 public 副本时设为 ''）。
 */
const STATIC_BASE: string =
    ((import.meta as any).env?.VITE_STATIC_BASE as string | undefined) ?? 'https://api.hao.dao.js.cn';

/**
 * 全站统一页面头部（hero）：
 * - 每次挂载随机渲染 /static/html/N.html（N∈1~39）作为全屏背景，左右浏览器边距 0；
 * - 标题 + 描述垂直居中，文字用「白填充 + 深色描边 + 阴影」保证在任意深/浅背景上均可辨，无任何灰色笼罩/面板；
 * - 底部一条统一样式横线，颜色跟随深浅模式（var(--c-border)）；
 * - 操作胶囊（extra）移出 hero，落到 hero 下方的统一操作条。
 */
const PageHeader: React.FC<PageHeaderProps> = ({ title, description, crumbs, extra, children, height = 240 }) => {
    const bgNum = useMemo(() => Math.floor(Math.random() * BG_COUNT) + 1, []);
    const bgSrc = `${STATIC_BASE}/static/html/${bgNum}.html`;
    // 延后赋值 src，避免首屏与关键 JS 分片争抢连接（与「首屏卡死」解耦，纯防御性优化）
    const [src, setSrc] = useState('');
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        const t = window.setTimeout(() => setSrc(bgSrc), 0);
        return () => window.clearTimeout(t);
    }, [bgSrc]);

    return (
        <>
            <section className="page-hero" style={{ minHeight: height }}>
                {!failed ? (
                    <iframe
                        className="page-hero-bg"
                        src={src}
                        title="random-background"
                        onError={() => setFailed(true)}
                    />
                ) : null}
                <div className="page-hero-content">
                    <div className="page-hero-panel">
                        <Title level={2} className="page-hero-title">
                            {title}
                        </Title>
                        {description ? (
                            <Paragraph className="page-hero-desc">{description}</Paragraph>
                        ) : null}
                        {children ? <div className="page-hero-children">{children}</div> : null}
                    </div>
                </div>
                <div className="page-hero-line" />
            </section>
            {extra ? (
                <div className="page-hero-actions">
                    <div className="page-hero-actions-inner">{extra}</div>
                </div>
            ) : null}
        </>
    );
};

export default PageHeader;
