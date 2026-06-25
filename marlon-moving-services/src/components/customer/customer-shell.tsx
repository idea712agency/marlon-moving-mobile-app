import { Link, Redirect, router, usePathname, type Href } from 'expo-router';
import { Bell, Box, FileText, Home, MessageSquare, UserRound } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { brand } from '@/constants/operator-brand';
import { useBrandAsset } from '@/hooks/useBrandAsset';
import { useAuth } from '@/providers/auth-provider';

const fallbackLogo = require('../../../assets/images/marlon-logo.png');

const tabs = [
  { label: 'Home', href: '/app/home' as const, Icon: Home },
  { label: 'Quote', href: '/app/quote' as const, Icon: Box },
  { label: 'Messages', href: '/app/messages' as const, Icon: MessageSquare },
  { label: 'Documents', href: '/app/documents' as const, Icon: FileText },
  { label: 'Account', href: '/app/account' as const, Icon: UserRound },
];

export function CustomerShell({
  children,
  title,
  subtitle,
  unread = 0,
  refreshing = false,
  onRefresh,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  unread?: number;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { session, loading, isAdmin } = useAuth();
  const logo = useBrandAsset('logo_primary');
  const logoSource = logo.url.startsWith('http') ? { uri: logo.url } : fallbackLogo;

  if (loading) return null;
  if (!session) return <Redirect href="/app/login" />;
  if (isAdmin) return <Redirect href="/home" />;

  return (
    <View style={{ flex: 1, backgroundColor: brand.bg }}>
      <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 18, paddingBottom: 12, backgroundColor: brand.surface, borderBottomWidth: 1, borderBottomColor: brand.border }}>
        <View style={{ minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
          <Pressable accessibilityLabel="Go to customer home" accessibilityRole="button" onPress={() => router.navigate('/app/home')} style={{ width: 78, alignItems: 'flex-start' }}>
            <Image source={logoSource} resizeMode="contain" style={{ width: 72, height: 48 }} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text numberOfLines={1} style={{ color: brand.text, fontSize: 17, fontWeight: '900' }}>Marlon Moving</Text>
            <Text numberOfLines={1} style={{ color: brand.muted, fontSize: 11, fontWeight: '800' }}>Customer Portal</Text>
          </View>
          <Link href="/notifications" asChild>
            <Pressable accessibilityLabel="Notifications" accessibilityRole="link" style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: brand.blueSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Bell color={brand.text} size={20} strokeWidth={2.4} />
              {unread > 0 ? <View style={styles.badge}><Text style={{ color: '#FFFFFF', fontSize: 8, fontWeight: '900' }}>{unread}</Text></View> : null}
            </Pressable>
          </Link>
        </View>
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        refreshControl={onRefresh ? <RefreshControl tintColor={brand.blue} refreshing={refreshing} onRefresh={onRefresh} /> : undefined}
        contentContainerStyle={{ width: '100%', maxWidth: 448, alignSelf: 'center', padding: 18, paddingBottom: insets.bottom + 104, gap: 16 }}>
        <View style={{ gap: 5 }}>
          <Text selectable style={{ color: brand.text, fontSize: 30, lineHeight: 36, fontWeight: '900', letterSpacing: -0.7 }}>{title}</Text>
          {subtitle ? <Text selectable style={{ color: brand.muted, fontSize: 15, lineHeight: 21 }}>{subtitle}</Text> : null}
        </View>
        {children}
      </ScrollView>

      <CustomerFooter bottom={insets.bottom} />
    </View>
  );
}

export function CustomerCard({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function CustomerEmpty({ title, body }: { title: string; body: string }) {
  return (
    <CustomerCard>
      <Text selectable style={{ color: brand.text, fontSize: 19, fontWeight: '900', textAlign: 'center' }}>{title}</Text>
      <Text selectable style={{ color: brand.muted, fontSize: 14, lineHeight: 20, textAlign: 'center' }}>{body}</Text>
    </CustomerCard>
  );
}

export function CustomerFooter({ bottom }: { bottom: number }) {
  const pathname = usePathname();
  return (
    <View style={{ position: 'absolute', left: 16, right: 16, bottom: Math.max(bottom, 8), maxWidth: 448, alignSelf: 'center', height: 62, borderRadius: 31, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: brand.border, flexDirection: 'row', boxShadow: '0 8px 24px rgba(7,21,47,0.15)' }}>
      {tabs.map(({ label, href, Icon }) => {
        const active = pathname === href || (href === '/app/quote' && (pathname === '/app/estimate' || pathname === '/quote/new'));
        return (
          <Link key={href} href={href as Href} asChild>
            <Pressable accessibilityLabel={label} accessibilityRole="link" accessibilityState={active ? { selected: true } : {}} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <Icon color={active ? brand.blue : brand.muted} size={17} strokeWidth={active ? 2.6 : 2.2} />
              <Text numberOfLines={1} style={{ color: active ? brand.blue : brand.muted, fontSize: 8, fontWeight: '900' }}>{label}</Text>
            </Pressable>
          </Link>
        );
      })}
    </View>
  );
}

const styles = {
  card: { backgroundColor: brand.surface, borderRadius: 20, borderCurve: 'continuous' as const, borderWidth: 1, borderColor: brand.border, padding: 16, gap: 12, boxShadow: '0 1px 2px rgba(15,23,42,0.04)' },
  badge: { position: 'absolute' as const, right: 6, top: 5, minWidth: 16, height: 16, paddingHorizontal: 3, borderRadius: 8, backgroundColor: brand.red, alignItems: 'center' as const, justifyContent: 'center' as const },
};
