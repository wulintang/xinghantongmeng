import { useEffect } from 'react';

import { useSite } from '@/context/SiteContext';

interface PageMeta {
    title?: string;
    keywords?: string;
    description?: string;
}

function setMetaTag(name: string, content?: string): void {
    if (!content) return;
    let el = document.querySelector(`meta[name="${name}"]`);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', name);
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
}

/**
 * 每个页面调用一次，负责把浏览器标题栏与 meta 同步成当前页面。
 * 标题后缀统一取后端 my_set 的站点名，不写死。
 */
export function usePageMeta(meta: PageMeta = {}): void {
    const { site } = useSite();
    const siteName = (site?.title || '').trim();
    const { title, keywords, description } = meta;

    useEffect(() => {
        const suffix = siteName ? ` - ${siteName}` : '';
        document.title = title ? `${title}${suffix}` : siteName || '兴汉同盟';
        setMetaTag('keywords', keywords || site?.keywords);
        setMetaTag('description', description || site?.description);
    }, [title, keywords, description, siteName, site?.keywords, site?.description]);
}
