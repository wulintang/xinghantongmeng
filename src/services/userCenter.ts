import { request } from '@/utils/request';

// 用户中心接口（对接好道 app/user 多应用）
// 请求基址：BOYOUQUAN_API_ADDRESS + /user/index/xxx.html
const BASE = '/user/index';

export interface MemberInfo {
  id: number;
  name: string;
  head: string;
  mail: string;
  phone: string;
  description: string;
  qq: string;
  home: string;
  sex: number;
  occupation: string;
  regtime: number;
  login_time: number;
}

export interface ApiResp<T = any> {
  code: number;
  msg: string;
  data?: T;
  key?: string;
}

export interface FavoriteItem {
  fav_id: number;
  tid: number;
  time: number;
  site_name: string;
  domain: string;
  feed_url: string;
}
export interface CheckinStatus {
  today_done: number;
  last_day: number;
  count: number;
}
export interface MessageItem {
  id: number;
  open: number;
  url: string;
  msg: string;
  time: number;
}
export interface BalanceItem {
  id: number;
  title: string;
  rmb: string;
  time: string;
}
export interface OrderItem {
  id: string;
  title: string;
  jiage: string;
  status: number;
  add_time: number;
}
export interface ReportItem {
  id: number;
  status: number;
  tid: string;
  title: string;
  content: string;
  tag: string;
  time: number;
}
export interface LinkItem {
  id: number;
  name: string;
  pic: string;
  lianjie: string;
  hover: string;
  px: number;
  wz: number;
}
export interface TagItem {
  id: number;
  name: string;
  type: number;
  px: number;
}

function post<T>(path: string, data: Record<string, any> = {}): Promise<T> {
  const body = new URLSearchParams();
  Object.keys(data).forEach((k) => {
    const v = data[k];
    if (v !== undefined && v !== null && v !== '') body.append(k, String(v));
  });
  return request<T>(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
}

// 发验证码（复用 verify 插件：/verify/index/send.html）
export function sendCode(type: 'sms' | 'email', target: string, scene = 'reg') {
  return request<ApiResp>(
    `/verify/index/send.html?type=${type}&target=${encodeURIComponent(target)}&scene=${scene}`
  );
}

// 注册（手机号+短信 或 邮箱+邮箱验证码 二选一）
export function userRegister(data: {
  mail?: string;
  phone?: string;
  password: string;
  passwords: string;
  sms_code?: string;
  email_code?: string;
}) {
  return post<ApiResp<{ key: string }>>('/register.html', data);
}

// 登录（密码登录 或 验证码登录）
export function userLogin(data: {
  account?: string;
  password?: string;
  phone?: string;
  mail?: string;
  sms_code?: string;
  email_code?: string;
}) {
  return post<ApiResp<{ key: string; data: MemberInfo }>>('/login.html', data);
}

export function userLogout() {
  return post<ApiResp>('/logout.html');
}

export function getUserProfile(key: string) {
  return request<ApiResp<MemberInfo>>(`${BASE}/profile.html?key=${encodeURIComponent(key)}`);
}

export function updateUserProfile(key: string, data: Record<string, any>) {
  return post<ApiResp<MemberInfo>>('/updateProfile.html', { key, ...data });
}

export function getFavorites(key: string) {
  return request<ApiResp<FavoriteItem[]>>(`${BASE}/favorites.html?key=${encodeURIComponent(key)}`);
}
export function toggleFavorite(key: string, tid: number, m = 'website') {
  return post<ApiResp<{ faved: number }>>('/favoriteToggle.html', { key, tid, m });
}
export function toggleLike(key: string, tid: number, m = 'website') {
  return post<ApiResp<{ liked: number }>>('/likeToggle.html', { key, tid, m });
}

export function getCheckin(key: string) {
  return request<ApiResp<CheckinStatus>>(`${BASE}/checkin.html?key=${encodeURIComponent(key)}`);
}
export function doCheckin(key: string) {
  return post<ApiResp<{ day: number; rmb: number }>>('/checkinDo.html', { key });
}

export function getMessages(key: string) {
  return request<ApiResp<MessageItem[]>>(`${BASE}/messages.html?key=${encodeURIComponent(key)}`);
}
export function readMessage(key: string, id: number) {
  return post<ApiResp>('/readMsg.html', { key, id });
}

export function getBalance(key: string) {
  return request<ApiResp<{ list: BalanceItem[]; total: number }>>(
    `${BASE}/balance.html?key=${encodeURIComponent(key)}`
  );
}
export function getOrders(key: string) {
  return request<ApiResp<OrderItem[]>>(`${BASE}/orders.html?key=${encodeURIComponent(key)}`);
}
export function getReports(key: string) {
  return request<ApiResp<ReportItem[]>>(`${BASE}/reports.html?key=${encodeURIComponent(key)}`);
}
export function submitReport(
  key: string,
  data: { tid?: string; title?: string; content: string; tag?: string; m?: string }
) {
  return post<ApiResp>('/report.html', { key, ...data });
}

// 导航友链 / 标签（无需登录）
export function getLinks() {
  return request<ApiResp<LinkItem[]>>(`${BASE}/links.html`);
}
export function getTags() {
  return request<ApiResp<TagItem[]>>(`${BASE}/tags.html`);
}
