import { router } from 'expo-router';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  Filter,
  MapPin,
  Plus,
  Truck,
  Users,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppTopBar } from '@/components/operator/app-shell';
import { JobRow } from '@/components/operator/schedule/JobRow';
import { StatCard } from '@/components/operator/schedule/StatCard';
import { type ScheduleDay, WeekStrip } from '@/components/operator/schedule/WeekStrip';
import { brand } from '@/constants/operator-brand';
import { useScheduleJobs } from '@/hooks/use-schedule-jobs';

const toLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const fromLocalDate = (value: string) => new Date(`${value}T12:00:00`);

const addDays = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

export default function ScheduleScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const today = useMemo(() => new Date(), []);
  const todayKey = toLocalDate(today);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const locale = i18n.language.startsWith('es') ? 'es-US' : 'en-US';

  const days = useMemo<ScheduleDay[]>(() => {
    const start = addDays(today, weekOffset * 7);
    return Array.from({ length: 7 }, (_, index) => {
      const dateValue = addDays(start, index);
      const date = toLocalDate(dateValue);
      return { date, dateValue, isToday: date === todayKey };
    });
  }, [today, todayKey, weekOffset]);

  const rangeStart = days[0].date;
  const rangeEnd = toLocalDate(addDays(days[0].dateValue, 13));
  const scheduleQuery = useScheduleJobs(rangeStart, rangeEnd);
  const jobs = scheduleQuery.data ?? [];
  const selectedJobs = jobs.filter((job) => job.scheduled_date === selectedDate);
  const upcomingEnd = toLocalDate(addDays(today, 7));
  const upcomingJobs = jobs.filter((job) => job.scheduled_date > todayKey && job.scheduled_date <= upcomingEnd);
  const selectedDateLabel = fromLocalDate(selectedDate).toLocaleDateString(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const statusLabels = {
    inProgress: t('schedule.status.inProgress'),
    completed: t('schedule.status.completed'),
    upcoming: t('schedule.status.upcoming'),
  };

  const changeWeek = (amount: number) => {
    const nextOffset = weekOffset + amount;
    setWeekOffset(nextOffset);
    setSelectedDate(toLocalDate(addDays(today, nextOffset * 7)));
  };

  return (
    <View style={{ flex: 1, backgroundColor: brand.bg }}>
      <AppTopBar />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 18, paddingBottom: insets.bottom + 108, gap: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          <View style={{ flex: 1, gap: 5 }}>
            <Text selectable style={{ color: brand.text, fontSize: 28, lineHeight: 33, fontWeight: '900', letterSpacing: -0.7 }}>
              {t('schedule.title')}
            </Text>
            <Text selectable style={{ color: brand.muted, fontSize: 13, lineHeight: 18 }}>
              {t('schedule.subtitle')}
            </Text>
          </View>
          <Pressable
            accessibilityLabel={t('schedule.addMove')}
            accessibilityRole="button"
            onPress={() => router.push('/jobs/new')}
            style={{
              minHeight: 40,
              borderRadius: 12,
              borderCurve: 'continuous',
              paddingHorizontal: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              backgroundColor: brand.blue,
            }}>
            <Plus color="#FFFFFF" size={15} strokeWidth={2.7} />
            <Text numberOfLines={1} style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '900' }}>
              {t('schedule.addMove')}
            </Text>
          </Pressable>
        </View>

        <WeekStrip
          days={days}
          locale={locale}
          selectedDate={selectedDate}
          todayLabel={t('schedule.today')}
          previousLabel={t('schedule.previousWeek')}
          nextLabel={t('schedule.nextWeek')}
          onPrevious={() => changeWeek(-1)}
          onNext={() => changeWeek(1)}
          onSelect={setSelectedDate}
        />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <FilterPill label={t('schedule.filters.statuses')} Icon={CheckCircle2} />
          <FilterPill label={t('schedule.filters.crews')} Icon={Users} />
          <FilterPill label={t('schedule.filters.locations')} Icon={MapPin} />
          <FilterPill label={t('schedule.filters.more')} Icon={Filter} />
        </View>

        <View style={{ gap: 9 }}>
          <View style={{ flexDirection: 'row', gap: 9 }}>
            <StatCard
              label={t('schedule.stats.total')}
              value={selectedJobs.length}
              color={brand.blue}
              backgroundColor={brand.blueSoft}
              Icon={CalendarDays}
            />
            <StatCard
              label={t('schedule.stats.inProgress')}
              value={selectedJobs.filter((job) => job.status === 'in_progress').length}
              color={brand.orange}
              backgroundColor={brand.orangeSoft}
              Icon={Truck}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 9 }}>
            <StatCard
              label={t('schedule.stats.completed')}
              value={selectedJobs.filter((job) => job.status === 'completed').length}
              color={brand.green}
              backgroundColor={brand.greenSoft}
              Icon={CheckCircle2}
            />
            <StatCard
              label={t('schedule.stats.upcoming')}
              value={upcomingJobs.length}
              color={brand.purple}
              backgroundColor={brand.purpleSoft}
              Icon={Clock3}
            />
          </View>
        </View>

        {scheduleQuery.isLoading ? (
          <View style={{ minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <ActivityIndicator color={brand.blue} size="large" />
            <Text style={{ color: brand.muted, fontSize: 12, fontWeight: '800' }}>{t('schedule.loading')}</Text>
          </View>
        ) : scheduleQuery.error ? (
          <View style={{ borderRadius: 16, padding: 16, gap: 10, backgroundColor: brand.redSoft }}>
            <Text selectable style={{ color: brand.red, fontSize: 13, fontWeight: '900' }}>{t('schedule.loadError')}</Text>
            <Pressable accessibilityRole="button" onPress={() => void scheduleQuery.refetch()}>
              <Text style={{ color: brand.blue, fontSize: 12, fontWeight: '900' }}>{t('schedule.retry')}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={{ gap: 10 }}>
              <Text selectable style={{ color: brand.text, fontSize: 17, fontWeight: '900' }}>
                {t(selectedDate === todayKey ? 'schedule.todaySection' : 'schedule.selectedSection', { date: selectedDateLabel })}
              </Text>
              {selectedJobs.length ? (
                selectedJobs.map((job) => (
                  <JobRow
                    key={job.id}
                    job={job}
                    moversLabel={t('schedule.movers', { count: job.crew_size ?? 0 })}
                    fallbackLabel={t('schedule.jobFallback', { number: job.job_number })}
                    statusLabels={statusLabels}
                    onPress={() => router.push(`/moves/${job.id}`)}
                  />
                ))
              ) : (
                <View
                  style={{
                    minHeight: 110,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: brand.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: brand.surface,
                  }}>
                  <Text selectable style={{ color: brand.muted, fontSize: 13, fontWeight: '800' }}>{t('schedule.noMoves')}</Text>
                </View>
              )}
            </View>

            <View style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <Text selectable style={{ flex: 1, color: brand.text, fontSize: 17, fontWeight: '900' }}>
                  {t('schedule.upcomingSection')}
                </Text>
                <Pressable accessibilityRole="button">
                  <Text style={{ color: brand.blue, fontSize: 11, fontWeight: '900' }}>
                    {t('schedule.viewAll', { count: upcomingJobs.length })}
                  </Text>
                </Pressable>
              </View>
              {upcomingJobs.slice(0, 3).map((job) => (
                <JobRow
                  compact
                  key={job.id}
                  job={job}
                  dateLabel={fromLocalDate(job.scheduled_date)
                    .toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' })
                    .replaceAll('.', '')}
                  moversLabel={t('schedule.movers', { count: job.crew_size ?? 0 })}
                  fallbackLabel={t('schedule.jobFallback', { number: job.job_number })}
                  statusLabels={statusLabels}
                  onPress={() => router.push(`/moves/${job.id}`)}
                />
              ))}
              {!upcomingJobs.length ? (
                <Text selectable style={{ color: brand.muted, fontSize: 12, fontWeight: '700' }}>{t('schedule.noMoves')}</Text>
              ) : null}
            </View>
          </>
        )}

        <View
          style={{
            borderRadius: 18,
            borderCurve: 'continuous',
            borderWidth: 1,
            borderColor: brand.border,
            padding: 14,
            gap: 12,
            backgroundColor: brand.surface,
          }}>
          <Text selectable style={{ color: brand.text, fontSize: 15, fontWeight: '900' }}>{t('schedule.quickActions.title')}</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <QuickAction label={t('schedule.quickActions.calendar')} Icon={CalendarDays} />
            <QuickAction label={t('schedule.quickActions.dispatch')} Icon={Truck} />
            <QuickAction label={t('schedule.quickActions.crew')} Icon={Users} />
            <QuickAction label={t('schedule.quickActions.export')} Icon={Download} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function FilterPill({ label, Icon }: { label: string; Icon: typeof Filter }) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      style={{
        width: '48.5%',
        minHeight: 38,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: brand.border,
        paddingHorizontal: 11,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: brand.surface,
      }}>
      <Icon color={brand.muted} size={14} strokeWidth={2.3} />
      <Text numberOfLines={1} style={{ flex: 1, color: brand.muted, fontSize: 10, fontWeight: '800' }}>{label}</Text>
    </Pressable>
  );
}

function QuickAction({ label, Icon }: { label: string; Icon: typeof CalendarDays }) {
  return (
    <Pressable accessibilityLabel={label} accessibilityRole="button" style={{ flex: 1, alignItems: 'center', gap: 6 }}>
      <View style={{ width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: brand.blueSoft }}>
        <Icon color={brand.blue} size={18} strokeWidth={2.3} />
      </View>
      <Text numberOfLines={2} style={{ color: brand.muted, fontSize: 8, lineHeight: 10, fontWeight: '800', textAlign: 'center' }}>{label}</Text>
    </Pressable>
  );
}
