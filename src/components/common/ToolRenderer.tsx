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
    .replaceAll('/app/toolbox/view/public/', '___TB_PUB___/')
    .replaceAll('/public/', `${base}/public/`)
    .replaceAll('___TB_PUB___/', `${base}/app/toolbox/view/public/`);
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
    if (!(window as any).layer || typeof (window as any).layer.open !== 'function') {
      const mods: any[] = [];
      const layerClose = (idx: number) => {
        const el = mods[idx];
        if (el && el.parentNode) el.parentNode.removeChild(el);
        mods[idx] = null;
      };
      (window as any).layer = {
        msg: (m: string) => message.success(m),
        close: layerClose,
        open: (opt: any) => {
          const idx = mods.length + 1;
          const overlay = document.createElement('div');
          overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;';
          const box = document.createElement('div');
          const aw = Array.isArray(opt.area) ? opt.area[0] : '320px';
          const ah = Array.isArray(opt.area) ? opt.area[1] : '';
          box.style.cssText = `background:#fff;border-radius:8px;max-width:92vw;max-height:92vh;overflow:auto;width:${aw};${ah ? 'height:' + ah + ';' : ''}`;
          const title = document.createElement('div');
          title.style.cssText = 'padding:12px 16px;font-weight:600;border-bottom:1px solid #eee;';
          title.textContent = opt.title || '';
          const content = document.createElement('div');
          content.style.cssText = 'padding:16px;';
          content.innerHTML = opt.content || '';
          const foot = document.createElement('div');
          foot.style.cssText = 'padding:8px 16px;text-align:right;border-top:1px solid #eee;';
          const btns = Array.isArray(opt.btn) ? opt.btn : [];
          const jq = (window as any).jQuery;
          btns.forEach((label: string, i: number) => {
            const b = document.createElement('button');
            b.textContent = label;
            b.style.cssText = 'margin-left:8px;padding:4px 14px;cursor:pointer;border:1px solid #1677ff;background:#1677ff;color:#fff;border-radius:4px;';
            b.onclick = () => {
              if (i === 0 && typeof opt.yes === 'function') opt.yes(idx, jq ? jq(box) : box);
              else if (i > 0 && typeof opt.cancel === 'function') opt.cancel(idx, jq ? jq(box) : box);
              layerClose(idx);
            };
            foot.appendChild(b);
          });
          box.appendChild(title);
          box.appendChild(content);
          box.appendChild(foot);
          overlay.appendChild(box);
          overlay.onclick = (e: any) => {
            if (e.target === overlay) {
              if (typeof opt.cancel === 'function') opt.cancel(idx, jq ? jq(box) : box);
              layerClose(idx);
            }
          };
          document.body.appendChild(overlay);
          mods[idx] = overlay;
          if (typeof opt.success === 'function') opt.success(jq ? jq(box) : box, idx);
          return idx;
        },
      };
    }

    const boot = async () => {
      if (!alive || !container) return;
      try {
        const NativeWorker = (window as any).Worker;
        if (NativeWorker) {
          (window as any).Worker = function (url: any, opts?: any) {
            const u = String(url || '');
            if (u.includes('worker-') || u.includes('/app/toolbox/')) {
              const noop = () => {};
              return {
                postMessage: noop,
                terminate: noop,
                addEventListener: noop,
                removeEventListener: noop,
                onmessage: null as any,
                onerror: null as any,
              };
            }
            return new NativeWorker(url, opts);
          };
        }

        if (ai === 1) {
          const hl = document.createElement('link');
          hl.rel = 'stylesheet';
          hl.href = assetUrl('/public/static/css/default.min.css');
          document.head.appendChild(hl);
          await loadScript(assetUrl('/public/static/js/marked.min.js'));
          await loadScript(assetUrl('/public/static/js/highlight.min.js'));
          await loadScript(assetUrl('/app/toolbox/view/public/js/chat.js'));
        }

        if (!(window as any).jQuery) {
          await loadScript(assetUrl('/app/toolbox/view/public/javascript/jquery.min.js'));
        }

        let html = rewritePaths(config || '', base);
        if (ai === 1) {
          html = `<input type="hidden" id="toolId" value="${toolId}">` + html;
        }
        container.innerHTML = html;

        const srcRe = /<script\s+src=["']([^"']+)["']/g;
        let srcM: RegExpExecArray | null;
        const ordered = new Set<string>();
        while ((srcM = srcRe.exec(config || '')) !== null) {
          const raw = srcM[1];
          const full = /^https?:\/\//.test(raw) ? raw : rewritePaths(raw, base);
          if (!ordered.has(full)) ordered.add(full);
        }
        for (const u of ordered) {
          await loadScript(u);
          const ace = (window as any).ace;
          if (ace && ace.EditSession && ace.EditSession.prototype) {
            try { ace.EditSession.prototype.createWorker = function () { return null; }; } catch (e) {}
          }
        }

        const inlines = Array.from(container.querySelectorAll('script:not([src])')) as HTMLScriptElement[];
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
