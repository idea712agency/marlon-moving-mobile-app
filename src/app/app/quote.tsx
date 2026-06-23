import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { CalendarDays, Calculator, ChevronRight, FileText, MapPin, Truck } from 'lucide-react-native';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { CustomerCard, CustomerEmpty, CustomerShell } from '@/components/customer/customer-shell';
import { brand } from '@/constants/operator-brand';
import { listCustomerQuoteRequests } from '@/lib/customer-quote-requests';
import { shortDate } from '@/lib/data';

export default function CustomerQuoteScreen() {
  const requests = useQuery({
    queryKey: ['customer-quote-requests'],
    queryFn: listCustomerQuoteRequests,
  });

  return (
    <CustomerShell title="Quotes" subtitle="Request a new estimate or review and revise your submitted requests." refreshing={requests.isRefetching} onRefresh={() => void requests.refetch()}>
      <CustomerCard>
        <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: brand.blueSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Calculator color={brand.blue} size={28} strokeWidth={2.4} />
        </View>
        <Text selectable style={{ color: brand.text, fontSize: 22, fontWeight: '900' }}>Get a free estimate</Text>
        <Text selectable style={{ color: brand.muted, fontSize: 14, lineHeight: 21 }}>
          Share your addresses, inventory, photos, preferred date, and contact details. Our team will review it and follow up.
        </Text>
        <Link href="/quote/new" asChild>
          <Pressable style={styles.primaryButton}><Truck color="#FFFFFF" size={18} /><Text style={styles.primaryText}>Start estimate request</Text></Pressable>
        </Link>
      </CustomerCard>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text selectable style={{ color: brand.text, fontSize: 20, fontWeight: '900' }}>Submitted requests</Text>
        <Text selectable style={{ color: brand.muted, fontSize: 12, fontWeight: '800' }}>{requests.data?.length ?? 0}</Text>
      </View>
      {requests.isLoading ? <ActivityIndicator color={brand.blue} /> : null}
      {requests.error ? <CustomerEmpty title="Requests unavailable" body={requests.error instanceof Error ? requests.error.message : 'Unable to load your requests.'} /> : null}
      {!requests.isLoading && !requests.error && !requests.data?.length ? (
        <CustomerEmpty title="No requests yet" body="Once you submit an estimate request, it will appear here for review." />
      ) : null}
      {requests.data?.map((request) => (
        <Link key={request.id} href={`/app/quote/${request.id}`} asChild>
          <Pressable style={styles.requestCard}>
            <View style={{ flex: 1, gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <FileText color={brand.blue} size={18} />
                <Text selectable style={{ color: brand.text, fontSize: 16, fontWeight: '900' }}>Estimate request</Text>
                <View style={styles.statusPill}><Text style={styles.statusText}>{request.status || 'Submitted'}</Text></View>
              </View>
              <View style={styles.metaRow}><CalendarDays color={brand.muted} size={14} /><Text selectable style={styles.metaText}>{shortDate(request.move_date)}</Text></View>
              <View style={styles.metaRow}><MapPin color={brand.muted} size={14} /><Text numberOfLines={1} style={styles.metaText}>{request.origin_address || 'Pickup pending'} → {request.destination_address || 'Delivery pending'}</Text></View>
              {request.revision_of ? <Text style={{ color: brand.blue, fontSize: 11, fontWeight: '900' }}>Revised request</Text> : null}
            </View>
            <ChevronRight color={brand.muted} size={20} />
          </Pressable>
        </Link>
      ))}
    </CustomerShell>
  );
}

const styles = {
  primaryButton: { minHeight: 52, borderRadius: 14, backgroundColor: brand.red, flexDirection: 'row' as const, gap: 8, alignItems: 'center' as const, justifyContent: 'center' as const },
  primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' as const },
  requestCard: { minHeight: 118, borderRadius: 20, borderCurve: 'continuous' as const, borderWidth: 1, borderColor: brand.border, backgroundColor: '#FFFFFF', padding: 16, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, boxShadow: '0 1px 2px rgba(15,23,42,0.04)' },
  metaRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6 },
  metaText: { flex: 1, color: brand.muted, fontSize: 12 },
  statusPill: { marginLeft: 'auto' as const, borderRadius: 999, backgroundColor: brand.greenSoft, paddingHorizontal: 9, paddingVertical: 4 },
  statusText: { color: brand.green, fontSize: 9, fontWeight: '900' as const, textTransform: 'uppercase' as const },
};
