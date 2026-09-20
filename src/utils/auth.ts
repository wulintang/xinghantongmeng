// 用户登录态：以好道 my_member.key 为 token，存 localStorage
const TOKEN_KEY = 'xinghantongmeng_user_key';

export const getToken = (): string => localStorage.getItem(TOKEN_KEY) || '';
export const setToken = (k: string): void => {
  if (k) localStorage.setItem(TOKEN_KEY, k);
};
export const clearToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};
export const isLogin = (): boolean => !!getToken();
