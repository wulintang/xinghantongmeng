import React, { useEffect, useRef } from 'react';
import { message } from 'antd';
import { assetUrl } from '@/utils/route';
import { apiBase } from '@/utils/request';

interface ToolRendererProps {
  config: string;
  ai: number;
  toolId: number;
  token?: string;
}

const EMBED_STYLE_ID = 'toolbox-embed-style';

// toolbox 主题变量（后端 style.html 注入的 wulintang 变量），内嵌时需手动补，否则样式全崩
const TOOLBOX_VARS = `
.toolbox-embed{
  --radius:8px;
  --border-w:1px;
  --c-page:#f5f7fa;
  --c-card:#ffffff;
  --c-text:#333333;
  --c-subtext:#888888;
  --c-border:#e5e7eb;
  --c-fg-invert:#1677ff;
  --c-link:#1677ff;
  --c-primary:#1677ff;
}
/* 后端 toolbox CSS 把按钮文字与背景都设成同一个变量，会白底白字看不见，强制可读 */
.toolbox-embed button,
.toolbox-embed .btn-primary,
.toolbox-embed .btn-danger{
  color:#fff !important;
}
`;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = false;
    s.onload = () => resolve();
    s.onerror = () => { console.error('工具依赖加载失败:', src); resolve(); };
    document.head.appendChild(s);
  });
}

// 把 config 里指向后端根目录的资源路径，重写为后端绝对地址
function rewritePaths(html: string, base: string): string {
  return (html || '')
    .replaceAll('/app/toolbox/', `${base}/app/toolbox/`)
    .replaceAll('/public/static/', `${base}/public/static/`)
    .replaceAll('/public/', `${base}/public/`);
}

const ToolRenderer: React.FC<ToolRendererProps> = ({ config, ai, toolId, token }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    let alive = true;

    // 注入 toolbox 样式表 + 变量（全站仅注入一次）
    if (!document.getElementById(EMBED_STYLE_ID)) {
      const link = document.createElement('link');
      link.id = EMBED_STYLE_ID;
      link.rel = 'stylesheet';
      link.href = assetUrl('/app/toolbox/view/public/css/style.css');
      document.head.appendChild(link);

      const css = document.createElement('style');
      css.id = `${EMBED_STYLE_ID}-vars`;
      css.textContent = TOOLBOX_VARS;
      document.head.appendChild(css);
    }

    const base = apiBase();
    (window as any).__TOOLBOX_API = base;
    (window as any).__TOOLBOX_TOKEN = token || '';
    (window as any).layer = { msg: (m: string) => message.success(m) };

    const boot = async () => {
      if (!alive || !container) return;
      try {
        if (ai === 1) {
          const hl = document.createElement('link');
          hl.rel = 'stylesheet';
          hl.href = assetUrl('/public/static/css/default.min.css');
          document.head.appendChild(hl);
          await loadScript(assetUrl('/public/static/js/marked.min.js'));
          await loadScript(assetUrl('/public/static/js/highlight.min.js'));
          await loadScript(assetUrl('/app/toolbox/view/public/js/chat.js'));
        }

        const libRe = /<script\s+src=["'](\/app\/toolbox\/view\/public\/js\/[^"']+)["']/g;
        let libMatch: RegExpExecArray | null;
        while ((libMatch = libRe.exec(config || '')) !== null) {
          await loadScript(assetUrl(libMatch[1]));
        }

        let html = rewritePaths(config || '', base);
        if (ai === 1) {
          // 后端 aiTool.html 模板提供 #toolId 隐藏域，内嵌时自行补上，否则 sendMessage 取不到 id
          html = `<input type="hidden" id="toolId" value="${toolId}">` + html;
        }
        container.innerHTML = html;

        const ext = Array.from(container.querySelectorAll('script[src]')) as HTMLScriptElement[];
        for (const s of ext) {
          const src = s.getAttribute('src') || '';
          if (src && !/\/app\/toolbox\/view\/public\/js\//.test(src)) await loadScript(src);
        }
        // 执行 config 内联脚本（innerHTML 注入的 script 不会自动执行，需重建）
        const inlines = Array.from(container.querySelectorAll('script')) as HTMLScriptElement[];
        inlines.forEach((old) => {
          const neo = document.createElement('script');
          neo.textContent = old.textContent || '';
          container.appendChild(neo);
          old.remove();
        });
      } catch (e) {
        // 工具脚本异常不影响页面其余部分
      }
    };

    boot();

    return () => {
      alive = false;
      if (container) container.innerHTML = '';
    };
  }, [config, ai, toolId, token]);

  return <div className="toolbox-embed toolbox" ref={ref} />;
};

export default ToolRenderer;
