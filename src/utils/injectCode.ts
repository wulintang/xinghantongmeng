/**
 * 全站自定义代码注入：renderx 的 head_code / foot_code（以及 openapi 旧 head_code）共用。
 *
 * 关键：DOMParser / innerHTML 解析出来的 <script> 会被标记为「已启动」，
 * 直接 importNode 到当前文档后浏览器不会执行 —— 这正是统计代码「贴哪儿都不统计」的根因。
 * 因此所有 script 一律用 document.createElement('script') 重建、复制全部属性后再挂载。
 *
 * 一个框里可混合粘贴 <script> / <style> / <meta> / <link> / 任意 HTML；
 * 不写标签时，纯 JS 自动包 <script>、纯 CSS 自动包 <style>。
 */
export type InjectTarget = 'head' | 'foot';

/** 把代码片段解析成节点列表（只用于解析，绝不直接把这些 script 挂到真实文档） */
function parseFragment(code: string): ChildNode[] {
    const doc = new DOMParser().parseFromString(
        `<!DOCTYPE html><html><head></head><body>${code}</body></html>`,
        'text/html'
    );
    return Array.from(doc.body.childNodes);
}

/** head → document.head；foot → 页脚前（无页脚则 body 末尾） */
function appendNode(where: InjectTarget, node: Node): void {
    if (where === 'head') {
        document.head.appendChild(node);
        return;
    }
    const footer = document.querySelector('footer') || document.querySelector('.site-footer');
    if (footer && footer.parentNode) {
        footer.parentNode.insertBefore(node, footer);
    } else {
        document.body.appendChild(node);
    }
}

/** 挂载单个节点：script 一律重建（挂载即执行，defer/async/data-* 原样保留），其余元素原样导入 */
function mount(node: ChildNode, where: InjectTarget): void {
    if (node.nodeType === Node.TEXT_NODE) {
        const text = (node.textContent || '').trim();
        if (!text) return;
        // 框里同时贴了 <script> 和「不带 <style> 标签的纯 CSS」时，纯 CSS 也要生效
        if (looksLikeCss(text)) {
            const style = document.createElement('style');
            style.textContent = text;
            appendNode(where, style);
            return;
        }
        appendNode(where, document.createTextNode(node.textContent || ''));
        return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as Element;
    if (el.tagName.toLowerCase() === 'script') {
        const script = document.createElement('script');
        const attrs = el.attributes;
        for (let i = 0; i < attrs.length; i++) {
            const attr = attrs.item(i);
            if (attr) script.setAttribute(attr.name, attr.value);
        }
        script.textContent = el.textContent || '';
        appendNode(where, script);
        return;
    }
    appendNode(where, document.importNode(node, true));
}

/** 每个框用独立 marker 去重，React 严格模式下重复挂载也不会重复注入 */
function ensureMarker(id: string, where: InjectTarget): boolean {
    if (document.getElementById(id)) return false;
    const el = where === 'head' ? document.createElement('meta') : document.createElement('span');
    el.id = id;
    if (where === 'foot') (el as HTMLElement).style.display = 'none';
    appendNode(where, el);
    return true;
}

/** 不写标签的纯代码：区分 CSS 规则与 JS 语句 */
function looksLikeCss(code: string): boolean {
    return /[.#\[:\w-]+\s*\{[^{}]*:[^{}]*\}/.test(code)
        && !/\b(function|var|let|const|return|if|for|window|document|console|new|=>)\b/.test(code);
}

/**
 * 注入一个框里的全部自定义代码。
 * @param where head 或 foot
 * @param id    去重标记 id（每个来源一个）
 */
export function injectCode(code: string, where: InjectTarget, id: string): void {
    const raw = (code || '').trim();
    if (!raw || !ensureMarker(id, where)) return;

    if (raw.indexOf('<') === -1) {
        const el = document.createElement(looksLikeCss(raw) ? 'style' : 'script');
        el.textContent = raw;
        appendNode(where, el);
        return;
    }

    parseFragment(raw).forEach((n) => mount(n, where));
}
