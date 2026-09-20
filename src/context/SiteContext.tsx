import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import {
    getInit,
    EMPTY_LINK_GROUPS,
    type CateItem,
    type LinkGroups,
    type LinkItem,
    type SiteConfig,
} from '@/services/userCenter';

interface SiteContextValue {
    /** 站点配置（my_set alias=set） */
    site: SiteConfig | null;
    /** 导航与友链（my_link） */
    links: LinkGroups;
    /** 网址分类（my_website_cate） */
    cates: CateItem[];
    topLinks: LinkItem[];
    footLinks: LinkItem[];
    friendLinks: LinkItem[];
    loading: boolean;
}

const SiteContext = createContext<SiteContextValue>({
    site: null,
    links: EMPTY_LINK_GROUPS,
    cates: [],
    topLinks: [],
    footLinks: [],
    friendLinks: [],
    loading: true,
});

/**
 * 全站只请求一次 /init，Header、Footer、首页共用同一份数据，
 * 避免每个组件各自发一遍请求导致首屏空白与重复流量。
 */
export function SiteProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
    const [site, setSite] = useState<SiteConfig | null>(null);
    const [links, setLinks] = useState<LinkGroups>(EMPTY_LINK_GROUPS);
    const [cates, setCates] = useState<CateItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let alive = true;
        getInit()
            .then((r) => {
                if (!alive || !r || r.code !== 1 || !r.data) return;
                setSite(r.data.site || null);
                setLinks(r.data.links || EMPTY_LINK_GROUPS);
                setCates(Array.isArray(r.data.cates) ? r.data.cates : []);
            })
            .catch(() => {})
            .finally(() => {
                if (alive) setLoading(false);
            });
        return () => {
            alive = false;
        };
    }, []);

    const value = useMemo<SiteContextValue>(
        () => ({
            site,
            links,
            cates,
            topLinks: links.top || [],
            footLinks: links.foot || [],
            friendLinks: links.friend || [],
            loading,
        }),
        [site, links, cates, loading]
    );

    return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite(): SiteContextValue {
    return useContext(SiteContext);
}
