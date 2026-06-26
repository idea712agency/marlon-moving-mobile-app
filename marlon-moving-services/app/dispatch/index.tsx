import { router, useLocalSearchParams } from 'expo-router';
import { AlertTriangle, CalendarDays, Truck, Users } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { OperatorCard, OperatorPageHeader, OperatorScreen } from '@/components/operator/app-shell';
import { DispatchAssignmentSheet } from '@/components/operator/dispatch/DispatchAssignmentSheet';
import { brand } from '@/constants/operator-brand';
import { useDispatchBoard } from '@/hooks/use-dispatch';
import { dispatchBlockerLabel, dispatchStatusLabel, type DispatchJobSummary, type DispatchStatus } from '@/lib/dispatch';

const STATUS_TABS: Array<DispatchStatus | 'all'> = ['all', 'unassigned', 'assigned', 'en_route', 'arrived', 'completed'];

const localDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDays = (amount: number) => {
  const next = new Date();
  next.setDate(next.getDate() + amount);
  return localDate(next);
};

export default function DispatchIndexScreen() {
  const params = useLocalSearchParams<{ blocker?: string; status?: string; job_id?: string }>();
  const [selectedStatus, setSelectedStatus] = useState<DispatchStatus | 'all'>(normalizeStatus(params.status));
  const [selectedJob, setSelectedJob] = useState<DispatchJobSummary | null>(null);
  const [dismissedJobId, setDismissedJobId] = useState<string | null>(null);
  const filters = useMemo(() => ({
    date_from: localDate(),
    date_to: addDays(14),
    status: selectedStatus === 'all' ? null : selectedStatus,
    blocker: Array.isArray(params.blocker) ? params.blocker[0] : params.blocker ?? null,
  }), [params.blocker, selectedStatus]);
  const board = useDispatchBoard(filters);
  const jobs = board.data?.jobs ?? [];
  const blockerLabel = filters.blocker ? dispatchBlockerLabel(filters.blocker) : null;
  const targetJobId = Array.isArray(params.job_id) ? params.job_id[0] : params.job_id;
  const closeAssignment = () => {
    setSelectedJob(null);
    if (!targetJobId) return;
    setDismissedJobId(targetJobId);
    router.setParams({ job_id: undefined });
  };

  useEffect(() => {
    if (!targetJobId || selectedJob || dismissedJobId === targetJobId) return;
    const match = jobs.find((job) => job.id === targetJobId);
    if (match) setSelectedJob(match);
  }, [dismissedJobId, jobs, selectedJob, targetJobId]);

  return (
    <OperatorScreen refreshing={board.isRefetching} onRefresh={() => void board.refetch()}>
      <OperatorPageHeader title="Dispatch" subtitle="Assign crews, trucks, and start times for upcoming moves." />

      {blockerLabel ? (
        <OperatorCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
            <AlertTriangle color={brand.orange} size={20} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: brand.text, fontSize: 15, fontWeight: '900' }}>{blockerLabel}</Text>
              <Text style={{ color: brand.muted, fontSize: 12 }}>Filtered from dashboard dispatch attention.</Text>
            </View>
            <Pressable onPress={() => router.replace('/dispatch')}><Text style={{ color: brand.blue, fontWeight: '900' }}>Clear</Text></Pressable>
          </View>
        </OperatorCard>
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {STATUS_TABS.map((status) => {
          const selected = status === selectedStatus;
          const count = status === 'all' ? jobs.length : board.data?.counts?.[status] ?? null;
          return (
            <Pressable
              key={status}
              accessibilityLabel={`Dispatch ${dispatchStatusLabel(status)}`}
              accessibilityRole="button"
              onPress={() => setSelectedStatus(status)}
              style={{
                minHeight: 38,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: selected ? brand.blue : brand.border,
                backgroundColor: selected ? brand.blue : brand.surface,
                paddingHorizontal: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 7,
              }}>
              <Text style={{ color: selected ? '#FFFFFF' : brand.text, fontSize: 11, fontWeight: '900' }}>{status === 'all' ? 'All' : dispatchStatusLabel(status)}</Text>
              {count != null ? <Text style={{ color: selected ? '#FFFFFF' : brand.blue, fontSize: 11, fontWeight: '900' }}>{count}</Text> : null}
            </Pressable>
          );
        })}
      </View>

      {board.isLoading ? <ActivityIndicator color={brand.blue} /> : null}
      {board.error ? <OperatorCard><Text selectable style={{ color: brand.red }}>{board.error instanceof Error ? board.error.message : 'Dispatch board unavailable.'}</Text></OperatorCard> : null}
      {!board.isLoading && !board.error && jobs.length === 0 ? (
        <OperatorCard>
          <Truck color={brand.blue} size={30} />
          <Text style={{ color: brand.text, fontSize: 18, fontWeight: '900' }}>No dispatch jobs</Text>
          <Text style={{ color: brand.muted }}>No scheduled moves match this dispatch filter.</Text>
        </OperatorCard>
      ) : null}

      {jobs.map((job) => <DispatchJobCard key={job.id} job={job} onAssign={() => setSelectedJob(job)} />)}
      <DispatchAssignmentSheet visible={Boolean(selectedJob)} jobId={selectedJob?.id} onClose={closeAssignment} />
    </OperatorScreen>
  );
}

