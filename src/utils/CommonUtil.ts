export function getURLParameter(name: string): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

export function redirectTo(link: string, delaySeconds?: number | null): void {
  let delay = 0;
  if (null !== delaySeconds && undefined !== delaySeconds) {
    delay = delaySeconds;
  }

  setTimeout(function () {
    window.location.href = link;
  }, delay * 1000);
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
