import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { brand } from '@/constants/operator-brand';

export type ScheduleDay = {
  date: string;
  dateValue: Date;
  isToday: boolean;
};

type WeekStripProps = {
  days: ScheduleDay[];
  locale: string;
  selectedDate: string;
  todayLabel: string;
  previousLabel: string;
  nextLabel: string;
  onPrevious: () => void;
  onNext: () => void;
  onSelect: (date: string) => void;
};

export function WeekStrip({
  days,
  locale,
  selectedDate,
  todayLabel,
  previousLabel,
  nextLabel,
  onPrevious,
  onNext,
  onSelect,
}: WeekStripProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <Pressable
        accessibilityLabel={previousLabel}
        accessibilityRole="button"
        onPress={onPrevious}
        style={{ width: 32, height: 42, alignItems: 'center', justifyContent: 'center' }}>
        <ChevronLeft color={brand.navy} size={20} strokeWidth={2.5} />
      </Pressable>

      <ScrollView
        horizontal
        bounces={false}
        contentContainerStyle={{ flexGrow: 1, gap: 5 }}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}>
        {days.map((day) => {
          const selected = day.date === selectedDate;
          const weekday = day.isToday
            ? todayLabel
            : day.dateValue.toLocaleDateString(locale, { weekday: 'short' }).replace('.', '');
          const dateLabel = day.dateValue.toLocaleDateString(locale, { month: 'short', day: 'numeric' }).replace('.', '');

          return (
            <Pressable
              key={day.date}
              accessibilityLabel={`${weekday}, ${dateLabel}`}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onSelect(day.date)}
              style={{
                flex: 1,
                minWidth: 58,
                minHeight: 58,
                borderRadius: 16,
                borderCurve: 'continuous',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                backgroundColor: selected ? brand.blueSoft : brand.surface,
                borderWidth: 1,
                borderColor: selected ? '#CFE0FC' : brand.border,
              }}>
              <Text numberOfLines={1} style={{ color: selected ? brand.blue : brand.muted, fontSize: 9, fontWeight: '900' }}>
                {weekday}
              </Text>
              <Text style={{ color: selected ? brand.blue : brand.text, fontSize: 11, fontWeight: '900' }}>{dateLabel}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Pressable
        accessibilityLabel={nextLabel}
        accessibilityRole="button"
        onPress={onNext}
        style={{ width: 32, height: 42, alignItems: 'center', justifyContent: 'center' }}>
        <ChevronRight color={brand.navy} size={20} strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}
