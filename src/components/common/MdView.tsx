import React from 'react';
import { MdPreview } from 'md-editor-rt';
import { useTheme } from '@/context/ThemeProvider';

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
 */
export default function MdView({ id, modelValue }: Props): React.JSX.Element {
  const { dark } = useTheme();
  return (
    <div className="rx-md-view">
      <MdPreview id={id} modelValue={modelValue} theme={dark ? 'dark' : 'light'} />
    </div>
  );
}
