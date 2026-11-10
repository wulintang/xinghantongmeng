import React from 'react';
import { MdPreview } from 'md-editor-rt';
import { useTheme } from '@/context/ThemeProvider';

interface Props {
  id: string;
  modelValue: string;
}

/**
 * 统一的 Markdown 预览（renderx 统一化）：随站点深浅模式自动切换 md-editor 主题，
 * 避免深色下正文区仍为白底、与全站表面不一致。
 */
export default function MdView({ id, modelValue }: Props): React.JSX.Element {
  const { dark } = useTheme();
  return <MdPreview id={id} modelValue={modelValue} theme={dark ? 'dark' : 'light'} />;
}
