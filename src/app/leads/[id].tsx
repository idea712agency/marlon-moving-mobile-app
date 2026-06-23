import { useQuery } from '@tanstack/react-query';
import { Link, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { OperatorCard, OperatorPageHeader, OperatorScreen } from '@/components/operator/app-shell';
import { StatusBadge } from '@/app/leads/index';
import { brand } from '@/constants/operator-brand';
import { shortDate } from '@/lib/data';
import { supabase } from '@/lib/supabase';

export default function LeadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useQuery({
    queryKey: ['admin-lead', id],
    queryFn: async () => {
      const [{ data: lead, error }, { data: activity, error: activityError }] = await Promise.all([
        supabase.from('leads').select('*').eq('id', id).single(),
        supabase.from('lead_activities').select('*').eq('lead_id', id).order('created_at', { ascending: false }),
      ]);
      if (error) throw error;
      if (activityError) throw activityError;
      return { lead, activity: activity ?? [] };
    },
    enabled: Boolean(id),
  });

  if (query.isLoading) return <OperatorScreen><ActivityIndicator color={brand.blue} /></OperatorScreen>;
  if (!query.data || query.error) {
    return <OperatorScreen><OperatorCard><Text selectable style={{ color: brand.red }}>{query.error instanceof Error ? query.error.message : 'Lead not found.'}</Text></OperatorCard></OperatorScreen>;
  }
  const { lead, activity } = query.data;
  return (
    <OperatorScreen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <OperatorPageHeader title={lead.name || 'Lead'} subtitle={`Lead ${lead.id.slice(0, 8).toUpperCase()}`} />
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
      <Link href={`/estimate/new?manual=true`} asChild>
        <Pressable style={styles.primaryButton}><Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '900' }}>Create manual estimate</Text></Pressable>
      </Link>
    </OperatorScreen>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <View style={{ gap: 3 }}><Text style={{ color: brand.muted, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }}>{label}</Text><Text selectable style={{ color: brand.text, fontSize: 14, lineHeight: 20 }}>{value}</Text></View>;
}
const titleCase = (value: string) => value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const styles = {
  cardTitle: { color: brand.text, fontSize: 18, fontWeight: '900' as const },
  primaryButton: { minHeight: 52, borderRadius: 14, backgroundColor: brand.blue, alignItems: 'center' as const, justifyContent: 'center' as const },
};
