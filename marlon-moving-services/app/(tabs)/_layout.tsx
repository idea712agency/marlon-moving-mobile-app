import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Redirect, Tabs, router, usePathname, type Href } from 'expo-router';
import { FileText, LayoutGrid, MessageSquare, MoreHorizontal, Truck } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { brand } from '@/constants/operator-brand';
import { useAuth } from '@/providers/auth-provider';

const icons = {
  home: LayoutGrid,
  moves: Truck,
  quotes: FileText,
  messages: MessageSquare,
  more: MoreHorizontal,
} as const;

const labels = {
  home: 'Dashboard',
  moves: 'Moves',
  quotes: 'Quotes',
  messages: 'Messages',
  more: 'More',
} as const;

const navItems: Array<{ key: keyof typeof icons; href: Href }> = [
  { key: 'home', href: '/home' },
  { key: 'moves', href: '/moves' },
  { key: 'quotes', href: '/quotes' },
  { key: 'messages', href: '/messages' },
  { key: 'more', href: '/more' },
];

export default function TabsLayout() {
  const { session, isAdmin, loading } = useAuth();

  if (!loading && (!session || !isAdmin)) return <Redirect href="/auth" />;
  if (loading) return null;

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}>
      <Tabs.Screen name="home" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="moves" options={{ title: 'Moves' }} />
      <Tabs.Screen name="customers" options={{ title: 'Customers' }} />
      <Tabs.Screen name="schedule" options={{ title: 'Schedule' }} />
      <Tabs.Screen name="more" options={{ title: 'More' }} />
      <Tabs.Screen name="my-move" options={{ href: null }} />
      <Tabs.Screen name="account" options={{ href: null }} />
    </Tabs>
  );
}

function FloatingTabBar({ state, navigation, insets }: BottomTabBarProps) {
  const pathname = usePathname();

  return (
    <View
      style={{
        position: 'absolute',
        left: 24,
        right: 24,
        bottom: Math.max(insets.bottom, 10),
        height: 58,
        paddingHorizontal: 8,
        paddingVertical: 5,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: brand.surface,
        borderWidth: 1,
        borderColor: 'rgba(226,232,240,0.94)',
        borderRadius: 29,
        borderCurve: 'continuous',
        boxShadow: '0 9px 24px rgba(7,21,47,0.14)',
      }}>
      {navItems.map((item) => {
        const Icon = icons[item.key] ?? MoreHorizontal;
        const focused = pathname === item.href || (item.href === '/quotes' && pathname.startsWith('/quotes')) || (item.href === '/messages' && pathname.startsWith('/messages'));
        const color = focused ? brand.blue : brand.muted;
        const label = labels[item.key];

        const onPress = () => {
          if (!focused) router.navigate(item.href);
        };

        const onLongPress = () => {
          const route = state.routes.find((candidate) => candidate.name === item.key);
          if (route) navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        return (
          <Pressable
            key={item.key}
            accessibilityLabel={label}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            onLongPress={onLongPress}
            onPress={onPress}
            style={{ flex: 1, height: 48, alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <View
              style={{
                width: 32,
                height: 27,
                borderRadius: 11,
                borderCurve: 'continuous',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? brand.blueSoft : 'transparent',
              }}>
              <Icon size={17} color={color} strokeWidth={focused ? 2.6 : 2.25} />
            </View>
            <Text numberOfLines={1} style={{ color, fontSize: 8, lineHeight: 9, fontWeight: '800' }}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
