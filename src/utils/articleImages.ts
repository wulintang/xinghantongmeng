/**
 * 文章内容图片排版增强
 *
 * 后台编辑器是纯 Markdown / HTML 源码，不是可视化编辑器：作者填了「图片描述」
 * （Markdown 的 ![]() 里的文字，或 <img alt="">），但前台既看不到描述，
 * 也无法预览图片是否居中、边线深浅是否合适。所以这些统一由前端补齐：
 *
 *  1. 每张正文图片包一层 <figure class="md-figure">，让图片居中；
 *  2. 用 alt / title 生成 <figcaption class="md-figure-caption">，显示在图片正下方；
 *  3. 图片本身（边线、圆角、70% 宽、深浅模式）由 styles.css 统一控制。
 *
 * 只做 DOM 结构，不写任何行内样式，深浅模式只翻 CSS 变量。
 */

/** 这些 alt 是编辑器自动生成的占位词，不作为「图片描述」展示 */
const PLACEHOLDER_ALT = new Set(['', 'image', 'img', 'photo', 'picture']);

export function decorateArticleImages(root: HTMLElement | null): void {
  if (!root) return;
  const imgs = Array.from(root.querySelectorAll<HTMLImageElement>('img'));
  imgs.forEach((img) => {
    // 每张图只处理一次，避免 MutationObserver 因自身改动反复触发
    if (img.dataset.rxFigure === '1') return;
    img.dataset.rxFigure = '1';

    // 验证码、广告位、作者自己写好的 figure 不参与正文排版
    if (img.classList.contains('captcha-img') || img.closest('.ad-banner') || img.closest('figure')) return;

    // 图片独占一个段落时，把整段内容搬进 figure（保留 <a>/<span> 等原有链接结构）
    const ownP = img.closest('p');
    const soloP =
      ownP && ownP.parentElement && ownP.querySelectorAll('img').length === 1 && !(ownP.textContent || '').trim()
        ? ownP
        : null;
    const ownA = img.closest('a');
    const soloA =
      !soloP && ownA && ownA.parentElement && ownA.querySelectorAll('img').length === 1 && !(ownA.textContent || '').trim()
        ? ownA
        : null;
    const node: HTMLElement = soloP || soloA || img;
    const parent = node.parentElement;
    if (!parent) return;
    // 先记下 img 原来的直接父节点，img 移走后它可能是空的包裹层
    const oldParent = node === img ? img.parentElement : null;

    const figure = document.createElement('figure');
    figure.className = 'md-figure';
    parent.insertBefore(figure, node);

    if (node === img) {
      figure.appendChild(img);
      // 清掉搬空后的装饰性包裹（如 md-editor 的 span）；链接 <a> 保留不删
      if (oldParent && oldParent !== figure && oldParent !== root && !oldParent.childNodes.length
        && oldParent.tagName !== 'A' && oldParent.tagName !== 'P') {
        oldParent.remove();
      }
    } else {
      Array.from(node.childNodes).forEach((child) => figure.appendChild(child));
      node.remove();
    }

    const caption = (img.getAttribute('alt') || img.getAttribute('title') || '').trim();
    if (!PLACEHOLDER_ALT.has(caption.toLowerCase())) {
      const cap = document.createElement('figcaption');
      cap.className = 'md-figure-caption';
      cap.textContent = caption;
      figure.appendChild(cap);
    }
  });
}
