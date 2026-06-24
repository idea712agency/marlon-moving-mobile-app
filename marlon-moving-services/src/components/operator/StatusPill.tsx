import { Text, View } from 'react-native';

import { brand } from '@/constants/operator-brand';

const statusStyles: Record<string, { label: string; color: string; backgroundColor: string }> = {
  scheduled: { label: 'Upcoming', color: brand.blue, backgroundColor: '#E6EEFB' },
  confirmed: { label: 'Upcoming', color: brand.blue, backgroundColor: '#E6EEFB' },
  in_progress: { label: 'In Progress', color: brand.orange, backgroundColor: '#FEF3C7' },
  completed: { label: 'Completed', color: '#10B981', backgroundColor: '#D1FAE5' },
  cancelled: { label: 'Cancelled', color: '#EF4444', backgroundColor: '#FEE2E2' },
};

const titleCase = (value: string) =>
  value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export function StatusPill({ status, label }: { status: string; label?: string }) {
  const presentation = statusStyles[status] ?? {
    label: titleCase(status),
    color: brand.muted,
    backgroundColor: '#F1F5F9',
  };

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        borderRadius: 999,
        paddingHorizontal: 9,
        paddingVertical: 5,
        backgroundColor: presentation.backgroundColor,
      }}>
      <Text style={{ color: presentation.color, fontSize: 10, lineHeight: 12, fontWeight: '900' }}>{label ?? presentation.label}</Text>
    </View>
  );
}
