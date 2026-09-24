import { request, apiBase } from '@/utils/request';
import { domainOf, normalizeDomain } from '@/utils/route';

// 好道核心现成接口（app/controller/Api.php），路径带 /index.php/
const API = '/index.php/api';
// 用户中心（app/user 插件），路径带 /index.php/
const USER = '/index.php/user/index';
// 站点展示数据（openapi 插件），全部读后台现有数据表，只读
const OPEN = '/index.php/openapi/index';

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
  m: string;
  time: number;
  name: string;
  url: string;
  feed_url: string;
}
export interface CheckinStatus {
  today_done: number;
  last_day: number;
  count: number;
  rule?: {
    day: number;
    rmb1: number;
    rmb2: number;
  };
}
export interface CheckinRecord {
  id: number;
  day: number;
  rmb: number;
  time: number;
  ip?: string;
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
  huifu?: string;
  time: number;
}

/** 我的友链/站点申请记录（my_tijiao，按 uid 过滤） */
export interface MyLinkItem {
  id: number;
  type: string;
  name: string;
  url: string;
  /** 审核状态：0 待审核 / 1 通过 / 9 拒绝 */
  open: number;
  time: number;
}

function post<T>(path: string, data: Record<string, any> = {}, base = API): Promise<T> {
  const body = new URLSearchParams();
  Object.keys(data).forEach((k) => {
    const v = data[k];
    if (v === undefined || v === null || v === '') return;
    if (Array.isArray(v)) {
      v.forEach((item) => body.append(`${k}[]`, String(item)));
    } else {
      body.append(k, String(v));
    }
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

// 注册（好道 Api.php::reg：手机+邮箱双必验）
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

// 换绑手机号（已绑定账号，校验短信验证码；scene=bind）
export function bindPhone(phone: string, code: string) {
  return post<ApiResp>('/bindPhone.html', { phone, code });
}
// 换绑邮箱（已绑定账号，校验邮箱验证码；scene=bindmail）
export function changeMail(mail: string, code: string) {
  return post<ApiResp>('/changeMail.html', { mail, code });
}

export function userLogout() {
  return post<ApiResp>('/logout.html');
}

// ===================== 用户中心（app/user 插件） =====================
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
  return post<ApiResp<{ liked: number; zan: number }>>('/likeToggle.html', { key, tid, m }, USER);
}
// 读取某目标当前是否已被收藏（解决刷新后收藏态丢失）
export function readFaved(key: string, tid: number, m: string): Promise<boolean> {
  if (!key) return Promise.resolve(false);
  return getFavorites(key)
    .then((r) => (r.code === 1 && r.data ? r.data.some((f) => Number(f.tid) === tid && f.m === m) : false))
    .catch(() => false);
}
// 认领站点（my_website.uid，仅未认领的站可认领）
export function claimWebsite(key: string, tid: number) {
  return post<ApiResp>('/claim.html', { key, tid }, USER);
}
export function getCheckin(key: string) {
  return request<ApiResp<CheckinStatus>>(`${USER}/checkin.html?key=${encodeURIComponent(key)}`);
}
export function getCheckinList(key: string) {
  return request<ApiResp<CheckinRecord[]>>(`${USER}/checkinList.html?key=${encodeURIComponent(key)}`);
}
export function doCheckin(key: string) {
  return post<ApiResp<{ day: number; rmb: number }>>('/checkinDo.html', { key }, USER);
}
export function getMessages(key: string) {
  return request<ApiResp<MessageItem[]>>(`${USER}/messages.html?key=${encodeURIComponent(key)}`);
}
export function readMessage(key: string, id: number | 'all' | number[]) {
  return post<ApiResp>('/readMsg.html', { key, id }, USER);
}
export function deleteMessage(key: string, id: number | number[]) {
  return post<ApiResp>('/delMsg.html', { key, id }, USER);
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

// 提交站点（走 user 插件 addSite：key 登录 + 图形验证码 session 校验 + 写 my_tijiao）
export function addSite(
  key: string,
  data: {
    name: string;
    url: string;
    code: string;
    type?: string;
    cate?: string | number;
    ico?: string;
    pic?: string;
    feed_url?: string;
    nofollow?: number;
    xin?: number;
    verify_type?: string;
    verify_token?: string;
  }
) {
  return post<ApiResp>('/addSite.html', { key, sid: getCaptchaSid(), ...data }, USER);
}

// 获取站点收录人工验证价格（w_rmb）
export function getSiteFee() {
  return post<ApiResp<{ fee: number }>>('/getSiteFee.html', {}, USER);
}

// 生成域名验证 token（文件/DNS 展示明文 token，meta 展示 token 的哈希值）
export function genVerifyToken(key: string, domain: string) {
  return post<ApiResp<{ domain: string; token: string; metaHash: string }>>(
    '/genVerifyToken.html',
    { key, domain },
    USER
  );
}

// 真实校验域名归属：file/dns/meta，成功 code=1（失败时 msg 含原因）
export function verifyDomain(
  key: string,
  data: { type: 'file' | 'dns' | 'meta'; domain: string; value: string }
) {
  return post<ApiResp>('/verifyDomain.html', { key, ...data }, USER);
}

// 我的友链/站点申请列表（my_tijiao，按 uid 过滤；type=link 仅友链）
export function getMyLinks(key: string, type = 'link') {
  return request<ApiResp<MyLinkItem[]>>(
    `${USER}/tijiaoList.html?key=${encodeURIComponent(key)}&type=${encodeURIComponent(type)}`
  );
}

/** Feed 文章点击计数（后端 /index.php/feed/index/click.html） */
export function feedClick(link: string) {
  return request<ApiResp>(`/index.php/feed/index/click.html?link=${encodeURIComponent(link)}`);
}

/** 跨域下 session cookie 不共享，用持久 sid 让 generate/addSite 复用同一验证码（不依赖 cookie） */
function getCaptchaSid(): string {
  const key = 'boyouquan_captcha_sid';
  let sid = localStorage.getItem(key);
  if (!sid) {
    sid = 'c' + Date.now() + Math.random().toString(36).slice(2, 8);
    localStorage.setItem(key, sid);
  }
  return sid;
}

/** 图形验证码图片地址（api 应用 generate；跨域用 sid 同步验证码，避免依赖 cookie/session） */
export function captchaUrl(): string {
  return `${apiBase()}/index.php/api/generate.html?t=${Date.now()}&sid=${encodeURIComponent(getCaptchaSid())}`;
}

// 通用图片上传（user 插件 upload：七牛/本地与后台同款策略；for=avatar 时同时更新头像）
export function uploadFile(key: string, file: File, forAvatar = false) {
  const body = new FormData();
  body.append('key', key);
  body.append('file', file);
  if (forAvatar) body.append('for', 'avatar');
  return request<ApiResp<{ url: string }>>(`${USER}/upload.html`, {
    method: 'POST',
    body,
  });
}

// 我的站点（my_website.uid = 我）
export function getMySites(key: string) {
  return request<ApiResp<WebsiteItem[]>>(`${USER}/mySites.html?key=${encodeURIComponent(key)}`);
}
// 编辑我的站点（仅 title/www/tips/keywords/pic/ico/content 可改）
export function editMySite(key: string, data: Record<string, any>) {
  return post<ApiResp>('/siteEdit.html', { key, ...data }, USER);
}
// 删除我的站点
export function delMySite(key: string, id: number | string) {
  return post<ApiResp>('/siteDel.html', { key, id }, USER);
}

// ===================== 站点展示数据（openapi 插件） =====================
//   my_set(alias=set) 站点配置 / my_link 导航与友链(wz=1 顶部,2 底部,9 友链) / my_dan 单页
//   my_website+_cate 网址库 / my_article+_cate 文章 / my_tag 标签 / my_ad 广告 / app_toolbox 工具

export interface LinkItem {
  id: number;
  wz: number;
  name: string;
  pic: string | null;
  lianjie: string;
  hover: string | null;
  px: number;
  xin: number;
}

export interface SiteConfig {
  title: string;
  /** 完整标题（如「兴汉同盟 - 优质中文网站图鉴」），导航栏/页脚展示用 */
  titles: string;
  logo: string;
  description: string;
  keywords: string;
  author: string;
  beian: string;
  gonganbei: string;
  /** 友链申请费用（元），后台 my_set pay.l_rmb */
  l_rmb: number;
  /** 网址收录费用（元），后台 my_set pay.w_rmb */
  w_rmb: number;
  /** 站点图标（favicon）绝对地址 */
  ico?: string;
}

export interface CateItem {
  id: number;
  tid: number | string;
  name: string;
  pic: string;
  px: number;
  time?: number;
  open?: number;
}

export interface WebsiteItem {
  id: number;
  tid: string;
  title: string;
  name: string;
  www: string;
  domain: string;
  url: string;
  tips: string;
  tool: number;
  keywords: string;
  ico: string;
  pic: string;
  view: number;
  zan: number;
  settop: number;
  time: number;
  times: number;
  content: string;
  feed_url: string;
  related?: WebsiteItem[];
  /** 认领站长 uid（0=未认领，openapi 详情接口带出） */
  uid?: number;
  /** 站长用户名（已认领时） */
  owner?: string;
  /** 当前登录用户是否已赞（带 key 请求详情时返回） */
  liked?: number;
}

export interface ArticleItem {
  id: number;
  tid: number;
  title: string;
  view: number;
  zan: number;
  time: number;
  times: number;
  keywords: string | null;
  description: string | null;
  content?: string;
  /** 当前登录用户是否已赞（带 key 请求详情时返回） */
  liked?: number;
}

export interface DanItem {
  id: number;
  alias: string;
  title: string;
  content: string;
  pic: string;
  view: number;
  time: number;
  muban: string;
}

/** 工具（app_toolbox）。config 是后端工具页自带的表单 HTML，前端不渲染，只做跳转。 */
export interface ToolItem {
  id: number;
  tid: number;
  rmb: string;
  ai: number;
  title: string;
  alias: string;
  pic: string;
  open: number;
  content: string;
  px: number;
  time: number;
  config?: string;
}

export interface TagItem {
  id: number;
  name: string;
  type: number;
  px: number;
  [key: string]: any;
}

export interface AdItem {
  id: number;
  name: string;
  alias: string;
  content: string;
  px: number;
  times: string;
  muban: string | null;
}

/** 后端列表接口统一的分页结构 */
export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface LinkGroups {
  top: LinkItem[];
  foot: LinkItem[];
  friend: LinkItem[];
}

export const EMPTY_LINK_GROUPS: LinkGroups = { top: [], foot: [], friend: [] };

// 拼查询串（自动跳过空值）
function qs(params: Record<string, any>): string {
  const q = new URLSearchParams();
  Object.keys(params).forEach((k) => {
    const v = params[k];
    if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

// 站点配置（my_set alias=set）
export function getSite() {
  return request<ApiResp<SiteConfig>>(`${OPEN}/site.html`);
}

// 首屏聚合：站点配置 + 三组链接 + 网址分类（Header / Footer / 首页共用，全站只请求一次）
export function getInit() {
  return request<ApiResp<{ site: SiteConfig; links: LinkGroups; cates: CateItem[] }>>(
    `${OPEN}/init.html`
  );
}

// 顶部导航 / 底部导航 / 友情链接（my_link，wz=1/2/9）
export function getLinks() {
  return request<ApiResp<LinkGroups>>(`${OPEN}/links.html`);
}

// 标签（my_tag）
export function getTags(type?: number) {
  return request<ApiResp<TagItem[]>>(`${OPEN}/tags.html` + qs({ type }));
}

// 单页（my_dan）；count=1 时后端浏览量 +1（仅单页详情页传）
export function getDan(alias?: string, count = 0, key = '') {
  return request<ApiResp<DanItem>>(`${OPEN}/dan.html` + qs({ alias, count, key }));
}
export function getDans() {
  return request<ApiResp<DanItem[]>>(`${OPEN}/dans.html`);
}

// 网址库（my_website + my_website_cate）
export function getWebsiteCates() {
  return request<ApiResp<CateItem[]>>(`${OPEN}/websiteCates.html`);
}
export function getWebsites(
  params: { cate?: string | number; keyword?: string; tool?: number; order?: string; page?: number; limit?: number } = {}
) {
  return request<ApiResp<PageResult<WebsiteItem>>>(`${OPEN}/websites.html` + qs(params));
}
export function getWebsite(id: number | string, count = 0, key = '') {
  return request<ApiResp<WebsiteItem>>(`${OPEN}/website.html` + qs({ id, count, key }));
}

/**
 * 按域名解析收录站点（前端路由 /域名 直达用）。
 * 后端 website.html 只接 id，所以先拉取站点列表用 domainOf 匹配，再取该站详情。
 * count=1 时后端浏览量 +1（只有站点详情页传，列表兜底不传，避免虚增）。
 * key 用于后端返回 liked（当前用户是否已赞）。
 */
export async function getWebsiteByDomain(domain: string, count = 0, key = ''): Promise<ApiResp<WebsiteItem>> {
  const norm = normalizeDomain(domain);
  const list = await getWebsites({ page: 1, limit: 1000 });
  if (list.code === 1 && list.data?.list) {
    const found = list.data.list.find((w) => normalizeDomain(domainOf(w)) === norm);
    if (found) return getWebsite(found.id, count, key);
  }
  return { code: 0, msg: '站点不存在或未收录', data: null as any };
}

// 文章（my_article + my_article_cate）
export function getArticleCates() {
  return request<ApiResp<CateItem[]>>(`${OPEN}/articleCates.html`);
}
export function getArticles(
  params: { cate?: string | number; keyword?: string; order?: string; page?: number; limit?: number } = {}
) {
  return request<ApiResp<PageResult<ArticleItem>>>(`${OPEN}/articles.html` + qs(params));
}
export function getArticle(id: number | string, key = '', count = 0) {
  return request<ApiResp<ArticleItem>>(`${OPEN}/article.html` + qs({ id, key, count }));
}

// 广告位（my_ad）
export function getAds(alias?: string) {
  return request<ApiResp<AdItem[]>>(`${OPEN}/ads.html` + qs({ alias }));
}

// 工具（app_toolbox + app_toolbox_cate）
export function getToolCates() {
  return request<ApiResp<CateItem[]>>(`${OPEN}/toolCates.html`);
}
export function getTools(params: { cate?: string | number; keyword?: string; page?: number; limit?: number } = {}) {
  return request<ApiResp<PageResult<ToolItem>>>(`${OPEN}/tools.html` + qs(params));
}
export function getTool(id: number | string, key = '') {
  return request<ApiResp<ToolItem>>(`${OPEN}/tool.html` + qs({ id, key }));
}
