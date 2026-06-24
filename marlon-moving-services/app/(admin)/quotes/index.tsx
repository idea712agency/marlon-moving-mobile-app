import { useQuery } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import { FileText, Plus, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { OperatorCard, OperatorPageHeader, OperatorScreen } from '@/components/operator/app-shell';
import { brand } from '@/constants/operator-brand';
import { formatMoney } from '@/lib/adminEstimate';
import { supabase } from '@/lib/supabase';
import type { AdminQuote } from '@/lib/estimateRepository';

export default function QuotesScreen() {
  const [search, setSearch] = useState('');
  const query = useQuery({
    queryKey: ['admin-quotes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quote_requests')
        .select('*, contacts(id, name, phone, email)')
        .order('updated_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as unknown as AdminQuote[];
    },
  });
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return query.data ?? [];
    return (query.data ?? []).filter((quote) =>
      [quote.contacts?.name, quote.contacts?.email, quote.contacts?.phone, quote.origin, quote.destination, quote.id]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    );
  }, [query.data, search]);

  return (
    <OperatorScreen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <OperatorPageHeader title="Quotes" subtitle="Review requests, build estimates, and track decisions." />
      <Pressable
        accessibilityLabel="Create a manual estimate"
        accessibilityRole="button"
        onPress={() => router.push('/estimate/new?manual=true')}
        style={{
          minHeight: 52,
          borderRadius: 14,
          backgroundColor: brand.blue,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 9,
        }}>
        <Plus color="#FFFFFF" size={19} strokeWidth={2.6} />
        <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '900' }}>Create manual estimate</Text>
      </Pressable>
      <View style={{ height: 48, borderRadius: 14, borderWidth: 1, borderColor: brand.border, backgroundColor: brand.surface, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 9 }}>
        <Search color={brand.muted} size={18} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search customer, address, phone…"
          placeholderTextColor="#94A3B8"
          style={{ flex: 1, color: brand.text, fontSize: 14 }}
        />
      </View>

      {query.isLoading ? <ActivityIndicator color={brand.blue} /> : null}
      {query.error ? <ErrorCard message={query.error instanceof Error ? query.error.message : 'Unable to load quotes.'} /> : null}
      {!query.isLoading && !query.error && filtered.length === 0 ? (
        <OperatorCard>
          <FileText color={brand.blue} size={30} />
          <Text style={{ color: brand.text, fontSize: 18, fontWeight: '900' }}>No quotes found</Text>
          <Text style={{ color: brand.muted }}>Guest quote requests will appear here, or start a manual estimate above.</Text>
        </OperatorCard>
      ) : null}

      {filtered.map((quote) => (
        <Link key={quote.id} href={`/quotes/${quote.id}`} asChild>
          <Pressable>
            <OperatorCard>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={{ color: brand.text, fontSize: 17, fontWeight: '900' }}>
                    {quote.contacts?.name || `Quote ${quote.id.slice(0, 8)}`}
                  </Text>
                  <Text style={{ color: brand.muted, fontSize: 12 }}>{new Date(quote.updated_at).toLocaleDateString()}</Text>
                </View>
                <StatusBadge status={quote.status || 'draft'} />
              </View>
              <Text numberOfLines={1} style={{ color: brand.text, fontSize: 14 }}>{quote.origin}</Text>
              <Text numberOfLines={1} style={{ color: brand.muted, fontSize: 14 }}>→ {quote.destination}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: brand.muted, fontSize: 12 }}>{quote.move_date || 'Date not selected'}</Text>
                <Text style={{ color: brand.navy, fontSize: 14, fontWeight: '900' }}>
                  {quote.estimated_price_min != null && quote.estimated_price_max != null
                    ? `${formatMoney(quote.estimated_price_min)}–${formatMoney(quote.estimated_price_max)}`
                    : 'Estimate not built'}
                </Text>
              </View>
            </OperatorCard>
          </Pressable>
        </Link>
      ))}
    </OperatorScreen>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'won' || status === 'accepted'
      ? { bg: brand.greenSoft, fg: brand.green }
      : status === 'lost' || status === 'declined'
        ? { bg: brand.redSoft, fg: brand.red }
        : status === 'sent'
          ? { bg: brand.blueSoft, fg: brand.blue }
          : { bg: brand.purpleSoft, fg: brand.purple };
  return (
    <View style={{ borderRadius: 999, backgroundColor: tone.bg, paddingHorizontal: 10, paddingVertical: 6 }}>
      <Text style={{ color: tone.fg, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }}>{status}</Text>
    </View>
  );
}

function ErrorCard({ message }: { message: string }) {
  return <OperatorCard><Text selectable style={{ color: brand.red, lineHeight: 20 }}>{message}</Text></OperatorCard>;
}
