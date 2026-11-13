import { useWindowDimensions } from 'react-native';

// Từ độ rộng này (máy tính, tablet nằm ngang) dùng thanh điều hướng bên trái và chia cột
export const WIDE_BREAKPOINT = 900;
export const CONTENT_MAX_WIDTH = 1120;
export const FORM_MAX_WIDTH = 680;
export const SIDEBAR_WIDTH = 248;

export function useLayout() {
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;
  const columns = width >= 1280 ? 3 : isWide ? 2 : 1;
  return { width, isWide, columns };
}
