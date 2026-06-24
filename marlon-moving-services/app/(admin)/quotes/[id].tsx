import { useQuery } from '@tanstack/react-query';
import { Link, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { OperatorCard, OperatorPageHeader, OperatorScreen } from '@/components/operator/app-shell';
import { StatusBadge } from './index';
import { brand } from '@/constants/operator-brand';
import { estimateFromQuote, fetchQuote } from '@/lib/estimateRepository';

export default function QuoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useQuery({ queryKey: ['admin-quote', id], queryFn: () => fetchQuote(id), enabled: Boolean(id) });

  if (query.isLoading) return <OperatorScreen><ActivityIndicator color={brand.blue} /></OperatorScreen>;
  if (!query.data || query.error) {
    return <OperatorScreen><OperatorCard><Text style={{ color: brand.red }}>{query.error instanceof Error ? query.error.message : 'Quote not found.'}</Text></OperatorCard></OperatorScreen>;
  }

  const quote = query.data;
  const estimate = estimateFromQuote(quote);
  const hasEstimate = Boolean(
    quote.conversation_data &&
      typeof quote.conversation_data === 'object' &&
      !Array.isArray(quote.conversation_data) &&
      quote.conversation_data.estimate,
  );

  return (
    <OperatorScreen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <OperatorPageHeader title={quote.contacts?.name || 'Quote request'} subtitle={`Quote ${quote.id.slice(0, 8)}`} />
      <OperatorCard>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: brand.text, fontSize: 17, fontWeight: '900' }}>Request details</Text>
          <StatusBadge status={quote.status || 'draft'} />
        </View>
        <Detail label="Phone" value={quote.contacts?.phone || 'Not provided'} />
        <Detail label="Email" value={quote.contacts?.email || 'Not provided'} />
        <Detail label="Move date" value={quote.move_date || 'Not selected'} />
        <Detail label="Home size" value={quote.home_size} />
        <Detail label="Origin" value={quote.origin} />
        <Detail label="Destination" value={quote.destination} />
      </OperatorCard>

      <OperatorCard>
        <Text style={{ color: brand.text, fontSize: 17, fontWeight: '900' }}>{hasEstimate ? 'Estimate ready' : 'Build estimate'}</Text>
        <Text style={{ color: brand.muted, lineHeight: 20 }}>
          {hasEstimate ? 'Open the saved estimate to edit pricing, send, print, or convert it.' : 'The request will prefill customer and move details.'}
        </Text>
        <Link href={hasEstimate ? `/estimate/${quote.id}` : `/estimate/new?quote=${quote.id}`} asChild>
          <Pressable style={{ height: 50, borderRadius: 13, backgroundColor: brand.blue, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '900' }}>{hasEstimate ? 'Open estimate' : 'Build estimate'}</Text>
          </Pressable>
        </Link>
        {hasEstimate ? (
          <Link href={`/estimate/${quote.id}/print`} asChild>
            <Pressable style={{ height: 50, borderRadius: 13, borderWidth: 1, borderColor: brand.blue, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: brand.blue, fontSize: 15, fontWeight: '900' }}>Print preview</Text>
            </Pressable>
          </Link>
        ) : null}
        {estimate.converted_job_id ? (
          <Link href={`/moves/${estimate.converted_job_id}`} asChild>
            <Pressable style={{ height: 50, borderRadius: 13, borderWidth: 1, borderColor: brand.green, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: brand.green, fontSize: 15, fontWeight: '900' }}>View converted job</Text>
            </Pressable>
          </Link>
        ) : null}
      </OperatorCard>
    </OperatorScreen>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <View style={{ gap: 3 }}><Text style={{ color: brand.muted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' }}>{label}</Text><Text selectable style={{ color: brand.text, lineHeight: 20 }}>{value}</Text></View>;
}
