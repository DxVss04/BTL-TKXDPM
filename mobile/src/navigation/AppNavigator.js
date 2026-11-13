import React, { useState } from 'react';
import { Platform, View } from 'react-native';
import { NavigationContainer, DefaultTheme, StackActions, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { notificationTarget, useNotifications } from '../context/NotificationContext';
import { Loading } from '../components/ui';
import NotificationBanner from '../components/NotificationBanner';
import Sidebar from '../components/Sidebar';
import { useLayout } from '../utils/layout';
import { colors } from '../theme';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import VerifyScreen from '../screens/auth/VerifyScreen';
import HomeScreen from '../screens/home/HomeScreen';
import FridgeScreen from '../screens/fridge/FridgeScreen';
import FridgeFormScreen from '../screens/fridge/FridgeFormScreen';
import FoodListScreen from '../screens/food/FoodListScreen';
import FoodFormScreen from '../screens/food/FoodFormScreen';
import ShoppingListsScreen from '../screens/shopping/ShoppingListsScreen';
import ShoppingFormScreen from '../screens/shopping/ShoppingFormScreen';
import ShoppingDetailScreen from '../screens/shopping/ShoppingDetailScreen';
import MealPlanScreen from '../screens/meal/MealPlanScreen';
import MealFormScreen from '../screens/meal/MealFormScreen';
import RecipeListScreen from '../screens/recipe/RecipeListScreen';
import RecipeDetailScreen from '../screens/recipe/RecipeDetailScreen';
import RecipeFormScreen from '../screens/recipe/RecipeFormScreen';
import SuggestScreen from '../screens/recipe/SuggestScreen';
import GroupScreen from '../screens/group/GroupScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';
import StatsScreen from '../screens/stats/StatsScreen';
import AdminScreen from '../screens/admin/AdminScreen';
import NotificationsScreen from '../screens/notification/NotificationsScreen';
import ChatScreen from '../screens/chat/ChatScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const navigationRef = createNavigationContainerRef();

function openNotification(data) {
  const target = notificationTarget(data);
  if (target && navigationRef.isReady()) navigationRef.navigate(...target);
}

// Màn hình đang hiển thị (đi sâu vào các bộ điều hướng lồng nhau)
function focusedRouteName(state) {
  let route = state?.routes?.[state.index ?? 0];
  while (route?.state) route = route.state.routes[route.state.index ?? 0];
  return route?.name === 'Tabs' ? 'Home' : route?.name;
}

function selectTab(name) {
  if (!navigationRef.isReady()) return;
  if (navigationRef.getRootState().index > 0) navigationRef.dispatch(StackActions.popToTop());
  navigationRef.navigate('Tabs', { screen: name });
}

function openScreen(name) {
  if (navigationRef.isReady()) navigationRef.navigate(name);
}

const badgeStyle ={ backgroundColor: colors.danger, color: '#fff', fontSize: 11 };

const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, primary: colors.primary, background: colors.bg } };
const headerOpts = { headerTintColor: colors.text, headerTitleStyle: { fontWeight: '700' }, headerShadowVisible: false, headerStyle: { backgroundColor: colors.bg } };

const TAB_ICONS = { Home: 'home', Fridge: 'snow', Shopping: 'cart', Meal: 'restaurant', Profile: 'person' };

function Tabs() {
  const { unread } = useNotifications();
  const badge = (type) => unread.filter((n) => n.data?.type === type).length || undefined;
  const { isWide } = useLayout();
  return (
    <Tab.Navigator
      // Màn hình rộng dùng Sidebar thay cho thanh tab dưới đáy
      tabBar={isWide ? () => null : undefined}
      screenOptions={({ route }) => ({
        ...headerOpts,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarBadgeStyle: badgeStyle,
        ...(Platform.OS === 'web' ? { tabBarStyle: { height: 62, paddingBottom: 8 } } : null),
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons name={focused ? TAB_ICONS[route.name] : `${TAB_ICONS[route.name]}-outline`} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Trang chủ', headerShown: false }} />
      <Tab.Screen name="Fridge" component={FridgeScreen} options={{ title: 'Tủ lạnh', tabBarBadge: badge('fridge') }} />
      <Tab.Screen name="Shopping" component={ShoppingListsScreen} options={{ title: 'Đi chợ', tabBarBadge: badge('shopping') }} />
      <Tab.Screen name="Meal" component={MealPlanScreen} options={{ title: 'Bữa ăn', tabBarBadge: badge('meal') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Cá nhân' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, booting } = useAuth();
  const { isWide } = useLayout();
  const [active, setActive] = useState('Home');
  const syncActive = () => setActive(focusedRouteName(navigationRef.getRootState()));
  if (booting) return <Loading />;

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
    {user && isWide && <Sidebar active={active} onSelectTab={selectTab} onOpenScreen={openScreen} />}
    <View style={{ flex: 1 }}>
    <NavigationContainer ref={navigationRef} theme={theme} onReady={syncActive} onStateChange={syncActive} documentTitle={{ formatter: () => 'Đi chợ tiện lợi' }}>
      <Stack.Navigator screenOptions={{ ...headerOpts, headerBackTitle: 'Quay lại' }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Đăng ký' }} />
            <Stack.Screen name="Verify" component={VerifyScreen} options={{ title: 'Xác minh email' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
            <Stack.Screen name="FridgeForm" component={FridgeFormScreen} options={{ title: 'Tủ lạnh' }} />
            <Stack.Screen name="FoodList" component={FoodListScreen} options={{ title: 'Thực phẩm của nhóm' }} />
            <Stack.Screen name="FoodForm" component={FoodFormScreen} options={{ title: 'Thực phẩm' }} />
            <Stack.Screen name="ShoppingForm" component={ShoppingFormScreen} options={{ title: 'Danh sách mua sắm' }} />
            <Stack.Screen name="ShoppingDetail" component={ShoppingDetailScreen} options={{ title: 'Danh sách' }} />
            <Stack.Screen name="MealForm" component={MealFormScreen} options={{ title: 'Bữa ăn' }} />
            <Stack.Screen name="RecipeList" component={RecipeListScreen} options={{ title: 'Công thức nấu ăn' }} />
            <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{ title: 'Công thức' }} />
            <Stack.Screen name="RecipeForm" component={RecipeFormScreen} options={{ title: 'Công thức' }} />
            <Stack.Screen name="Suggest" component={SuggestScreen} options={{ title: 'Gợi ý món ăn' }} />
            <Stack.Screen name="Group" component={GroupScreen} options={{ title: 'Nhóm gia đình' }} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Sửa hồ sơ' }} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Đổi mật khẩu' }} />
            <Stack.Screen name="Stats" component={StatsScreen} options={{ title: 'Thống kê' }} />
            <Stack.Screen name="Admin" component={AdminScreen} options={{ title: 'Quản trị hệ thống' }} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Thông báo' }} />
            <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Trợ lý AI - Bếp Nhỏ' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
    {user && <NotificationBanner onOpen={openNotification} />}
    </View>
    </View>
  );
}
