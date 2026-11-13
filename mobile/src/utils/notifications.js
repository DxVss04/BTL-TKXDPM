import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import api from '../api';
import { daysLeft } from './format';
import { isRealtimeConnected } from './realtime';

// Hàm này chỉ chạy khi app đang mở. Nếu socket đã hiện banner thì không hiện trùng push.
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const show = !(notification.request.content.data?.realtime && isRealtimeConnected());
    return { shouldShowAlert: show, shouldShowBanner: show, shouldShowList: show, shouldPlaySound: show, shouldSetBadge: false };
  },
});

async function ensurePermission() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Nhắc nhở', importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.status === 'granted';
}

// Đăng ký push token (Expo Push) và gửi lên server. Bỏ qua lỗi khi chạy trong Expo Go / simulator.
export async function registerPush() {
  try {
    if (!(await ensurePermission()) || !Device.isDevice) return;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
    const { data } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    if (data) await api.savePushToken(data);
  } catch (e) {
    console.log('[push] Không lấy được push token (bình thường khi dùng Expo Go):', e.message);
  }
}

// Nhắc nhở cục bộ: lên lịch thông báo trước 3 ngày cho từng thực phẩm trong tủ lạnh.
// Hoạt động cả trong Expo Go nên đảm bảo luôn có nhắc nhở kể cả khi không có push từ server.
export async function scheduleExpiryReminders(items, remindDays = 3) {
  try {
    if (!(await ensurePermission())) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
    const soon = [];
    for (const it of items) {
      if (!it.food) continue;
      const left = daysLeft(it.expiredDate);
      if (left <= remindDays) { soon.push(it.food.name); continue; }
      const when = new Date(it.expiredDate);
      when.setDate(when.getDate() - remindDays);
      when.setHours(8, 0, 0, 0);
      if (when > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: { title: '⏰ Thực phẩm sắp hết hạn', body: `${it.food.name} sẽ hết hạn sau ${remindDays} ngày nữa.`, data: { screen: 'Fridge' } },
          trigger: { type: 'date', date: when },
        });
      }
    }
    return soon;
  } catch (e) {
    console.log('[notify] lỗi lên lịch:', e.message);
  }
}
