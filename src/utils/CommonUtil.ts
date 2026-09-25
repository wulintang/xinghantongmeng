/**
 * 把后端存的 Markdown 风格说明（工具介绍等）转成纯文本摘要。
 * 仅用于列表页摘要展示，不做完整 Markdown 渲染。
 */
export function plainText(md?: string | null): string {
  return (md || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s*/gm, '')
    .replace(/[*`_~>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 把 feed 摘要里混着 HTML 标签的内容压成纯文本：
 * 去掉 <img> 等全部标签（图片 URL 不再长占位）、解码常见实体、折叠空白。
 * 仅用于列表页摘要展示。
 */
export function htmlToText(html: string | null | undefined, maxLen = 160): string {
  if (!html) return '';
  let s = html;
  s = s.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '');
  s = s.replace(/<img[^>]*>/gi, '');
  s = s.replace(/<br\s*\/?>/gi, ' ');
  s = s.replace(/<[^>]+>/g, '');
  s = s
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/g, "'");
  s = s.replace(/\s+/g, ' ').trim();
  if (maxLen > 0 && s.length > maxLen) s = `${s.slice(0, maxLen)}…`;
  return s;
}

/**
 * 清洗后端配置里自带的 HTML（如公安备案那段），只保留安全的结构与图片、链接。
 * 剥掉 script/style/iframe/object/embed/form 整段，以及 on* 事件属性与 javascript: 协议，
 * 保证任何后端配置都无法在页面里注入可执行脚本。
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';

  return html
    // 危险容器整体移除（含内容）
    .replace(/<\s*(script|style|iframe|object|embed|form|link|meta)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|style|iframe|object|embed|form|link|meta)[^>]*\/?\s*>/gi, '')
    // on* 事件属性
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    // javascript:/vbscript:/data: 协议（带引号）
    .replace(/(href|src)\s*=\s*("|')\s*(javascript|vbscript|data):[^"']*\2/gi, '$1=$2#$2')
    // javascript:/vbscript:/data: 协议（无引号写法）
    .replace(/(href|src)\s*=\s*(javascript|vbscript|data):[^\s>]*/gi, '$1="#"')
    // 删除注释
    .replace(/<!--[\s\S]*?-->/g, '');
}

export function setFavicon(href?: string | null): void {
  if (!href) return;
  let el = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.rel = 'icon';
    el.type = 'image/x-icon';
    document.head.appendChild(el);
  }
  el.href = href;
}

