import React, { useEffect, useRef } from 'react';
import { sanitizeHtml } from '@/utils/CommonUtil';
import { decorateArticleImages } from '@/utils/articleImages';

interface Props {
  html: string;
  className?: string;
}

/**
 * 单页 / 说明类内容的 HTML 正文（后台富文本源码）。
 * 与 MdView 一样：图片描述与居中排版由前端补齐，作者无需在后台设置。
 */
export default function ArticleHtml({ html, className }: Props): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    decorateArticleImages(ref.current);
  }, [html]);
  return (
    <div
      ref={ref}
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  );
}
