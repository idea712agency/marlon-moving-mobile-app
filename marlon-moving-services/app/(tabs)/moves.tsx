import { Search, Truck } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppTopBar } from '@/components/operator/app-shell';
import { DispatchAssignmentSheet } from '@/components/operator/dispatch/DispatchAssignmentSheet';
import { MoveCard } from '@/components/operator/MoveCard';
import { brand } from '@/constants/operator-brand';
import { type MoveFilter, useMoves } from '@/hooks/use-moves';
import type { MoveListItem } from '@/components/operator/MoveCard';

const filters: { key: MoveFilter; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'today', label: 'Today' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'all', label: 'All' },
];

export default function MovesScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<MoveFilter>('upcoming');
  const [search, setSearch] = useState('');
  const [assigningMove, setAssigningMove] = useState<MoveListItem | null>(null);
  const movesQuery = useMoves(filter);

  const moves = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return movesQuery.data ?? [];

    return (movesQuery.data ?? []).filter((move) =>
      [
        move.contacts?.name,
        move.origin_address,
        move.destination_address,
        move.scheduled_date,
        move.job_number,
      ].some((value) => value?.toLowerCase().includes(needle)),
    );
  }, [movesQuery.data, search]);

  return (
    <View style={{ flex: 1, backgroundColor: brand.bg }}>
      <AppTopBar />
      <FlatList
        data={moves}
        keyExtractor={(item) => item.id}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            tintColor={brand.blue}
            refreshing={movesQuery.isRefetching}
            onRefresh={() => void movesQuery.refetch()}
          />
        }
        contentContainerStyle={{
          paddingHorizontal: 18,
          paddingTop: 18,
          paddingBottom: insets.bottom + 108,
          gap: 12,
          flexGrow: movesQuery.isLoading || moves.length === 0 ? 1 : undefined,
        }}
        ListHeaderComponent={
          <View style={{ gap: 15, paddingBottom: 5 }}>
            <View style={{ gap: 5 }}>
              <Text selectable style={{ color: brand.text, fontSize: 28, lineHeight: 33, fontWeight: '900', letterSpacing: -0.7 }}>
                Moves
              </Text>
              <Text selectable style={{ color: brand.muted, fontSize: 14, lineHeight: 19 }}>
                Manage upcoming, active, and completed jobs.
              </Text>
            </View>

            <View
              style={{
                minHeight: 46,
                borderRadius: 14,
                borderCurve: 'continuous',
                borderWidth: 1,
                borderColor: brand.border,
                paddingHorizontal: 13,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 9,
                backgroundColor: brand.surface,
              }}>
              <Search color={brand.muted} size={18} strokeWidth={2.3} />
              <TextInput
                accessibilityLabel="Search moves"
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
                onChangeText={setSearch}
                placeholder="Search customer, address, date, or job #"
                placeholderTextColor="#94A3B8"
                returnKeyType="search"
                style={{ flex: 1, color: brand.text, fontSize: 13, fontWeight: '600' }}
                value={search}
              />
            </View>

            <FlatList
              data={filters}
              horizontal
              keyExtractor={(item) => item.key}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
              renderItem={({ item }) => {
                const selected = item.key === filter;
                return (
                  <Pressable
                    accessibilityLabel={`Filter by ${item.label}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setFilter(item.key)}
                    style={{
                      minHeight: 34,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: selected ? brand.blue : brand.border,
                      paddingHorizontal: 13,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: selected ? brand.blue : brand.surface,
                    }}>
                    <Text style={{ color: selected ? '#FFFFFF' : brand.muted, fontSize: 11, fontWeight: '900' }}>{item.label}</Text>
                  </Pressable>
                );
              }}
            />

            {movesQuery.error ? (
              <View
                style={{
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: '#FECACA',
                  padding: 13,
                  gap: 8,
                  backgroundColor: '#FEF2F2',
                }}>
                <Text selectable style={{ color: '#EF4444', fontSize: 13, fontWeight: '900' }}>
                  Moves couldn’t be loaded
                </Text>
                <Pressable accessibilityRole="button" onPress={() => void movesQuery.refetch()}>
                  <Text style={{ color: brand.blue, fontSize: 12, fontWeight: '900' }}>Try again</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          movesQuery.isLoading ? (
            <View style={{ flex: 1, minHeight: 260, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <ActivityIndicator color={brand.blue} size="large" />
              <Text style={{ color: brand.muted, fontSize: 13, fontWeight: '700' }}>Loading moves…</Text>
            </View>
          ) : !movesQuery.error ? (
            <View style={{ flex: 1, minHeight: 260, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <View style={{ width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: brand.blueSoft }}>
                <Truck color={brand.blue} size={27} strokeWidth={2.2} />
              </View>
              <Text selectable style={{ color: brand.text, fontSize: 18, fontWeight: '900' }}>
                No moves
              </Text>
              <Text selectable style={{ color: brand.muted, fontSize: 13, textAlign: 'center' }}>
                Nothing matches this filter yet.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => <MoveCard move={item} onAssignCrew={setAssigningMove} />}
      />
      <DispatchAssignmentSheet visible={Boolean(assigningMove)} jobId={assigningMove?.id} onClose={() => setAssigningMove(null)} />
    </View>
  );
}
