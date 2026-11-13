import React, { useMemo } from 'react';
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
 * 全站统一页面头部（hero）：
 * - 每次挂载随机渲染 /static/html/N.html（N∈1~39）作为全屏背景，左右浏览器边距 0；
 * - 标题 + 描述垂直居中，外套明显半透明区块，保证在任何（深/浅）背景上都清晰可辨；
 * - 底部一条统一样式横线，颜色跟随深浅模式（var(--c-border)）；
 * - 操作胶囊（extra）移出 hero，落到 hero 下方的统一操作条。
 */
const PageHeader: React.FC<PageHeaderProps> = ({ title, description, crumbs, extra, children, height = 240 }) => {
    const bgNum = useMemo(() => Math.floor(Math.random() * BG_COUNT) + 1, []);
    const bgSrc = `/static/html/${bgNum}.html`;

    return (
        <>
            <section className="page-hero" style={{ minHeight: height }}>
                <iframe className="page-hero-bg" src={bgSrc} title="random-background" loading="eager" />
                <div className="page-hero-scrim" />
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
