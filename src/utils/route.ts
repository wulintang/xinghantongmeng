/**
 * 后端地址 -> 前端 SPA 路由映射。
 *
 * 后端 my_link.lianjie 存的是后端自己的伪静态地址（/、/category.html、/article.html、
 * /tool.html、/dan/about.html ...），前端是 SPA，路由完全不同。
 * 绝不能把后端地址直接塞进 <a href>，否则必然 404。这里统一做映射。
 */

export interface RouteTarget {
    /** 外链（http/https/mailto/tel），需要整页跳转 */
    external: boolean;
    /** 前端路由，external=false 时有效 */
    to?: string;
    /** 外链地址，external=true 时有效 */
    href?: string;
}

/** 后端路径首段 -> 前端路由前缀 */
const SEGMENT_MAP: Record<string, string> = {
    category: '/websites',
    website: '/websites',
    article: '/articles',
    tool: '/tools',
    blog: '/blogs',
    dan: '/dan',
};

/** 把后端下发的地址转换成前端可用的跳转目标 */
export function toRoute(url?: string | null): RouteTarget {
    const raw = (url || '').trim();
    if (!raw) return { external: false, to: '/home' };
    if (/^(https?:)?\/\//i.test(raw) || /^(mailto|tel):/i.test(raw)) {
        return { external: true, href: raw };
    }

    const qIndex = raw.indexOf('?');
    const query = qIndex >= 0 ? raw.slice(qIndex) : '';
    // 去掉后端伪静态后缀（.html / .htm）
    const path = (qIndex >= 0 ? raw.slice(0, qIndex) : raw).replace(/\.html?$/i, '');
    const segments = path.split('/').filter(Boolean);

    if (segments.length === 0) return { external: false, to: `/home${query}` };

    const base = SEGMENT_MAP[segments[0].toLowerCase()];
    if (!base) return { external: false, to: `/${segments.join('/')}${query}` };

    const rest = segments.slice(1);
    return { external: false, to: (rest.length > 0 ? `${base}/${rest.join('/')}` : base) + query };
}

/** 去掉后端伪静态后缀：about.html -> about、43.html -> 43 */
export function stripHtmlSuffix(input?: string | null): string {
    return (input || '').replace(/\.html?$/i, '').trim();
}

/** 单页别名归一化：about.html / about -> about */
export function normalizeAlias(input?: string | null): string {
    return stripHtmlSuffix(input);
}

/**
 * 后端返回的图片地址可能是相对路径（如 /favicon.ico、/app/toolbox/view/public/img/md5.png），
 * 前端部署在另一个域名下，必须补上后端根地址才能显示。
 */
export function assetUrl(path?: string | null): string {
    const v = (path || '').trim();
    if (!v) return '';
    if (/^https?:\/\//i.test(v)) return v;
    if (v.startsWith('//')) return `https:${v}`;
    const base = (process.env.BOYOUQUAN_API_ADDRESS || '').replace(/\/+$/, '');
    return `${base}${v.startsWith('/') ? '' : '/'}${v}`;
}

/** 后端工具页地址（工具箱自带页面，含工具自身的交互脚本，前端只做跳转） */
export function toolPageUrl(alias: string): string {
    const base = (process.env.BOYOUQUAN_API_ADDRESS || '').replace(/\/+$/, '');
    return `${base}/index.php/toolbox/_${encodeURIComponent(alias)}.html`;
}


/** 从网址数据里取域名（后端可能只给 www / domain / url 其中之一） */
export function domainOf(item: { www?: string; domain?: string; url?: string }): string {
    const direct = (item.www || item.domain || '').trim();
    if (direct) return direct.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
    const u = (item.url || '').trim();
    return u.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
}

/** 域名归一化：去协议、去路径、转小写，用于站点与 feed 博文的域名匹配 */
export function normalizeDomain(v?: string | null): string {
    return (v || '').replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim().toLowerCase();
}
