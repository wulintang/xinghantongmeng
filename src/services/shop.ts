import { request } from '@/utils/request';
import { getToken } from '@/utils/auth';
import type { ApiResp } from '@/services/userCenter';

// 商户（我的商城）插件：后端 app/shop 插件，路径带 /index.php/
const SHOP = '/index.php/shop/index';
const SHOP_ADMIN = '/index.php/shop/admin';

export type ShopCate = 'domain' | 'brand' | 'soft' | 'copyright' | 'code';
export type DeliveryType = 'digital' | 'physical';

/** 店铺 */
export interface ShopItem {
  id: number;
  uid: number;
  shop_name: string;
  categories: string | string[]; // 后端存 JSON 字符串
  intro: string;
  status: number; // 0 待审 / 1 营业中 / 2 暂停
  audit_status: number; // 0 待审 / 1 通过 / 2 驳回
  audit_reject: string;
  deposit_paid: number;
  created_at: number;
}

/** 商品 */
export interface GoodsItem {
  id: number;
  shop_id: number;
  uid: number;
  title: string;
  cate: ShopCate;
  keywords: string;
  description: string;
  content: string;
  cover: string;
  price: number;
  stock: number;
  delivery: DeliveryType;
  delivery_note: string;
  status: number; // 0 待审 / 1 在售 / 2 下架
  audit_status: number; // 0 待审 / 1 通过 / 2 驳回
  audit_reject: string;
  created_at: number;
}

/** 订单（买家/卖家共用） */
export interface ShopOrderItem {
  id: number;
  order_sn: string;
  uid: number; // 买家
  shop_id: number;
  goods_id: number;
  price: number;
  commission: number;
  delivery_type: DeliveryType;
  status: number; // 0 待支付 / 1 待发货 / 2 已发货(数字=已交付) / 3 已完成 / 4 退款中 / 5 已退款
  deliver_content: string;
  address_id: number;
  express_company: string;
  express_no: string;
  refund_reason: string;
  created_at: number;
}

/** 收货地址 */
export interface AddressItem {
  id: number;
  uid: number;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  is_default: number;
}

/** 全局配置（后台插件管理设置） */
export interface ShopConfig {
  enabled: number;
  commission_rate: number;
  deposit_amount: number;
  shop_audit: number;
  goods_audit: number;
  allow_cate: ShopCate[];
}

export const CATE_NAME: Record<string, string> = {
  domain: '域名',
  brand: '商标',
  soft: '软著',
  copyright: '作品著作权',
  code: '源码',
};

/** 类目白名单（前后端双重卡死“只能虚拟品”） */
export const CATE_WHITELIST: ShopCate[] = ['domain', 'brand', 'soft', 'copyright', 'code'];

/** 订单状态文案 */
export function orderStatusText(o: ShopOrderItem): string {
  if (o.status === 0) return '待支付';
  if (o.status === 1) return '待发货';
  if (o.status === 2) return o.delivery_type === 'digital' ? '已交付' : '已发货';
  if (o.status === 3) return '已完成';
  if (o.status === 5) return '已退款';
  if (o.status === 4) return '退款中';
  return '未知';
}

export function orderStatusColor(o: ShopOrderItem): string {
  if (o.status === 0) return 'orange';
  if (o.status === 1) return 'orange';
  if (o.status === 2) return o.delivery_type === 'digital' ? 'green' : 'blue';
  if (o.status === 3) return 'green';
  if (o.status === 5 || o.status === 4) return 'red';
  return 'default';
}

function post<T>(path: string, data: Record<string, any> = {}, base = SHOP): Promise<T> {
  const body = new URLSearchParams();
  const key = getToken();
  if (key) body.append('key', key);
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

// ===================== 公开（无需登录） =====================
export function getShopInfo(uid: number | string) {
  return request<ApiResp<ShopItem | null>>(`${SHOP}/shopInfo.html?uid=${encodeURIComponent(String(uid))}`);
}
export function getGoodsList(shopId: number, cate: string | 'all' = 'all') {
  return request<ApiResp<GoodsItem[]>>(
    `${SHOP}/goodsList.html?shop_id=${shopId}&cate=${encodeURIComponent(cate)}`
  );
}
export function getGoodsDetail(id: number | string) {
  return request<ApiResp<GoodsItem>>(`${SHOP}/goodsDetail.html?id=${encodeURIComponent(String(id))}`);
}
/** 公开：插件全局配置（类目白名单 / 保证金应缴额 / 审计开关） */
export function getShopConfig() {
  return request<ApiResp<ShopConfig>>(`${SHOP}/config.html`);
}

// ===================== 商家（需登录 key） =====================
export function getMyShop() {
  return post<ApiResp<ShopItem | null>>('/myShop.html');
}
export function saveShop(data: Record<string, any>) {
  return post<ApiResp<{ shop_id: number }>>('/shopSave.html', data);
}
export function getMyGoods() {
  return post<ApiResp<GoodsItem[]>>('/myGoods.html');
}
export function getMyGoodsDetail(id: number) {
  return post<ApiResp<GoodsItem>>('/myGoodsDetail.html', { id });
}
export function saveGoods(data: Record<string, any>) {
  return post<ApiResp<{ id: number }>>('/goodsSave.html', data);
}
export function getShopOrders() {
  return post<ApiResp<ShopOrderItem[]>>('/shopOrders.html');
}
export function shipOrder(orderId: number, expressCompany: string, expressNo: string) {
  return post<ApiResp>('/shipOrder.html', { order_id: orderId, express_company: expressCompany, express_no: expressNo });
}
export function payDeposit() {
  return post<ApiResp>('/depositPay.html');
}

// ===================== 买家（需登录 key） =====================
export function getMyOrders() {
  return post<ApiResp<ShopOrderItem[]>>('/myOrders.html');
}
export function buyGoods(goodsId: number, orderSn: string, addressId = 0) {
  return post<ApiResp<{ order_id: number; order_sn: string }>>('/buy.html', {
    goods_id: goodsId,
    order_sn: orderSn,
    address_id: addressId,
  });
}
export function confirmReceipt(orderId: number) {
  return post<ApiResp>('/confirmReceipt.html', { order_id: orderId });
}
export function applyRefund(orderId: number, reason = '') {
  return post<ApiResp>('/refund.html', { order_id: orderId, refund_reason: reason });
}
export function getAddresses() {
  return post<ApiResp<AddressItem[]>>('/addressList.html');
}
export function saveAddress(data: Record<string, any>) {
  return post<ApiResp<{ id: number }>>('/addressSave.html', data);
}

/** 生成订单幂等键（前端生成，重试不重复扣费） */
export function genOrderSn(): string {
  return 'SO' + Date.now() + Math.floor(Math.random() * 1000);
}
