import { Link } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { ReactNode } from 'react';
import type { ColorValue } from 'react-native';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { colors, layout } from '@/constants/theme';

export function Icon({
  ios,
  android,
  size = 22,
  color = colors.primary,
}: {
  ios: string;
  android?: string;
  size?: number;
  color?: ColorValue;
}) {
  return (
    <SymbolView
      name={{ ios, android: android ?? 'circle' } as never}
      size={size}
      tintColor={color}
      fallback={<Text style={{ color, fontSize: size }}>●</Text>}
    />
  );
}

export function Card({ children, style }: { children: ReactNode; style?: object }) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.white,
          borderRadius: layout.radius,
          borderCurve: 'continuous',
          borderWidth: 1,
          borderColor: colors.border,
          padding: layout.card,
          gap: 16,
          boxShadow: '0 5px 18px rgba(7, 21, 47, 0.06)',
        },
        style,
      ]}>
      {children}
    </View>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text selectable style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>
        {title}
      </Text>
      {action ? (
        <Text selectable style={{ color: colors.primary, fontSize: 14, fontWeight: '700' }}>
          {action}
        </Text>
      ) : null}
    </View>
  );
}

export function PrimaryButton({
  label,
  href,
  icon,
  onPress,
  secondary,
}: {
  label: string;
  href?: string;
  icon?: ReactNode;
  onPress?: () => void;
  secondary?: boolean;
}) {
  const button = (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        height: layout.buttonHeight,
        borderRadius: 14,
        borderCurve: 'continuous',
        backgroundColor: secondary ? colors.paleBlue : colors.navy,
        borderWidth: secondary ? 1 : 0,
        borderColor: colors.primary,
        paddingHorizontal: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        opacity: pressed ? 0.78 : 1,
      })}>
      <Text
        selectable
        style={{ color: secondary ? colors.primary : colors.white, fontSize: 16, fontWeight: '800' }}>
        {label}
      </Text>
      {icon}
    </Pressable>
  );
  return href ? (
    <Link href={href as never} asChild>
      {button}
    </Link>
  ) : (
    button
  );
}

export function NotificationBadge({ count = 2 }: { count?: number }) {
  return (
    <View
      style={{
        minWidth: 18,
        height: 18,
        paddingHorizontal: 4,
        borderRadius: 9,
        backgroundColor: colors.danger,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: colors.white,
      }}>
      <Text style={{ color: colors.white, fontSize: 10, fontWeight: '900' }}>{count}</Text>
    </View>
  );
}

export function AppHeader({ name = 'there', unread = 0 }: { name?: string; unread?: number }) {
  return (
    <View style={{ gap: 22 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Pressable hitSlop={12}>
          <Icon ios="line.3.horizontal" android="menu" color={colors.text} />
        </Pressable>
        <View style={{ alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: colors.navy,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Icon ios="truck.box.fill" android="local_shipping" size={21} color={colors.white} />
            </View>
            <View>
              <Text style={{ color: colors.navy, fontSize: 15, fontWeight: '900' }}>MARLON</Text>
              <Text style={{ color: colors.primary, fontSize: 9, fontWeight: '800', letterSpacing: 1 }}>
                MOVING SERVICES
              </Text>
            </View>
          </View>
        </View>
        <Link href="/notifications" asChild>
          <Pressable hitSlop={12} style={{ width: 28, height: 28 }}>
            <Icon ios="bell.fill" android="notifications" color={colors.text} />
            {unread > 0 ? <View style={{ position: 'absolute', right: -6, top: -6 }}><NotificationBadge count={unread} /></View> : null}
          </Pressable>
        </Link>
      </View>
      <View style={{ gap: 5 }}>
        <Text selectable style={{ color: colors.text, fontSize: 30, fontWeight: '900' }}>
          Good morning, {name}!
        </Text>
        <Text selectable style={{ color: colors.muted, fontSize: 15 }}>
          Here’s what’s happening with your move.
        </Text>
      </View>
    </View>
  );
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={{ paddingVertical: 70, alignItems: 'center', gap: 12 }}>
      <ActivityIndicator color={colors.primary} />
      <Text selectable style={{ color: colors.muted }}>{label}</Text>
    </View>
  );
}

export function EmptyState({
  title,
  body,
  icon = <Icon ios="link.badge.plus" android="link" size={28} />,
}: {
  title: string;
  body: string;
  icon?: ReactNode;
}) {
  return (
    <Card style={{ alignItems: 'center', paddingVertical: 34 }}>
      <View style={{ width: 58, height: 58, borderRadius: 19, backgroundColor: colors.paleBlue, alignItems: 'center', justifyContent: 'center' }}>{icon}</View>
      <Text selectable style={{ color: colors.text, fontSize: 20, fontWeight: '900', textAlign: 'center' }}>{title}</Text>
      <Text selectable style={{ color: colors.muted, lineHeight: 21, textAlign: 'center' }}>{body}</Text>
    </Card>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card style={{ alignItems: 'center' }}>
      <Icon ios="exclamationmark.triangle.fill" android="warning" color={colors.danger} size={28} />
      <Text selectable style={{ color: colors.danger, textAlign: 'center', lineHeight: 21 }}>{message}</Text>
      {onRetry ? <PrimaryButton label="Try Again" secondary onPress={onRetry} /> : null}
    </Card>
  );
}

export function QuickActionCard({
  label,
  href,
  ios,
  android,
}: {
  label: string;
  href: string;
  ios: string;
  android: string;
}) {
  return (
    <Link href={href as never} asChild>
      <Pressable
        style={({ pressed }) => ({
          width: '47.5%',
          minHeight: 118,
          borderRadius: 17,
          borderCurve: 'continuous',
          backgroundColor: colors.white,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          boxShadow: '0 5px 16px rgba(7, 21, 47, 0.06)',
          opacity: pressed ? 0.72 : 1,
        })}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 13,
            backgroundColor: colors.paleBlue,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Icon ios={ios} android={android} size={24} />
        </View>
        <Text
          selectable
          style={{ color: colors.text, fontSize: 14, fontWeight: '700', textAlign: 'center' }}>
          {label}
        </Text>
      </Pressable>
    </Link>
  );
}

export function DetailRow({
  icon,
  label,
  value,
  accent,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
      {icon ? (
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: colors.paleBlue,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {icon}
        </View>
      ) : null}
      <View style={{ flex: 1, gap: 3 }}>
        <Text selectable style={{ color: colors.muted, fontSize: 12, fontWeight: '700' }}>
          {label}
        </Text>
        <Text selectable style={{ color: accent ?? colors.text, fontSize: 15, fontWeight: '700' }}>
          {value}
        </Text>
      </View>
    </View>
  );
}
