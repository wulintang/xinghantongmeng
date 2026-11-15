import { createContext, useContext } from 'react';

/**
 * page-hero 在 layout 中的挂载容器（DOM 上与 head、container 三者平级）。
 * 由 MainLayout 创建，PageHeader 通过 portal 把 hero 渲染进来；
 * 各页面照旧调用 <PageHeader title={动态值}/>，标题描述保持每页动态。
 */
export const PageHeroSlotContext = createContext<HTMLElement | null>(null);

export function usePageHeroSlot(): HTMLElement | null {
    return useContext(PageHeroSlotContext);
}
