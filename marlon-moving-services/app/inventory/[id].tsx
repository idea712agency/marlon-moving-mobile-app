import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';

import { Card, EmptyState, ErrorState, LoadingState, PrimaryButton, SectionTitle } from '@/components/ui';
import { colors, layout } from '@/constants/theme';
import { useCustomerDashboard } from '@/hooks/use-customer-dashboard';
import type { InventoryItem } from '@/lib/data';
import { errorMessage, shortDate, shortTime } from '@/lib/data';
import { invokeSupabaseFunction } from '@/lib/supabase-functions';

type InventoryResponse = { items: InventoryItem[] };

export default function InventoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const itemId = Array.isArray(id) ? id[0] : id;
  const dashboard = useCustomerDashboard();
  const queryClient = useQueryClient();
  const job = dashboard.data?.job ?? null;
  const jobId = job?.id;
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const [localError, setLocalError] = useState('');

  const inventory = useQuery({
    queryKey: ['customer-inventory', jobId],
    enabled: Boolean(jobId),
    queryFn: async () => {
      if (!jobId) throw new Error('No linked move.');
      return invokeSupabaseFunction<InventoryResponse>('mobile-get-inventory', { body: { job_id: jobId } });
    },
  });
  const item = (inventory.data?.items ?? []).find((entry) => entry.id === itemId) ?? null;

  useEffect(() => {
    if (!item) return;
    setName(item.item_name);
    setRoom(item.category);
    setQuantity(String(item.quantity));
    setNotes(item.notes ?? '');
  }, [item]);

  const save = useMutation({
    mutationFn: async () => {
      if (!jobId || !itemId) throw new Error('Missing inventory item.');
      if (!name.trim()) throw new Error('Enter an item name.');
      return invokeSupabaseFunction('mobile-upsert-inventory-item', {
        body: {
          job_id: jobId,
          item_id: itemId,
          name: name.trim(),
          quantity: Math.max(1, Number(quantity) || 1),
          room: room.trim() || undefined,
          notes: notes.trim() || undefined,
        },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['customer-inventory', jobId] });
      router.back();
    },
    onError: (error) => setLocalError(errorMessage(error)),
  });

  const remove = useMutation({
    mutationFn: async () => {
      if (!itemId) throw new Error('Missing inventory item.');
      return invokeSupabaseFunction('mobile-delete-inventory-item', { body: { item_id: itemId } });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['customer-inventory', jobId] });
      router.back();
    },
    onError: (error) => setLocalError(errorMessage(error)),
  });

  const error = dashboard.error || inventory.error || localError;

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: layout.screen, gap: 18, paddingBottom: 34 }}>
      {dashboard.isLoading || inventory.isLoading ? <LoadingState /> : null}
      {error ? <ErrorState message={typeof error === 'string' ? error : errorMessage(error)} /> : null}
      {!dashboard.isLoading && !job ? <EmptyState title="No linked move" body="Inventory can be edited after your move is linked." /> : null}
      {job ? <CurrentMoveCard title={job.job_number} subtitle={`${shortDate(job.scheduled_date)} · ${shortTime(job.scheduled_start_time)}`} /> : null}
      {!inventory.isLoading && job && !item ? <EmptyState title="Item not found" body="This inventory item is not available for the current move." /> : null}
      {item ? (
        <Card>
          <SectionTitle title="Edit item" />
          <Field value={name} onChangeText={setName} placeholder="Item name" />
          <Field value={room} onChangeText={setRoom} placeholder="Room / category" />
          <Field value={quantity} onChangeText={setQuantity} keyboardType="number-pad" placeholder="Quantity" />
          <Field value={notes} onChangeText={setNotes} multiline placeholder="Notes" />
          <PrimaryButton label={save.isPending ? 'Saving...' : 'Save Changes'} onPress={() => save.mutate()} />
          <PrimaryButton label={remove.isPending ? 'Deleting...' : 'Delete Item'} secondary onPress={() => remove.mutate()} />
        </Card>
      ) : null}
    </ScrollView>
  );
}

function CurrentMoveCard({ title, subtitle }: { title: string; subtitle: string }) {
  return <Card><Text style={{ color: colors.muted, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' }}>Current move</Text><Text selectable style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>{title}</Text><Text selectable style={{ color: colors.muted }}>{subtitle}</Text></Card>;
}

function Field(props: React.ComponentProps<typeof TextInput>) {
  const { multiline, style, ...inputProps } = props;
  return <TextInput {...inputProps} multiline={multiline} placeholderTextColor={colors.grayIcon} style={[{ minHeight: multiline ? 92 : 50, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 13, paddingTop: multiline ? 12 : undefined, textAlignVertical: multiline ? 'top' : undefined, color: colors.text }, style]} />;
}
