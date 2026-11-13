import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Tự lấy IP của máy đang chạy "expo start" (cũng là máy chạy backend) => không cần sửa tay.
// Nếu backend chạy ở máy khác, đặt biến môi trường EXPO_PUBLIC_API_URL, ví dụ:
//   EXPO_PUBLIC_API_URL=http://192.168.1.10:3000 npx expo start
const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost || '';
const host = hostUri.split(':')[0];

// Bản web: khi chạy qua Expo dev server (cổng 8081) thì gọi backend ở cổng 3000 cùng máy;
// khi backend phục vụ luôn bản web đã build thì API nằm cùng địa chỉ với trang.
function webServerUrl() {
  const { protocol, hostname, port, origin } = window.location;
  return port === '8081' ? `${protocol}//${hostname}:3000` : origin;
}

const defaultServer = Platform.OS === 'web' ? webServerUrl() : host ? `http://${host}:3000` : 'http://10.0.2.2:3000';
export const SERVER_URL = process.env.EXPO_PUBLIC_API_URL || defaultServer;
export const API_URL = `${SERVER_URL}/it4788`;

export const imageUrl = (path) => (!path ? null : path.startsWith('http') ? path : `${SERVER_URL}${path}`);
