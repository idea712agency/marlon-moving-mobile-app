import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';

import { Card, EmptyState, ErrorState, Icon, LoadingState, PrimaryButton, SectionTitle } from '@/components/ui';
import { colors, layout } from '@/constants/theme';
import { useCustomerDashboard } from '@/hooks/use-customer-dashboard';
import type { Job } from '@/lib/data';
import { errorMessage, shortDate, shortTime } from '@/lib/data';
import { invokeSupabaseFunction } from '@/lib/supabase-functions';

type RescheduleRequest = {
  id: string;
  requested_date?: string | null;
  arrival_window?: string | null;
  reason?: string | null;
  status?: string | null;
  created_at?: string | null;
};

type RescheduleDetail = {
  job: Job | null;
  existing_requests: RescheduleRequest[];
};

export default function RescheduleScreen() {
  const dashboard = useCustomerDashboard();
  const queryClient = useQueryClient();
  const dashboardJob = dashboard.data?.job ?? null;
  const jobId = dashboardJob?.id;
  const [date, setDate] = useState('');
  const [window, setWindow] = useState('');
  const [reason, setReason] = useState('');
  const [sent, setSent] = useState(false);
  const [localError, setLocalError] = useState('');

  const detail = useQuery({
    queryKey: ['customer-reschedule-detail', jobId],
    enabled: Boolean(jobId),
    queryFn: async () => {
      if (!jobId) throw new Error('No linked move.');
      return invokeSupabaseFunction<RescheduleDetail>('mobile-get-reschedule-detail', { body: { job_id: jobId } });
    },
  });

  const submit = useMutation({
    mutationFn: () => {
      const job = detail.data?.job ?? dashboardJob;
      if (!job || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Enter the preferred date as YYYY-MM-DD.');
      return invokeSupabaseFunction('mobile-request-reschedule', {
        body: { job_id: job.id, requested_date: date, arrival_window: window.trim() || undefined, reason: reason.trim() || undefined },
      });
    },
    onSuccess: async () => {
      setSent(true);
      await queryClient.invalidateQueries({ queryKey: ['customer-reschedule-detail', jobId] });
      await queryClient.invalidateQueries({ queryKey: ['customer-dashboard'] });
    },
    onError: (error) => setLocalError(errorMessage(error)),
  });

  const job = detail.data?.job ?? dashboardJob;
  const requests = detail.data?.existing_requests ?? [];
  const error = dashboard.error || detail.error || localError;

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: layout.screen, gap: 18, paddingBottom: 34 }}>
      {dashboard.isLoading || detail.isLoading ? <LoadingState /> : null}
      {error ? <ErrorState message={typeof error === 'string' ? error : errorMessage(error)} /> : null}
      {!dashboard.isLoading && !job ? <EmptyState title="No linked move" body="A linked job is required before you can request a new date." /> : null}
      {sent ? <Card style={{ alignItems: 'center', paddingVertical: 32 }}><Icon ios="checkmark.circle.fill" android="check_circle" size={52} color={colors.success} /><Text selectable style={{ color: colors.text, fontSize: 22, fontWeight: '900' }}>Request sent</Text><Text selectable style={{ color: colors.muted, textAlign: 'center' }}>Our team will contact you to confirm availability.</Text></Card> : null}
      {job ? <Card><SectionTitle title="Current move" /><Text selectable style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>{job.job_number}</Text><Text selectable style={{ color: colors.muted }}>{shortDate(job.scheduled_date)} · {shortTime(job.scheduled_start_time)}</Text></Card> : null}
      {requests.length ? (
        <Card>
          <SectionTitle title="Existing requests" />
          {requests.map((request) => (
            <View key={request.id} style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, gap: 4 }}>
              <Text selectable style={{ color: colors.text, fontWeight: '800' }}>{shortDate(request.requested_date)}</Text>
              <Text selectable style={{ color: colors.muted, fontSize: 12 }}>{[request.arrival_window, request.status ?? 'submitted'].filter(Boolean).join(' · ')}</Text>
              {request.reason ? <Text selectable style={{ color: colors.muted, fontSize: 12 }}>{request.reason}</Text> : null}
            </View>
          ))}
        </Card>
      ) : null}
      {job && !sent ? (
        <>
          <Card>
            <SectionTitle title="New preference" />
            <TextInput value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.grayIcon} style={{ height: 52, borderWidth: 1, borderColor: colors.border, borderRadius: 13, paddingHorizontal: 14, color: colors.text }} />
            <TextInput value={window} onChangeText={setWindow} placeholder="Arrival window (optional)" placeholderTextColor={colors.grayIcon} style={{ height: 52, borderWidth: 1, borderColor: colors.border, borderRadius: 13, paddingHorizontal: 14, color: colors.text }} />
            <TextInput value={reason} onChangeText={setReason} multiline placeholder="Reason (optional)" placeholderTextColor={colors.grayIcon} style={{ minHeight: 110, borderWidth: 1, borderColor: colors.border, borderRadius: 13, padding: 14, textAlignVertical: 'top', color: colors.text }} />
          </Card>
          <PrimaryButton label={submit.isPending ? 'Submitting...' : 'Submit Request'} onPress={() => submit.mutate()} />
        </>
      ) : null}
    </ScrollView>
  );
}
