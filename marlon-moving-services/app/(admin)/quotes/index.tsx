import { useInfiniteQuery } from '@tanstack/react-query';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { FileText, Plus, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { OperatorCard, OperatorPageHeader, OperatorScreen } from '@/components/operator/app-shell';
import { brand } from '@/constants/operator-brand';
import { useAdminDashboard } from '@/hooks/use-admin-dashboard';
import { listAdminQuotes, type AdminQuoteListItem, type QuoteReadiness } from '@/lib/admin-quotes';
import { money, shortDate } from '@/lib/data';

const readinessFilters: { key: QuoteReadiness | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'estimate_ready', label: 'Estimate ready' },
  { key: 'sent', label: 'Sent' },
  { key: 'booked', label: 'Booked' },
  { key: 'lost', label: 'Lost' },
];

export default function QuotesScreen() {
  const params = useLocalSearchParams<{ readiness?: string }>();
  const selectedReadiness = normalizeReadiness(params.readiness);
  const [search, setSearch] = useState('');
  const dashboard = useAdminDashboard();
  const query = useInfiniteQuery({
    queryKey: ['admin-quotes-workspace', selectedReadiness ?? 'all', search.trim()],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      listAdminQuotes({
        readiness: selectedReadiness,
        search: search.trim(),
        limit: 25,
        cursor: pageParam,
      }),
    getNextPageParam: (lastPage) => lastPage.pagination?.next_cursor ?? undefined,
  });
  const quotes = useMemo(() => query.data?.pages.flatMap((page) => page.quotes) ?? [], [query.data]);
  const counts = dashboard.data?.quote_pipeline ?? query.data?.pages[0]?.quote_pipeline ?? {};

  const selectReadiness = (next: QuoteReadiness | 'all') => {
    if (next === 'all') router.setParams({ readiness: undefined });
    else router.setParams({ readiness: next });
  };

  const loadMore = () => {
    if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
  };

  return (
    <OperatorScreen refreshing={query.isRefetching && !query.isFetchingNextPage} onRefresh={() => void query.refetch()} onEndReached={loadMore}>
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

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {readinessFilters.map((filter) => {
          const selected = filter.key === 'all' ? !selectedReadiness : selectedReadiness === filter.key;
          const count = filter.key === 'all' ? sumPipeline(counts) : counts[filter.key] ?? null;
          return (
            <Pressable
              key={filter.key}
              accessibilityLabel={`Filter quotes by ${filter.label}`}
              accessibilityRole="button"
              onPress={() => selectReadiness(filter.key)}
              style={{
                minHeight: 38,
                borderRadius: 999,
                paddingHorizontal: 13,
                paddingVertical: 8,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 7,
                backgroundColor: selected ? brand.blue : brand.surface,
                borderWidth: 1,
                borderColor: selected ? brand.blue : brand.border,
              }}>
              <Text style={{ color: selected ? '#FFFFFF' : brand.text, fontSize: 12, fontWeight: '900' }}>{filter.label}</Text>
              {count != null ? (
                <View style={{ minWidth: 22, height: 22, borderRadius: 999, backgroundColor: selected ? 'rgba(255,255,255,0.2)' : brand.blueSoft, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
                  <Text style={{ color: selected ? '#FFFFFF' : brand.blue, fontSize: 11, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{count}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <View style={{ height: 48, borderRadius: 14, borderWidth: 1, borderColor: brand.border, backgroundColor: brand.surface, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 9 }}>
        <Search color={brand.muted} size={18} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search customer, city, source…"
          placeholderTextColor="#94A3B8"
          style={{ flex: 1, color: brand.text, fontSize: 14 }}
        />
      </View>

      {query.isLoading ? <ActivityIndicator color={brand.blue} /> : null}
      {query.error ? <ErrorCard message={query.error instanceof Error ? query.error.message : 'Unable to load quotes.'} /> : null}
      {!query.isLoading && !query.error && quotes.length === 0 ? (
        <OperatorCard>
          <FileText color={brand.blue} size={30} />
          <Text style={{ color: brand.text, fontSize: 18, fontWeight: '900' }}>No quotes found</Text>
          <Text style={{ color: brand.muted }}>No quote requests match this filter yet.</Text>
        </OperatorCard>
      ) : null}

      {quotes.map((quote) => <QuoteRow key={quote.id} quote={quote} />)}

      {query.isFetchingNextPage ? <ActivityIndicator color={brand.blue} /> : null}
      {query.hasNextPage && !query.isFetchingNextPage ? (
        <Pressable onPress={loadMore} accessibilityLabel="Load more quotes" accessibilityRole="button" style={{ height: 46, borderRadius: 13, backgroundColor: brand.blueSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: brand.blue, fontSize: 14, fontWeight: '900' }}>Load more</Text>
        </Pressable>
      ) : null}
    </OperatorScreen>
  );
}

function QuoteRow({ quote }: { quote: AdminQuoteListItem }) {
  return (
    <Link href={`/quotes/${quote.id}`} asChild>
      <Pressable accessibilityLabel={`Open quote ${quote.customer_name ?? quote.quote_number ?? quote.id}`} accessibilityRole="button">
        <OperatorCard>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
            <View style={{ flex: 1, gap: 3 }}>
              <Text selectable numberOfLines={1} style={{ color: brand.text, fontSize: 17, fontWeight: '900' }}>
                {quote.customer_name || quote.quote_number || `Quote ${quote.id.slice(0, 8)}`}
              </Text>
              <Text selectable style={{ color: brand.muted, fontSize: 12, fontWeight: '700' }}>{quote.quote_number ?? `Quote ${quote.id.slice(0, 8)}`}</Text>
            </View>
            <StatusBadge status={quote.readiness} />
          </View>
          <Text selectable style={{ color: brand.blue, fontSize: 12, fontWeight: '900' }}>{quoteNextAction(quote.readiness)}</Text>
          <Text numberOfLines={1} style={{ color: brand.text, fontSize: 14 }}>{quote.origin_city || 'Origin pending'}</Text>
          <Text numberOfLines={1} style={{ color: brand.muted, fontSize: 14 }}>→ {quote.destination_city || 'Destination pending'}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <Text style={{ flex: 1, color: brand.muted, fontSize: 12 }}>{quote.move_date ? shortDate(quote.move_date) : 'Date not selected'}</Text>
            <Text style={{ color: brand.navy, fontSize: 14, fontWeight: '900' }}>
              {quote.estimate_total != null ? money(quote.estimate_total) : quote.has_estimate ? 'Estimate ready' : 'Estimate not built'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <MetaChip label={quote.service_type || 'Move'} />
            <MetaChip label={quote.lead_source || 'Lead source pending'} />
            <MetaChip label={quote.last_activity_at ? `Updated ${relativeTime(quote.last_activity_at)}` : 'No activity yet'} />
          </View>
        </OperatorCard>
      </Pressable>
    </Link>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const label = quoteStatusLabel(status);
  const tone =
    status === 'booked' || status === 'won' || status === 'accepted'
      ? { bg: brand.greenSoft, fg: brand.green }
      : status === 'lost' || status === 'declined'
        ? { bg: brand.redSoft, fg: brand.red }
        : status === 'sent'
          ? { bg: brand.blueSoft, fg: brand.blue }
          : status === 'new'
            ? { bg: brand.orangeSoft, fg: brand.orange }
          : { bg: brand.purpleSoft, fg: brand.purple };
  return (
    <View style={{ borderRadius: 999, backgroundColor: tone.bg, paddingHorizontal: 10, paddingVertical: 6 }}>
      <Text style={{ color: tone.fg, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }}>{label}</Text>
    </View>
  );
}

function MetaChip({ label }: { label: string }) {
  return (
    <View style={{ borderRadius: 999, backgroundColor: brand.blueSoft, paddingHorizontal: 9, paddingVertical: 5 }}>
      <Text numberOfLines={1} style={{ color: brand.blue, fontSize: 11, fontWeight: '900' }}>{label}</Text>
    </View>
  );
}

function ErrorCard({ message }: { message: string }) {
  return <OperatorCard><Text selectable style={{ color: brand.red, lineHeight: 20 }}>{message}</Text></OperatorCard>;
}

function normalizeReadiness(value?: string | string[]): QuoteReadiness | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === 'new' || raw === 'estimate_ready' || raw === 'sent' || raw === 'booked' || raw === 'lost' ? raw : null;
}

function quoteNextAction(readiness: QuoteReadiness) {
  if (readiness === 'booked') return 'Move booked';
  if (readiness === 'sent') return 'Awaiting customer decision';
  if (readiness === 'estimate_ready') return 'Ready to send or book';
  if (readiness === 'lost') return 'Closed';
  return 'Build estimate next';
}

function quoteStatusLabel(status: string) {
  const labels: Record<string, string> = {
    new: 'New request',
    estimate_ready: 'Estimate ready',
    sent: 'Sent',
    booked: 'Booked',
    won: 'Booked',
    accepted: 'Booked',
    lost: 'Lost',
    declined: 'Lost',
  };
  return labels[status] ?? status.replace(/_/g, ' ');
}

function sumPipeline(counts: Partial<Record<QuoteReadiness, number | null>>) {
  return readinessFilters.reduce((sum, filter) => {
    if (filter.key === 'all') return sum;
    return sum + (counts[filter.key] ?? 0);
  }, 0);
}

function relativeTime(value: string) {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  if (Number.isNaN(diff)) return value;
  const minutes = Math.max(0, Math.round(diff / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
