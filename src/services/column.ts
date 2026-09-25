import { request } from '@/utils/request';
import { getToken } from '@/utils/auth';

// 用户专栏插件 column 后端接口（app/column/controller/Api.php），路径带 /index.php/
const COL = '/index.php/column/api';

/** 专栏（my_article_cate 扩展后） */
export interface ColumnItem {
  id: number;
  tid?: number;
  /** 申请记录关联的 my_article_cate.id，0=尚未创建 */
  article_cate_id: number;
  name: string;
  pic: string;
  description: string | null;
  /** 所有者 uid，0=官方/后台 */
  uid: number;
  author: string;
  author_head: string;
  /** 审核状态 0待审 1通过 2拒绝 */
  status: number;
  reason: string | null;
  custom_url: string | null;
  /** 自定义URL审核状态 0待审 1通过 2拒绝 */
  url_status: number;
  open: number;
  rewarded: number;
  reward_amount: number | string;
  time?: number;
  px?: number;
}

/** 专栏文章（my_article 扩展后） */
export interface ColumnArticleItem {
  id: number;
  tid: number;
  title: string;
  pic: string;
  description: string | null;
  keywords: string | null;
  content?: string;
  view: number;
  zan: number;
  time: number;
  times?: number;
  uid: number;
  author: string;
  author_head: string;
  /** 审核状态 0待审 1通过 2拒绝 */
  status: number;
  reason: string | null;
  rewarded: number;
  reward_amount: number | string;
}

export interface ColumnConfig {
  cate_reward_min: string;
  cate_reward_max: string;
  article_reward_min: string;
  article_reward_max: string;
  url_fee: string;
}

/** 拼查询串（自动跳过空值） */
function qs(params: Record<string, any>): string {
  const q = new URLSearchParams();
  Object.keys(params).forEach((k) => {
    const v = params[k];
    if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

/** 表单 POST（x-www-form-urlencoded，key 自动带登录态） */
function post<T>(path: string, data: Record<string, any> = {}): Promise<T> {
  const key = getToken();
  const body = new URLSearchParams();
  if (key) body.append('key', key);
  Object.keys(data).forEach((k) => {
    const v = data[k];
    if (v === undefined || v === null || v === '') return;
    if (Array.isArray(v)) v.forEach((item) => body.append(`${k}[]`, String(item)));
    else body.append(k, String(v));
  });
  return request<T>(`${COL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
}

// ===================== 公开只读接口 =====================

/** 专栏矩阵：已通过专栏（含官方 uid=0），返回作者信息 */
export function getColumns() {
  return request<{ code: number; msg: string; data: ColumnItem[] }>(`${COL}/columns.html`);
}

/** 某专栏下已通过文章 */
export function getColumnArticles(tid: number | string) {
  return request<{ code: number; msg: string; data: ColumnArticleItem[] }>(
    `${COL}/columnArticles.html` + qs({ tid })
  );
}

/** 插件公开配置（URL 审核费等） */
export function getColumnConfig() {
  return request<{ code: number; msg: string; data: { url_fee: number } }>(
    `${COL}/config.html`
  );
}

/** 广场聚合：官方 + 用户专栏已通过文章（feed 风格） */
export function getSquare(page = 1, limit = 20) {
  return request<{ code: number; msg: string; data: ColumnArticleItem[] }>(
    `${COL}/square.html` + qs({ page, limit })
  );
}

/** 文章详情（已通过） */
export function getColumnDetail(id: number | string) {
  return request<{ code: number; msg: string; data: ColumnArticleItem }>(
    `${COL}/detail.html` + qs({ id })
  );
}

// ===================== 会员接口（需登录） =====================

/** 我的专栏（待审/通过/拒绝三态均返回） */
export function getMyColumns(key: string) {
  return request<{ code: number; msg: string; data: ColumnItem[] }>(
    `${COL}/myColumns.html` + qs({ key })
  );
}

/** 我的文章 */
export function getMyArticles(key: string) {
  return request<{ code: number; msg: string; data: ColumnArticleItem[] }>(
    `${COL}/myArticles.html` + qs({ key })
  );
}

/** 上传专栏图标 / 文章封面，返回 url */
export function uploadColumnImg(key: string, file: File) {
  const body = new FormData();
  body.append('key', key);
  body.append('file', file);
  return request<{ code: number; msg: string; data?: { url: string } }>(`${COL}/upload.html`, {
    method: 'POST',
    body,
  });
}

/** 新增 / 修改专栏（id 空=新增，提交即待审） */
export function columnSave(data: { id?: number; name: string; pic: string; description?: string }) {
  return post<{ code: number; msg: string; data?: { id: number } }>('/columnSave.html', data);
}

/** 删除专栏：无文章才可删；有文章则后端级联退奖删文再删专栏 */
export function columnDel(id: number) {
  return post<{ code: number; msg: string }>('/columnDel.html', { id });
}

/** 新增 / 修改文章（tid 须为自己已通过专栏，提交即待审） */
export function articleSave(data: {
  id?: number;
  tid: number;
  title: string;
  pic: string;
  content: string;
  description?: string;
  keywords?: string;
}) {
  return post<{ code: number; msg: string; data?: { id: number } }>('/articleSave.html', data);
}

/** 删除文章（退还文章奖励） */
export function articleDel(id: number) {
  return post<{ code: number; msg: string }>('/articleDel.html', { id });
}

/** 自定义专栏 URL（付费，提交即 URL 待审） */
export function urlSave(data: { id: number; custom_url: string }) {
  return post<{ code: number; msg: string }>('/urlSave.html', data);
}

/** 我的余额（用于自定义 URL 付费前校验；复用 userCenter 的余额接口占位） */
export const COLUMN_STATUS_TEXT: Record<number, string> = {
  0: '待审核',
  1: '已通过',
  2: '已拒绝',
};

export const COLUMN_URL_STATUS_TEXT: Record<number, string> = {
  0: 'URL待审核',
  1: 'URL已生效',
  2: 'URL已拒绝',
};
