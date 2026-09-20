import { request } from '@/utils/request';

// 好道核心现成接口（app/controller/Api.php），路径带 /index.php/
const API = '/index.php/api';
// 用户中心（app/user 插件，按之前授权创建），路径带 /index.php/
const USER = '/index.php/user/index';

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

function post<T>(path: string, data: Record<string, any> = {}, base = API): Promise<T> {
  const body = new URLSearchParams();
  Object.keys(data).forEach((k) => {
    const v = data[k];
    if (v !== undefined && v !== null && v !== '') body.append(k, String(v));
  });
  return request<T>(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
}

// 发验证码（verify 插件现成：/index.php/verify/index/send.html）
export function sendCode(type: 'sms' | 'email', target: string, scene = 'reg') {
  return request<ApiResp>(
    `/index.php/verify/index/send.html?type=${type}&target=${encodeURIComponent(target)}&scene=${scene}`
  );
}

// 注册（好道 Api.php::reg：邮箱 + 短信验证码 且 手机 + 邮箱验证码，双必验；密码 + 确认密码）
export function userRegister(data: {
  mail: string;
  phone: string;
  password: string;
  passwords: string;
  sms_code: string;
  email_code: string;
}) {
  return post<ApiResp<{ key: string }>>('/reg.html', data);
}

// 登录（好道 Api.php::login：手机或邮箱二选一 + 密码 + 对应验证码）
export function userLogin(data: {
  phone?: string;
  mail?: string;
  password: string;
  sms_code?: string;
  email_code?: string;
}) {
  return post<ApiResp<{ key: string; data: MemberInfo }>>('/login.html', data);
}

export function userLogout() {
  return post<ApiResp>('/logout.html');
}

// ===================== 用户中心（app/user 插件，按授权创建） =====================
export function getUserProfile(key: string) {
  return request<ApiResp<MemberInfo>>(`${USER}/profile.html?key=${encodeURIComponent(key)}`);
}
export function updateUserProfile(key: string, data: Record<string, any>) {
  return post<ApiResp<MemberInfo>>('/updateProfile.html', { key, ...data }, USER);
}
export function getFavorites(key: string) {
  return request<ApiResp<FavoriteItem[]>>(`${USER}/favorites.html?key=${encodeURIComponent(key)}`);
}
export function toggleFavorite(key: string, tid: number, m = 'website') {
  return post<ApiResp<{ faved: number }>>('/favoriteToggle.html', { key, tid, m }, USER);
}
export function toggleLike(key: string, tid: number, m = 'website') {
  return post<ApiResp<{ liked: number }>>('/likeToggle.html', { key, tid, m }, USER);
}
export function getCheckin(key: string) {
  return request<ApiResp<CheckinStatus>>(`${USER}/checkin.html?key=${encodeURIComponent(key)}`);
}
export function doCheckin(key: string) {
  return post<ApiResp<{ day: number; rmb: number }>>('/checkinDo.html', { key }, USER);
}
export function getMessages(key: string) {
  return request<ApiResp<MessageItem[]>>(`${USER}/messages.html?key=${encodeURIComponent(key)}`);
}
export function readMessage(key: string, id: number) {
  return post<ApiResp>('/readMsg.html', { key, id }, USER);
}
export function getBalance(key: string) {
  return request<ApiResp<{ list: BalanceItem[]; total: number }>>(
    `${USER}/balance.html?key=${encodeURIComponent(key)}`
  );
}
export function getOrders(key: string) {
  return request<ApiResp<OrderItem[]>>(`${USER}/orders.html?key=${encodeURIComponent(key)}`);
}
export function getReports(key: string) {
  return request<ApiResp<ReportItem[]>>(`${USER}/reports.html?key=${encodeURIComponent(key)}`);
}
export function submitReport(
  key: string,
  data: { tid?: string; title?: string; content: string; tag?: string; m?: string }
) {
  return post<ApiResp>('/report.html', { key, ...data }, USER);
}

// 提交站点（好道 Api.php::getAdd：名称 + URL + 图形验证码 code，需登录）
export function submitSite(
  key: string,
  data: { name: string; url: string; type?: string; code: string }
) {
  return post<ApiResp<{ id?: number | string }>>('/getAdd.html', {
    key,
    name: data.name,
    url: data.url,
    type: data.type || 'website',
    code: data.code,
  });
}

// ===================== 下方为「后端核心无现成 JSON 接口」的部分（待路线定） =====================
// 站名/导航/友链/单页/首页列表：好道是服务端渲染模板（view/wulintang），核心 Api.php 没有这些 JSON 接口。
// 目前前端 Header/Footer/首页仍调用下面这些函数，后端无对应接口会返回空——待你定路线
// （A 告知后端现成接口路径 / B 授权加只读接口 / C 前端静态配置）后统一改干净。
export interface LinkItem {
  id: number;
  name: string;
  pic: string;
  lianjie: string;
  hover: string;
  px: number;
  wz: number;
  xin?: number;
}
export interface TagItem {
  id: number;
  name: string;
  type: number;
  px: number;
}
export interface SiteConfig {
  title: string;
  titles: string;
  logo: string;
  description: string;
  keywords: string;
  author: string;
  beian: string;
  gonganbei: string;
}
export interface WebsiteItem {
  id?: number | string;
  name?: string;
  title?: string;
  ico?: string;
  pic?: string;
  keywords?: string;
  description?: string;
  view?: number | string;
  zan?: number | string;
  www?: string;
  domain?: string;
  url?: string;
  content?: string;
  type?: string;
  [key: string]: any;
}
export interface DanItem {
  alias?: string;
  title?: string;
  content?: string;
  [key: string]: any;
}
export function getLinks() {
  return request<ApiResp<LinkItem[]>>(`${USER}/links.html`);
}
export function getTags() {
  return request<ApiResp<TagItem[]>>(`${USER}/tags.html`);
}
export function getSite() {
  return request<ApiResp<SiteConfig>>(`${USER}/site.html`);
}
export function getDan(alias?: string) {
  return request<ApiResp<DanItem>>(
    `${USER}/dan.html` + (alias ? `?alias=${encodeURIComponent(alias)}` : '')
  );
}
export function getWebsites(params: { keyword?: string; type?: string } = {}) {
  const query = new URLSearchParams();
  if (params.keyword) query.append('keyword', params.keyword);
  if (params.type) query.append('type', params.type);
  const qs = query.toString();
  return request<ApiResp<WebsiteItem[]>>(`${USER}/websites.html` + (qs ? `?${qs}` : ''));
}
