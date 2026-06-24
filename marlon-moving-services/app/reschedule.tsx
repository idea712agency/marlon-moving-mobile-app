import { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';

import { Card, EmptyState, ErrorState, Icon, LoadingState, PrimaryButton, SectionTitle } from '@/components/ui';
import { colors, layout } from '@/constants/theme';
import type { Job } from '@/lib/data';
import { errorMessage, shortDate } from '@/lib/data';
import { supabase } from '@/lib/supabase';

export default function RescheduleScreen() {
  const [job, setJob] = useState<Job | null>(null);
  const [date, setDate] = useState('');
  const [window, setWindow] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { supabase.from('jobs').select('*').order('scheduled_date').limit(1).maybeSingle().then(({ data, error: queryError }) => { if (queryError) setError(errorMessage(queryError)); setJob(data); setLoading(false); }); }, []);
  const submit = async () => {
    if (!job || !/^\d{4}-\d{2}-\d{2}$/.test(date)) { setError('Enter the preferred date as YYYY-MM-DD.'); return; }
    const { error: invokeError } = await supabase.functions.invoke('mobile-request-reschedule', { body: { job_id: job.id, requested_date: date, arrival_window: window.trim() || undefined, reason: reason.trim() || undefined } });
    if (invokeError) setError(errorMessage(invokeError)); else setSent(true);
  };
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: layout.screen, gap: 18, paddingBottom: 34 }}>
      {loading ? <LoadingState /> : null}{error ? <ErrorState message={error} /> : null}
      {!loading && !job ? <EmptyState title="No linked move" body="A linked job is required before you can request a new date." /> : null}
      {sent ? <Card style={{ alignItems: 'center', paddingVertical: 32 }}><Icon ios="checkmark.circle.fill" android="check_circle" size={52} color={colors.success} /><Text selectable style={{ color: colors.text, fontSize: 22, fontWeight: '900' }}>Request sent</Text><Text selectable style={{ color: colors.muted, textAlign: 'center' }}>Our team will contact you to confirm availability.</Text></Card> : null}
      {job && !sent ? <><Card><SectionTitle title="Current move" /><Text selectable style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>{shortDate(job.scheduled_date)}</Text></Card><Card><SectionTitle title="New preference" /><TextInput value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.grayIcon} style={{ height: 52, borderWidth: 1, borderColor: colors.border, borderRadius: 13, paddingHorizontal: 14, color: colors.text }} /><TextInput value={window} onChangeText={setWindow} placeholder="Arrival window (optional)" placeholderTextColor={colors.grayIcon} style={{ height: 52, borderWidth: 1, borderColor: colors.border, borderRadius: 13, paddingHorizontal: 14, color: colors.text }} /><TextInput value={reason} onChangeText={setReason} multiline placeholder="Reason (optional)" placeholderTextColor={colors.grayIcon} style={{ minHeight: 110, borderWidth: 1, borderColor: colors.border, borderRadius: 13, padding: 14, textAlignVertical: 'top', color: colors.text }} /></Card><PrimaryButton label="Submit Request" onPress={submit} /></> : null}
    </ScrollView>
  );
}
