import { request } from '@/utils/request';
import { getToken } from '@/utils/auth';

// 广告增强插件 adpay 后端接口（app/adpay/controller/Api.php），路径带 /index.php/
const ADP = '/index.php/adpay/api';

export interface AdPayAd {
  id: number;
  title: string;
  link: string;
  img: string;
  content: string;
}

export interface AdPayPosition {
  id: number;
  pkey: string;
  name: string;
  page: string;
  location: string;
  price_day: string;
  price_week: string;
  price_month: string;
  price_quarter: string;
  price_year: string;
  min_day: number;
  max_day: number;
  allowed_form: string;
  open: number;
  sort: number;
}

export interface AdPayApply {
  id: number;
  uid: number;
  pkey: string;
  title: string;
  link: string;
  img: string;
  content: string;
  duration_day: number;
  amount: string;
  status: number; // 0待审 1通过 2拒绝 3到期 4退款
  refuse_reason: string | null;
  start_time: number;
  end_time: number;
  create_time: number;
  position_name: string;
}

export interface AdPayGridCell {
  id: number;
  page: string;
  x: number;
  y: number;
  w: number;
  h: number;
  price: string;
  status: number; // 0空闲 1已售 2预留
  uid: number;
  content: string;
  img: string;
  link: string;
  start_time: number;
  end_time: number;
  mine: number;
  active: number;
}

export interface AdPayGrid {
  page: string;
  cols: number;
  rows: number;
  cells: AdPayGridCell[];
}

function qs(params: Record<string, any>): string {
  const q = new URLSearchParams();
  Object.keys(params).forEach((k) => {
    const v = params[k];
    if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

/** 获取某广告位要展示的广告（后端：登录优先自己的，否则随机） */
export function getAd(slot: string) {
  const key = getToken();
  return request<{ code: number; msg: string; data: AdPayAd | null; mine?: number }>(
    `${ADP}/ad.html` + qs({ slot, key })
  );
}

/** 广告位定价配置 */
export function getPosition(pkey: string) {
  return request<{ code: number; msg: string; data: AdPayPosition | null }>(`${ADP}/position.html` + qs({ pkey }));
}

/** 提交系统广告申请（先付费后审核） */
export function applyAd(data: { pkey: string; plan: string; title?: string; link?: string; img?: string; content?: string }) {
  const key = getToken();
  const body = new URLSearchParams();
  body.append('key', key);
  Object.keys(data).forEach((k) => {
    const v = (data as any)[k];
    if (v !== undefined && v !== null && v !== '') body.append(k, String(v));
  });
  return request<{ code: number; msg: string; data?: any }>(`${ADP}/apply.html`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
}

/** 我的广告申请 */
export function getMyAds() {
  const key = getToken();
  return request<{
    code: number;
    msg: string;
    data?: { applies: AdPayApply[]; gridApplies: any[] };
  }>(`${ADP}/my.html` + qs({ key }));
}

/** 格子广告画布 */
export function getGrid(page: string) {
  const key = getToken();
  return request<{ code: number; msg: string; data: AdPayGrid | null }>(`${ADP}/grid.html` + qs({ page, key }));
}

/** 提交格子广告申请（框选面积计费） */
export function applyGrid(data: { page: string; cells: number[]; content?: string; img?: string; link?: string; duration_month: number }) {
  const key = getToken();
  const body = new URLSearchParams();
  body.append('key', key);
  body.append('page', data.page);
  body.append('cells', JSON.stringify(data.cells));
  body.append('duration_month', String(data.duration_month));
  if (data.content) body.append('content', data.content);
  if (data.img) body.append('img', data.img);
  if (data.link) body.append('link', data.link);
  return request<{ code: number; msg: string; data?: any }>(`${ADP}/gridApply.html`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
}

/** 投放时长选项（与后端 planDays 对齐） */
export const AD_PLANS = [
  { key: 'day', label: '日', days: 1 },
  { key: 'week', label: '周', days: 7 },
  { key: 'month', label: '月', days: 30 },
  { key: 'quarter', label: '季', days: 90 },
  { key: 'year', label: '年', days: 365 },
] as const;

export function planPrice(pos: AdPayPosition, planKey: string): number {
  const map: Record<string, string> = {
    day: 'price_day',
    week: 'price_week',
    month: 'price_month',
    quarter: 'price_quarter',
    year: 'price_year',
  };
  return parseFloat((pos as any)[map[planKey]] || '0');
}

export const AD_STATUS_TEXT: Record<number, string> = {
  0: '待审核',
  1: '投放中',
  2: '已拒绝',
  3: '已到期',
  4: '已退款',
};
