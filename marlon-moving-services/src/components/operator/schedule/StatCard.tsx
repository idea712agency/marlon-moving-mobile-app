import type { LucideIcon } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { brand } from '@/constants/operator-brand';

export function StatCard({
  label,
  value,
  color,
  backgroundColor,
  Icon,
}: {
  label: string;
  value: number;
  color: string;
  backgroundColor: string;
  Icon: LucideIcon;
}) {
  return (
    <View
      style={{
        flex: 1,
        minHeight: 108,
        borderRadius: 18,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: brand.border,
        padding: 13,
        justifyContent: 'space-between',
        backgroundColor: brand.surface,
        boxShadow: '0 2px 8px rgba(7,21,47,0.05)',
      }}>
      <View style={{ width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor }}>
        <Icon color={color} size={18} strokeWidth={2.4} />
      </View>
      <View style={{ gap: 1 }}>
        <Text selectable style={{ color: brand.text, fontSize: 23, lineHeight: 27, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
          {value}
        </Text>
        <Text numberOfLines={1} style={{ color: brand.muted, fontSize: 10, lineHeight: 13, fontWeight: '800' }}>
          {label}
        </Text>
      </View>
    </View>
  );
}
