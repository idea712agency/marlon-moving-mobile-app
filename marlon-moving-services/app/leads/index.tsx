import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { CalendarDays, ChevronRight, MapPin, Search, UserRoundSearch } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { OperatorCard, OperatorPageHeader, OperatorScreen } from '@/components/operator/app-shell';
import { brand } from '@/constants/operator-brand';
import { shortDate } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

type Lead = Database['public']['Tables']['leads']['Row'];
const FILTERS = ['all', 'new', 'contacted', 'qualified', 'lost'] as const;
type Filter = (typeof FILTERS)[number];

export default function LeadsIndexScreen() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const query = useQuery({
    queryKey: ['admin-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(250);
      if (error) throw error;
      return data ?? [];
    },
  });
  const leads = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (query.data ?? []).filter((lead) => {
      const statusMatches = filter === 'all' || lead.status === filter;
      const searchMatches = !needle || [
        lead.name,
        lead.email,
        lead.phone,
        lead.origin_address,
        lead.destination_address,
        lead.source,
      ].filter(Boolean).some((value) => String(value).toLowerCase().includes(needle));
      return statusMatches && searchMatches;
    });
  }, [filter, query.data, search]);

  return (
    <OperatorScreen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <OperatorPageHeader title="Leads" subtitle="Review estimate requests and follow up with prospective customers." />
      <View style={styles.searchBox}>
        <Search color={brand.muted} size={18} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search name, phone, address…"
          placeholderTextColor="#94A3B8"
          style={{ flex: 1, color: brand.text, fontSize: 14 }}
        />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
        {FILTERS.map((value) => (
          <Pressable key={value} onPress={() => setFilter(value)} style={[styles.filter, filter === value ? styles.filterActive : null]}>
            <Text style={{ color: filter === value ? '#FFFFFF' : brand.text, fontSize: 10, fontWeight: '900' }}>{titleCase(value)}</Text>
          </Pressable>
        ))}
      </View>

      {query.isLoading ? <ActivityIndicator color={brand.blue} /> : null}
      {query.error ? (
        <OperatorCard>
          <Text selectable style={{ color: brand.red, fontSize: 17, fontWeight: '900' }}>Unable to load leads</Text>
          <Text selectable style={{ color: brand.muted, lineHeight: 20 }}>{messageOf(query.error)}</Text>
        </OperatorCard>
      ) : null}
      {!query.isLoading && !query.error && leads.length === 0 ? (
        <OperatorCard>
          <UserRoundSearch color={brand.blue} size={30} />
          <Text style={{ color: brand.text, fontSize: 18, fontWeight: '900' }}>No leads found</Text>
          <Text style={{ color: brand.muted }}>Nothing matches this search or status filter.</Text>
        </OperatorCard>
      ) : null}

      {leads.map((lead) => <LeadCard key={lead.id} lead={lead} />)}
    </OperatorScreen>
  );
}

function LeadCard({ lead }: { lead: Lead }) {
  return (
    <Link href={`/leads/${lead.id}`} asChild>
      <Pressable accessibilityLabel={`Open lead ${lead.name}`} accessibilityRole="link">
        <OperatorCard>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <View style={styles.avatar}><Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '900' }}>{initials(lead.name)}</Text></View>
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text selectable numberOfLines={1} style={{ flex: 1, color: brand.text, fontSize: 17, fontWeight: '900' }}>{lead.name || 'Unnamed lead'}</Text>
                <StatusBadge status={lead.status} />
              </View>
              <Text selectable style={{ color: brand.muted, fontSize: 12 }}>{lead.phone || lead.email || 'No contact details'}</Text>
              <View style={styles.metaRow}><CalendarDays color={brand.muted} size={14} /><Text selectable style={styles.metaText}>{shortDate(lead.move_date)} · {titleCase(lead.move_type || 'move')}</Text></View>
              <View style={styles.metaRow}><MapPin color={brand.muted} size={14} /><Text numberOfLines={1} style={styles.metaText}>{lead.origin_address || 'Origin pending'} → {lead.destination_address || 'Destination pending'}</Text></View>
              <Text style={{ color: brand.blue, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }}>{titleCase(lead.source || 'unknown source')}</Text>
            </View>
            <ChevronRight color={brand.muted} size={19} />
          </View>
        </OperatorCard>
      </Pressable>
    </Link>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone = status === 'qualified'
    ? { bg: brand.greenSoft, fg: brand.green }
    : status === 'lost'
      ? { bg: brand.redSoft, fg: brand.red }
      : status === 'contacted'
        ? { bg: brand.blueSoft, fg: brand.blue }
        : { bg: brand.purpleSoft, fg: brand.purple };
  return <View style={{ borderRadius: 999, backgroundColor: tone.bg, paddingHorizontal: 9, paddingVertical: 5 }}><Text style={{ color: tone.fg, fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>{status || 'new'}</Text></View>;
}

const titleCase = (value: string) => value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const initials = (name: string) => name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'L';
const messageOf = (error: unknown) => error instanceof Error ? error.message : 'Unable to load leads.';
const styles = {
  searchBox: { height: 48, borderRadius: 14, borderWidth: 1, borderColor: brand.border, backgroundColor: brand.surface, flexDirection: 'row' as const, alignItems: 'center' as const, paddingHorizontal: 13, gap: 9 },
  filter: { borderRadius: 999, borderWidth: 1, borderColor: brand.border, backgroundColor: brand.surface, paddingHorizontal: 12, paddingVertical: 8 },
  filterActive: { borderColor: brand.blue, backgroundColor: brand.blue },
  avatar: { width: 46, height: 46, borderRadius: 15, backgroundColor: brand.navy, alignItems: 'center' as const, justifyContent: 'center' as const },
  metaRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6 },
  metaText: { flex: 1, color: brand.muted, fontSize: 12 },
};
