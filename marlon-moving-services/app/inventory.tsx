import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Link } from 'expo-router';
import { Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';

import { Card, EmptyState, ErrorState, Icon, LoadingState, PrimaryButton, SectionTitle } from '@/components/ui';
import { colors, layout } from '@/constants/theme';
import { useCustomerDashboard } from '@/hooks/use-customer-dashboard';
import type { InventoryItem } from '@/lib/data';
import { errorMessage, shortDate, shortTime } from '@/lib/data';
import { invokeSupabaseFunction } from '@/lib/supabase-functions';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import { useState } from 'react';

type InventoryResponse = { items: InventoryItem[] };

export default function InventoryScreen() {
  const { user } = useAuth();
  const dashboard = useCustomerDashboard();
  const queryClient = useQueryClient();
  const job = dashboard.data?.job ?? null;
  const jobId = job?.id;
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [fragile, setFragile] = useState(false);
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [localError, setLocalError] = useState('');

  const inventory = useQuery({
    queryKey: ['customer-inventory', jobId],
    enabled: Boolean(jobId),
    queryFn: async () => {
      if (!jobId) throw new Error('No linked move.');
      return invokeSupabaseFunction<InventoryResponse>('mobile-get-inventory', { body: { job_id: jobId } });
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      if (!user || !jobId) throw new Error('A linked move is required before adding inventory.');
      if (!name.trim()) throw new Error('Enter an item name.');
      const normalizedQuantity = Math.max(1, Number(quantity) || 1);
      let photoUrl = '';
      if (photoUri) {
        const response = await fetch(photoUri);
        const blob = await response.blob();
        const path = `customers/${user.id}/inventory/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage.from('media').upload(path, blob, { contentType: 'image/jpeg' });
        if (uploadError) throw uploadError;
        photoUrl = supabase.storage.from('media').getPublicUrl(path).data.publicUrl;
      }
      const noteParts = [notes.trim(), fragile ? 'Fragile' : '', photoUrl ? `Photo: ${photoUrl}` : ''].filter(Boolean);
      return invokeSupabaseFunction('mobile-upsert-inventory-item', {
        body: {
          job_id: jobId,
          name: name.trim(),
          quantity: normalizedQuantity,
          room: room.trim() || undefined,
          notes: noteParts.join('\n') || undefined,
        },
      });
    },
    onSuccess: async () => {
      setName('');
      setRoom('');
      setQuantity('1');
      setFragile(false);
      setNotes('');
      setPhotoUri(null);
      setShowForm(false);
      await queryClient.invalidateQueries({ queryKey: ['customer-inventory', jobId] });
      await queryClient.invalidateQueries({ queryKey: ['customer-dashboard'] });
    },
    onError: (error) => setLocalError(errorMessage(error)),
  });

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.75 });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const items = inventory.data?.items ?? [];
  const error = dashboard.error || inventory.error || localError;

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: layout.screen, gap: 14, paddingBottom: 34 }}>
      {dashboard.isLoading || inventory.isLoading ? <LoadingState /> : null}
      {error ? <ErrorState message={typeof error === 'string' ? error : errorMessage(error)} /> : null}
      {!dashboard.isLoading && !job ? <EmptyState title="No linked move" body="Inventory can be added after your move is linked." /> : null}
      {job ? <CurrentMoveCard title={job.job_number} subtitle={`${shortDate(job.scheduled_date)} · ${shortTime(job.scheduled_start_time)}`} /> : null}
      {job && !showForm ? <PrimaryButton label="Add Inventory Item" onPress={() => setShowForm(true)} icon={<Icon ios="plus" android="add" size={18} color={colors.white} />} /> : null}
      {showForm ? (
        <Card>
          <SectionTitle title="New inventory item" />
          <Field value={name} onChangeText={setName} placeholder="Item name" />
          <Field value={room} onChangeText={setRoom} placeholder="Room / category" />
          <Field value={quantity} onChangeText={setQuantity} keyboardType="number-pad" placeholder="Quantity" />
          <Field value={notes} onChangeText={setNotes} multiline placeholder="Notes (optional)" />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={{ color: colors.text, fontWeight: '700' }}>Fragile</Text><Switch value={fragile} onValueChange={setFragile} /></View>
          <PrimaryButton label={photoUri ? 'Photo Selected' : 'Choose Photo'} secondary onPress={pickPhoto} />
          <PrimaryButton label={upsert.isPending ? 'Saving...' : 'Save Item'} onPress={() => upsert.mutate()} />
        </Card>
      ) : null}
      {!inventory.isLoading && job && !items.length ? <EmptyState title="Inventory is empty" body="Add furniture, boxes, fragile items, and photos for your moving crew." /> : null}
      {items.map((item) => (
        <Link key={item.id} href={`/inventory/${item.id}`} asChild>
          <Pressable>
            <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 50, height: 50, borderRadius: 14, backgroundColor: item.fragile ? '#FFF1F0' : colors.paleBlue, alignItems: 'center', justifyContent: 'center' }}>
                <Icon ios={item.fragile ? 'exclamationmark.triangle.fill' : 'shippingbox.fill'} android={item.fragile ? 'warning' : 'inventory_2'} color={item.fragile ? colors.danger : colors.primary} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text selectable style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>{item.item_name}</Text>
                <Text selectable style={{ color: colors.muted, fontSize: 12 }}>{item.category} · Qty {item.quantity}</Text>
              </View>
              <Icon ios="chevron.right" android="chevron_right" size={18} color={colors.muted} />
            </Card>
          </Pressable>
        </Link>
      ))}
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
