import React, { useEffect, useRef } from 'react';
import { MdPreview } from 'md-editor-rt';
import { useTheme } from '@/context/ThemeProvider';
import { decorateArticleImages } from '@/utils/articleImages';

interface Props {
  id: string;
  modelValue: string;
}

/**
 * 统一的 Markdown 预览（renderx 统一化）：
 * 1. 随站点深浅模式切换 md-editor 主题；
 * 2. 用 .rx-md-view 包裹，由 styles.css 把 md-editor 自带主题变量桥接到
 *    站点统一表面/边线变量（--c-surface 等），使文章正文、代码块、边框
 *    与全站卡片完全一套。用包裹层而非给 MdPreview 透传 style/className，
 *    避免依赖第三方组件未经验证的 props。
 * 3. 后台是纯 Markdown 源码编辑器，图片描述（alt）与居中排版作者看不到，
 *    统一由 decorateArticleImages 在渲染后补 figure / figcaption。
 */
export default function MdView({ id, modelValue }: Props): React.JSX.Element {
  const { dark } = useTheme();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    decorateArticleImages(root);
    // md-editor 可能在挂载后异步重建 DOM（内容/主题变化），观察后补一次；
    // 已处理的图片带 data-rx-figure 标记，不会重复包裹。
    const mo = new MutationObserver(() => decorateArticleImages(root));
    mo.observe(root, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [modelValue, dark]);

  return (
    <div className="rx-md-view" ref={ref}>
      <MdPreview id={id} modelValue={modelValue} theme={dark ? 'dark' : 'light'} />
    </div>
  );
}
