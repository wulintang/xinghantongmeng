import React from 'react';
import { Tooltip, TooltipProps } from 'antd';

const isTouch =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(hover: none)').matches;

export default function AppTooltip(props: TooltipProps) {
  if (isTouch) {
    return <>{props.children}</>;
  }
  return <Tooltip {...props} />;
}
