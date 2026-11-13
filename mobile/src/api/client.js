import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

export const TOKEN_KEY = 'accessToken';
export const REFRESH_KEY = 'refreshToken';

const client = axios.create({ baseURL: API_URL, timeout: 15000 });

let onAuthFailed = () => {};
export const setOnAuthFailed = (fn) => { onAuthFailed = fn; };

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Tự động làm mới access token khi hết hạn (mã 00011 / 00012) rồi gửi lại request
let refreshing = null;
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const code = error.response?.data?.resultCode;
    if (error.response?.status === 401 && (code === '00011' || code === '00012') && !original._retry) {
      original._retry = true;
      try {
        if (!refreshing) {
          refreshing = (async () => {
            const rt = await AsyncStorage.getItem(REFRESH_KEY);
            if (!rt) throw new Error('no refresh token');
            const { data } = await axios.post(`${API_URL}/user/refresh-token`, { refreshToken: rt });
            await AsyncStorage.multiSet([[TOKEN_KEY, data.accessToken], [REFRESH_KEY, data.refreshToken]]);
            return data.accessToken;
          })().finally(() => { setTimeout(() => { refreshing = null; }, 0); });
        }
        const token = await refreshing;
        original.headers.Authorization = `Bearer ${token}`;
        return client(original);
      } catch (e) {
        onAuthFailed();
      }
    }
    return Promise.reject(error);
  }
);

// Lấy thông báo lỗi tiếng Việt từ response của server
export const errMsg = (e) =>
  e?.response?.data?.resultMessage?.vn ||
  (e?.message === 'Network Error' ? 'Không kết nối được máy chủ. Kiểm tra backend và mạng Wi-Fi.' : e?.message) ||
  'Đã có lỗi xảy ra';

export const errCode = (e) => e?.response?.data?.resultCode;

export default client;