function DispatchJobCard({ job, onAssign }: { job: DispatchJobSummary; onAssign: () => void }) {
  const blockers = job.readiness?.blockers ?? localBlockers(job);
  const customerName = job.customer_name ?? job.contact?.name ?? job.contacts?.name ?? job.job_number;
  return (
    <OperatorCard>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text selectable style={{ color: brand.text, fontSize: 18, fontWeight: '900' }}>{customerName}</Text>
          <Text selectable style={{ color: brand.muted, fontSize: 12, fontWeight: '800' }}>{job.job_number} · {shortDate(job.scheduled_date)} · {timeLabel(job.scheduled_start_time)}</Text>
        </View>
        <StatusChip status={job.dispatch_status ?? 'unassigned'} />
      </View>
      <Text selectable numberOfLines={1} style={{ color: brand.text }}>{job.origin_address || 'Origin missing'} → {job.destination_address || 'Destination missing'}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <InfoChip Icon={Users} label={`${job.crew_size ?? 0} movers`} />
        <InfoChip Icon={Truck} label={job.truck_size || 'No truck'} />
        <InfoChip Icon={CalendarDays} label={timeLabel(job.scheduled_start_time)} />
      </View>
      {blockers.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
          {blockers.map((blocker) => <View key={blocker} style={{ borderRadius: 999, backgroundColor: brand.orangeSoft, paddingHorizontal: 9, paddingVertical: 6 }}><Text style={{ color: brand.orange, fontSize: 11, fontWeight: '900' }}>{dispatchBlockerLabel(blocker)}</Text></View>)}
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable onPress={onAssign} style={{ flex: 1, minHeight: 46, borderRadius: 13, backgroundColor: brand.blue, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>Assign Dispatch</Text>
        </Pressable>
        <Pressable onPress={() => router.push(`/moves/${job.id}`)} style={{ flex: 1, minHeight: 46, borderRadius: 13, borderWidth: 1, borderColor: brand.border, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: brand.blue, fontWeight: '900' }}>Open Move</Text>
        </Pressable>
      </View>
    </OperatorCard>
  );
}

function StatusChip({ status }: { status: string }) {
  const assigned = ['assigned', 'en_route', 'arrived'].includes(status);
  const completed = status === 'completed';
  const tone = completed ? { bg: brand.blueSoft, fg: brand.blue } : assigned ? { bg: brand.greenSoft, fg: brand.green } : { bg: brand.orangeSoft, fg: brand.orange };
  return <View style={{ borderRadius: 999, backgroundColor: tone.bg, paddingHorizontal: 10, paddingVertical: 6 }}><Text style={{ color: tone.fg, fontSize: 10, fontWeight: '900' }}>{dispatchStatusLabel(status)}</Text></View>;
}

function InfoChip({ Icon, label }: { Icon: typeof Users; label: string }) {
  return <View style={{ borderRadius: 999, backgroundColor: brand.blueSoft, paddingHorizontal: 9, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 5 }}><Icon color={brand.blue} size={13} /><Text style={{ color: brand.navy, fontSize: 11, fontWeight: '900' }}>{label}</Text></View>;
}

function normalizeStatus(value?: string | string[]): DispatchStatus | 'all' {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === 'unassigned' || raw === 'assigned' || raw === 'en_route' || raw === 'arrived' || raw === 'completed' ? raw : 'all';
}

function localBlockers(job: DispatchJobSummary) {
  const blockers: string[] = [];
  if (!job.crew_size || job.crew_size < 1) blockers.push('missing_crew');
  if (!job.truck_id && !job.truck_size) blockers.push('missing_truck');
  if (!job.scheduled_start_time) blockers.push('missing_start_time');
  if (!job.origin_address) blockers.push('missing_origin');
  if (!job.destination_address) blockers.push('missing_destination');
  return blockers;
}

function shortDate(value?: string | null) {
  if (!value) return 'Date pending';
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function timeLabel(value?: string | null) {
  if (!value) return 'Time pending';
  const [hours, minutes] = value.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
