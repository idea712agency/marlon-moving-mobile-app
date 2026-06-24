import { MoreHorizontal } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { brand } from '@/constants/operator-brand';

export type ScheduleJob = {
  id: string;
  job_number: string;
  scheduled_date: string;
  scheduled_start_time: string | null;
  status: string;
  origin_address: string;
  destination_address: string;
  crew_size: number | null;
  contacts: { name: string } | null;
};

type StatusPresentation = {
  label: string;
  color: string;
  backgroundColor: string;
};

export function scheduleStatus(status: string, labels: { inProgress: string; completed: string; upcoming: string }): StatusPresentation {
  if (status === 'in_progress') {
    return { label: labels.inProgress, color: brand.blue, backgroundColor: brand.blueSoft };
  }
  if (status === 'completed') {
    return { label: labels.completed, color: brand.green, backgroundColor: brand.greenSoft };
  }
  return { label: labels.upcoming, color: brand.purple, backgroundColor: brand.purpleSoft };
}

const timeLabel = (value: string | null) => {
  if (!value) return '—';
  const [hours, minutes] = value.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

export function JobRow({
  job,
  moversLabel,
  fallbackLabel,
  statusLabels,
  onPress,
  compact = false,
  dateLabel,
}: {
  job: ScheduleJob;
  moversLabel: string;
  fallbackLabel: string;
  statusLabels: { inProgress: string; completed: string; upcoming: string };
  onPress: () => void;
  compact?: boolean;
  dateLabel?: string;
}) {
  const status = scheduleStatus(job.status, statusLabels);
  const crewSize = job.crew_size ?? 0;

  return (
    <Pressable
      accessibilityLabel={job.contacts?.name ?? fallbackLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={{
        minHeight: compact ? 78 : 112,
        borderRadius: 16,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: brand.border,
        overflow: 'hidden',
        flexDirection: 'row',
        backgroundColor: brand.surface,
      }}>
      <View style={{ width: 5, backgroundColor: status.color }} />
      <View style={{ flex: 1, padding: compact ? 12 : 13, gap: compact ? 7 : 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
          <View style={{ width: compact ? 92 : 70, gap: 2 }}>
            {dateLabel ? (
              <Text selectable numberOfLines={1} style={{ color: brand.muted, fontSize: 9, fontWeight: '800' }}>
                {dateLabel}
              </Text>
            ) : null}
            <Text selectable style={{ color: brand.text, fontSize: compact ? 11 : 13, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
              {timeLabel(job.scheduled_start_time)}
            </Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text selectable numberOfLines={1} style={{ color: brand.text, fontSize: 13, fontWeight: '900' }}>
              {job.contacts?.name ?? fallbackLabel}
            </Text>
            <Text selectable numberOfLines={1} style={{ color: brand.muted, fontSize: 10, lineHeight: 14 }}>
              {compact ? `→ ${job.destination_address}` : job.origin_address}
            </Text>
            {!compact ? (
              <Text selectable numberOfLines={1} style={{ color: brand.muted, fontSize: 10, lineHeight: 14 }}>
                → {job.destination_address}
              </Text>
            ) : null}
          </View>
          <View style={{ alignItems: 'flex-end', gap: 5 }}>
            <View style={{ borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: status.backgroundColor }}>
              <Text style={{ color: status.color, fontSize: 9, fontWeight: '900' }}>{status.label}</Text>
            </View>
            {!compact ? <MoreHorizontal color={brand.muted} size={17} strokeWidth={2.3} /> : null}
          </View>
        </View>

        {!compact ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: Math.min(crewSize, 3) * 17 + 8, minWidth: 26, height: 26 }}>
              {Array.from({ length: Math.min(Math.max(crewSize, 1), 3) }).map((_, index) => (
                <View
                  key={index}
                  style={{
                    position: 'absolute',
                    left: index * 17,
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    borderWidth: 2,
                    borderColor: brand.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: [brand.blue, brand.purple, brand.green][index],
                  }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 8, fontWeight: '900' }}>{index + 1}</Text>
                </View>
              ))}
            </View>
            <Text selectable style={{ color: brand.muted, fontSize: 10, fontWeight: '800' }}>{moversLabel}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
