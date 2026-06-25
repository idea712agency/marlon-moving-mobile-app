import { Link, router, type Href, usePathname } from 'expo-router';
import {
  BookOpen,
  CalendarDays,
  FileCode2,
  FileStack,
  FileText,
  LayoutGrid,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  UserRoundSearch,
  Truck,
  Users,
  X,
} from 'lucide-react-native';
import { ReactNode, useState } from 'react';
import { Image, Modal, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WeatherStrip } from '@/components/operator/WeatherStrip';
import { brand } from '@/constants/operator-brand';
import { useBrandAsset } from '@/hooks/useBrandAsset';
import { useAuth } from '@/providers/auth-provider';

const fallbackLogo = require('../../../assets/images/icon.png');

export function AppTopBar({ unread = 0, title }: { unread?: number; title?: string }) {
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  const { signOut } = useAuth();
  const pathname = usePathname();
  const logo = useBrandAsset('logo_primary');
  const hasRemoteLogo = logo.url.startsWith('http');
  const logoSource = hasRemoteLogo ? { uri: logo.url } : fallbackLogo;

  const viewWelcome = () => {
    setMenuOpen(false);
    router.push('/welcome?preview=true');
  };

  const navigateTo = (href: Href) => {
    setMenuOpen(false);
    router.navigate(href);
  };

  const logout = async () => {
    setMenuOpen(false);
    await signOut();
    router.replace('/auth');
  };

  const goHome = () => router.navigate('/home');

  return (
    <View
      style={{
        paddingTop: insets.top + 8,
        paddingHorizontal: 12,
        paddingBottom: 8,
        backgroundColor: brand.surface,
        borderBottomWidth: 1,
        borderBottomColor: brand.border,
      }}>
      <View style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Pressable
          accessibilityLabel={unread ? `Open menu, ${unread} unread notifications` : 'Open menu'}
          accessibilityRole="button"
          onPress={() => setMenuOpen(true)}
          style={{ width: 42, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Menu color={brand.text} size={27} strokeWidth={2.5} />
        </Pressable>

        <WeatherStrip />

        <Pressable
          accessibilityLabel="Go to dashboard"
          accessibilityRole="button"
          onPress={goHome}
          style={{ width: 68, minHeight: 48, alignItems: 'flex-end', justifyContent: 'center' }}>
          <Image
            source={logoSource}
            accessibilityLabel={logo.alt_text ?? title ?? 'Marlon Moving Services'}
            resizeMode="contain"
            style={{ height: 48, width: hasRemoteLogo ? 68 : 48 }}
          />
        </Pressable>
      </View>
      <OperatorMenu
        visible={menuOpen}
        pathname={pathname}
        onClose={() => setMenuOpen(false)}
        onNavigate={navigateTo}
        onViewWelcome={viewWelcome}
        onSignOut={logout}
      />
    </View>
  );
}

function OperatorMenu({
  visible,
  pathname,
  onClose,
  onNavigate,
  onViewWelcome,
  onSignOut,
}: {
  visible: boolean;
  pathname: string;
  onClose: () => void;
  onNavigate: (href: Href) => void;
  onViewWelcome: () => void;
  onSignOut: () => void;
}) {
  const pages = [
    { label: 'Dashboard', href: '/home' as const, Icon: LayoutGrid },
    { label: 'Moves', href: '/moves' as const, Icon: Truck },
    { label: 'Customers', href: '/customers' as const, Icon: Users },
    { label: 'Schedule', href: '/schedule' as const, Icon: CalendarDays },
    { label: 'More', href: '/more' as const, Icon: MoreHorizontal },
    { label: 'Quotes', href: '/quotes' as const, Icon: FileText },
    { label: 'Leads', href: '/leads' as const, Icon: UserRoundSearch },
    { label: 'Documents', href: '/documents' as const, Icon: FileStack },
    { label: 'Templates', href: '/templates' as const, Icon: FileCode2 },
  ];

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <Pressable
          accessibilityLabel="Close menu"
          accessibilityRole="button"
          onPress={onClose}
          style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(7,21,47,0.28)' }}
        />
        <View
          style={{
            marginTop: 80,
            marginHorizontal: 18,
            backgroundColor: brand.surface,
            borderRadius: 22,
            borderCurve: 'continuous',
            borderWidth: 1,
            borderColor: brand.border,
            padding: 14,
            gap: 8,
            boxShadow: '0 18px 42px rgba(7,21,47,0.18)',
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, paddingBottom: 6 }}>
            <View>
              <Text style={{ color: brand.text, fontSize: 18, fontWeight: '900' }}>Operator Menu</Text>
              <Text style={{ color: brand.muted, fontSize: 12, fontWeight: '700' }}>Marlon Moving Services</Text>
            </View>
            <Pressable accessibilityLabel="Close menu" accessibilityRole="button" onPress={onClose} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
              <X color={brand.muted} size={20} strokeWidth={2.4} />
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {pages.map(({ label, href, Icon }) => {
              const active = pathname === href;
              return (
                <MenuRow
                  key={href}
                  compact
                  active={active}
                  icon={<Icon color={active ? '#FFFFFF' : brand.blue} size={19} strokeWidth={2.4} />}
                  label={label}
                  onPress={() => onNavigate(href)}
                />
              );
            })}
          </View>

          <View style={{ height: 1, marginVertical: 3, backgroundColor: brand.border }} />
          <MenuRow icon={<BookOpen color={brand.blue} size={20} strokeWidth={2.4} />} label="View welcome pages" onPress={onViewWelcome} />
          <MenuRow icon={<LogOut color={brand.red} size={20} strokeWidth={2.4} />} label="Sign out" danger onPress={onSignOut} />
        </View>
      </View>
    </Modal>
  );
}

function MenuRow({
  icon,
  label,
  danger,
  compact,
  active,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  danger?: boolean;
  compact?: boolean;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={{
        width: compact ? '31.5%' : undefined,
        minHeight: compact ? 74 : 54,
        borderRadius: 15,
        paddingHorizontal: compact ? 7 : 12,
        flexDirection: compact ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: compact ? 'center' : undefined,
        gap: 12,
        backgroundColor: danger ? brand.redSoft : active ? brand.blue : brand.blueSoft,
      }}>
      {icon}
      <Text
        numberOfLines={compact ? 1 : undefined}
        style={{
          color: danger ? brand.red : active ? '#FFFFFF' : brand.text,
          fontSize: compact ? 10 : 15,
          fontWeight: '900',
          textAlign: compact ? 'center' : undefined,
        }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function OperatorScreen({
  children,
  unread = 0,
  refreshing = false,
  onRefresh,
  footer,
}: {
  children: ReactNode;
  unread?: number;
  refreshing?: boolean;
  onRefresh?: () => void;
  footer?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const isTabRoute = ['/home', '/moves', '/customers', '/schedule', '/more'].includes(pathname);
  const showOperatorFooter = !isTabRoute;
  const footerBottomPadding = footer && showOperatorFooter ? 220 : footer || showOperatorFooter ? 150 : 108;

  return (
    <View style={{ flex: 1, backgroundColor: brand.bg }}>
      <AppTopBar unread={unread} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        refreshControl={onRefresh ? <RefreshControl tintColor={brand.blue} refreshing={refreshing} onRefresh={onRefresh} /> : undefined}
        contentContainerStyle={{ padding: 18, paddingBottom: insets.bottom + footerBottomPadding, gap: 16 }}>
        {children}
      </ScrollView>
      {footer || showOperatorFooter ? (
        <View
          style={{
            position: 'absolute',
            left: 18,
            right: 18,
            bottom: insets.bottom + 8,
            maxWidth: 448,
            alignSelf: 'center',
            gap: 8,
          }}>
          {footer}
          {showOperatorFooter ? <OperatorBottomNav /> : null}
        </View>
      ) : null}
    </View>
  );
}

function OperatorBottomNav() {
  const pathname = usePathname();
  const pages = [
    { label: 'Dashboard', href: '/home' as const, Icon: LayoutGrid },
    { label: 'Moves', href: '/moves' as const, Icon: Truck },
    { label: 'Customers', href: '/customers' as const, Icon: Users },
    { label: 'Schedule', href: '/schedule' as const, Icon: CalendarDays },
    { label: 'More', href: '/more' as const, Icon: MoreHorizontal },
  ];

  return (
    <View
      style={{
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
      {pages.map(({ label, href, Icon }) => {
        const active = pathname === href;
        const color = active ? brand.blue : brand.muted;
        return (
          <Pressable
            key={href}
            accessibilityLabel={label}
            accessibilityRole="button"
            accessibilityState={active ? { selected: true } : {}}
            onPress={() => router.navigate(href)}
            style={{ flex: 1, height: 48, alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <View
              style={{
                width: 32,
                height: 27,
                borderRadius: 11,
                borderCurve: 'continuous',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: active ? brand.blueSoft : 'transparent',
              }}>
              <Icon size={17} color={color} strokeWidth={active ? 2.6 : 2.25} />
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

export function OperatorCard({ children }: { children: ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: brand.surface,
        borderRadius: 18,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: brand.border,
        padding: 16,
        gap: 12,
        boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
      }}>
      {children}
    </View>
  );
}

export function OperatorPageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text selectable style={{ color: brand.text, fontSize: 28, lineHeight: 34, fontWeight: '900', letterSpacing: -0.7 }}>
        {title}
      </Text>
      <Text selectable style={{ color: brand.muted, fontSize: 15, lineHeight: 21 }}>
        {subtitle}
      </Text>
    </View>
  );
}

export function PlaceholderScreen({
  title,
  subtitle,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  subtitle: string;
  ctaLabel?: string;
  ctaHref?: Href;
}) {
  return (
    <OperatorScreen>
      <OperatorPageHeader title={title} subtitle={subtitle} />
      <OperatorCard>
        <Text selectable style={{ color: brand.text, fontSize: 17, fontWeight: '900' }}>
          Ready for the next PR
        </Text>
        <Text selectable style={{ color: brand.muted, fontSize: 14, lineHeight: 20 }}>
          This route is wired into the operator shell. Data queries and mutations will be added in the dedicated feature PR so backend behavior stays easy to review.
        </Text>
        {ctaHref && ctaLabel ? (
          <Link href={ctaHref} asChild>
            <Pressable
              accessibilityLabel={ctaLabel}
              accessibilityRole="button"
              style={{
                height: 48,
                borderRadius: 12,
                backgroundColor: brand.blue,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
              }}>
              <Plus color="#FFFFFF" size={18} strokeWidth={2.5} />
              <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 15 }}>{ctaLabel}</Text>
            </Pressable>
          </Link>
        ) : null}
      </OperatorCard>
    </OperatorScreen>
  );
}
