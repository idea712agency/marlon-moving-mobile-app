import { ChevronRight, Mail, Phone } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { brand } from '@/constants/operator-brand';

export type CustomerListItem = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string | null;
};

export function CustomerRow({ customer, onPress }: { customer: CustomerListItem; onPress: () => void }) {
  const DetailIcon = customer.phone ? Phone : Mail;
  const detail = customer.phone ?? customer.email ?? '';

  return (
    <Pressable
      accessibilityLabel={customer.name}
      accessibilityRole="button"
      onPress={onPress}
      style={{
        minHeight: 68,
        borderRadius: 16,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: brand.border,
        paddingHorizontal: 13,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: brand.surface,
      }}>
      <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: brand.blueSoft }}>
        <Text style={{ color: brand.blue, fontSize: 16, fontWeight: '900' }}>{customer.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text selectable numberOfLines={1} style={{ color: brand.text, fontSize: 15, lineHeight: 19, fontWeight: '800' }}>
          {customer.name}
        </Text>
        {detail ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <DetailIcon color={brand.muted} size={12} strokeWidth={2.3} />
            <Text selectable numberOfLines={1} style={{ flex: 1, color: brand.muted, fontSize: 12, lineHeight: 15 }}>
              {detail}
            </Text>
          </View>
        ) : null}
      </View>
      <ChevronRight color={brand.muted} size={18} strokeWidth={2.3} />
    </Pressable>
  );
}
