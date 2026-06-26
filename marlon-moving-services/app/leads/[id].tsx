import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';

import { OperatorCard, OperatorPageHeader, OperatorScreen } from '@/components/operator/app-shell';
import { StatusBadge } from './index';
import { brand } from '@/constants/operator-brand';
import { convertLeadToJob } from '@/lib/admin-leads';
import { shortDate } from '@/lib/data';
import { supabase } from '@/lib/supabase';

export default function LeadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['admin-lead', id],
    queryFn: async () => {
      const [{ data: lead, error }, { data: activity, error: activityError }, { data: job, error: jobError }] = await Promise.all([
        supabase.from('leads').select('*').eq('id', id).single(),
        supabase.from('lead_activities').select('*').eq('lead_id', id).order('created_at', { ascending: false }),
        supabase
          .from('jobs')
          .select('id, job_number, status, scheduled_date')
          .eq('lead_id', id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      if (error) throw error;
      if (activityError) throw activityError;
      if (jobError) throw jobError;
      return { lead, activity: activity ?? [], job };
    },
    enabled: Boolean(id),
  });
  const convert = useMutation({
    mutationFn: () => convertLeadToJob(id),
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-lead', id] }),
        queryClient.invalidateQueries({ queryKey: ['admin-leads'] }),
        queryClient.invalidateQueries({ queryKey: ['operator-moves'] }),
        queryClient.invalidateQueries({ queryKey: ['operator-schedule'] }),
        queryClient.invalidateQueries({ queryKey: ['operator-job', result.job_id] }),
        queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] }),
      ]);
      Alert.alert(result.already_converted ? 'Already booked' : 'Move booked');
      router.replace(`/moves/${result.job_id}`);
    },
  });

  if (query.isLoading) return <OperatorScreen><ActivityIndicator color={brand.blue} /></OperatorScreen>;
  if (!query.data || query.error) {
    return <OperatorScreen><OperatorCard><Text selectable style={{ color: brand.red }}>{query.error instanceof Error ? query.error.message : 'Lead not found.'}</Text></OperatorCard></OperatorScreen>;
  }
  const { lead, activity, job } = query.data;
  return (
    <OperatorScreen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <OperatorPageHeader title={lead.name || 'Lead'} subtitle={`Lead ${lead.id.slice(0, 8).toUpperCase()}`} />
      <OperatorCard>
        <Text style={styles.cardTitle}>Booking</Text>
        {job ? (
          <>
            <Detail label="Linked move" value={job.job_number || job.id} />
            <Detail label="Status" value={titleCase(job.status || 'scheduled')} />
            <Detail label="Scheduled" value={shortDate(job.scheduled_date)} />
            <Pressable
              accessibilityLabel="View linked move"
              accessibilityRole="button"
              onPress={() => router.push(`/moves/${job.id}`)}
              style={[styles.primaryButton, { backgroundColor: brand.green }]}>
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '900' }}>View Move</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text selectable style={{ color: brand.muted, fontSize: 13, lineHeight: 18 }}>
              Create a scheduled move from this customer-submitted lead and preserve the customer portal link.
            </Text>
            <Pressable
              accessibilityLabel="Approve and book move"
              accessibilityRole="button"
              disabled={convert.isPending}
              onPress={() => convert.mutate()}
              style={[styles.primaryButton, { opacity: convert.isPending ? 0.65 : 1 }]}>
              {convert.isPending ? <ActivityIndicator color="#FFFFFF" /> : null}
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '900' }}>
                {convert.isPending ? 'Booking Move...' : 'Approve / Book Move'}
              </Text>
            </Pressable>
            {convert.error ? (
              <Text selectable style={{ color: brand.red, fontSize: 13, lineHeight: 18, fontWeight: '800' }}>
                {messageOf(convert.error)}
              </Text>
            ) : null}
          </>
        )}
      </OperatorCard>
      <OperatorCard>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <Text style={styles.cardTitle}>Contact</Text>
          <StatusBadge status={lead.status} />
        </View>
        <Detail label="Phone" value={lead.phone || 'Not provided'} />
        <Detail label="Email" value={lead.email || 'Not provided'} />
        <Detail label="Preferred contact" value={titleCase(lead.preferred_contact_method || 'Not specified')} />
        <Detail label="Source" value={titleCase(lead.source)} />
      </OperatorCard>
      <OperatorCard>
        <Text style={styles.cardTitle}>Move request</Text>
        <Detail label="Move date" value={shortDate(lead.move_date)} />
        <Detail label="Move type" value={titleCase(lead.move_type || 'Not specified')} />
        <Detail label="Home type" value={lead.home_type || 'Not specified'} />
        <Detail label="Origin" value={lead.origin_address || 'Not provided'} />
        <Detail label="Destination" value={lead.destination_address || 'Not provided'} />
        <Detail label="Notes" value={lead.notes || lead.special_requirements || 'No notes'} />
      </OperatorCard>
      <OperatorCard>
        <Text style={styles.cardTitle}>Activity</Text>
        {!activity.length ? <Text style={{ color: brand.muted }}>No activity recorded yet.</Text> : activity.map((item) => (
          <View key={item.id} style={{ borderLeftWidth: 3, borderLeftColor: brand.blue, paddingLeft: 12, gap: 3 }}>
            <Text selectable style={{ color: brand.text, fontSize: 13, fontWeight: '900' }}>{item.description}</Text>
            <Text selectable style={{ color: brand.muted, fontSize: 11 }}>{new Date(item.created_at).toLocaleString()}</Text>
          </View>
        ))}
      </OperatorCard>
    </OperatorScreen>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <View style={{ gap: 3 }}><Text style={{ color: brand.muted, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }}>{label}</Text><Text selectable style={{ color: brand.text, fontSize: 14, lineHeight: 20 }}>{value}</Text></View>;
}
const titleCase = (value: string) => value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const messageOf = (error: unknown) => error instanceof Error ? error.message : 'Unable to book this move.';
const styles = {
  cardTitle: { color: brand.text, fontSize: 18, fontWeight: '900' as const },
  primaryButton: { minHeight: 52, borderRadius: 14, backgroundColor: brand.blue, alignItems: 'center' as const, justifyContent: 'center' as const, flexDirection: 'row' as const, gap: 8 },
};
