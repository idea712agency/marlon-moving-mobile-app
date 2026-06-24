import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Switch, Text, TextInput, View } from 'react-native';

import { Card, ErrorState, LoadingState, PrimaryButton, SectionTitle } from '@/components/ui';
import { colors, layout } from '@/constants/theme';
import type { InventoryItem } from '@/lib/data';
import { errorMessage } from '@/lib/data';
import { supabase } from '@/lib/supabase';

export default function InventoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [condition, setCondition] = useState('');
  const [notes, setNotes] = useState('');
  const [fragile, setFragile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { supabase.from('move_inventory').select('*').eq('id', id).maybeSingle().then(({ data, error: queryError }) => { if (queryError) setError(errorMessage(queryError)); if (data) { setItem(data); setName(data.item_name); setCategory(data.category); setQuantity(String(data.quantity)); setCondition(data.condition ?? ''); setNotes(data.notes ?? ''); setFragile(data.fragile); } setLoading(false); }); }, [id]);
  const save = async () => {
    const { data, error: updateError } = await supabase.from('move_inventory').update({ item_name: name.trim(), category: category.trim(), quantity: Math.max(1, Number(quantity) || 1), condition: condition.trim() || null, notes: notes.trim() || null, fragile }).eq('id', id).select().single();
    if (updateError) setError(errorMessage(updateError)); else setItem(data);
  };
  const remove = async () => {
    const { error: deleteError } = await supabase.from('move_inventory').delete().eq('id', id);
    if (deleteError) setError(errorMessage(deleteError)); else router.back();
  };
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: layout.screen, gap: 18, paddingBottom: 34 }}>
      {loading ? <LoadingState /> : null}{error ? <ErrorState message={error} /> : null}
      {item ? <Card><SectionTitle title="Edit item" />{[[name, setName, 'Item name'], [category, setCategory, 'Category'], [quantity, setQuantity, 'Quantity'], [condition, setCondition, 'Condition'], [notes, setNotes, 'Notes']].map(([value, setter, placeholder]) => <TextInput key={placeholder as string} value={value as string} onChangeText={setter as (text: string) => void} placeholder={placeholder as string} placeholderTextColor={colors.grayIcon} style={{ minHeight: 50, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 13, color: colors.text }} />)}<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={{ color: colors.text, fontWeight: '700' }}>Fragile</Text><Switch value={fragile} onValueChange={setFragile} /></View><PrimaryButton label="Save Changes" onPress={save} /><PrimaryButton label="Delete Item" secondary onPress={remove} /></Card> : null}
    </ScrollView>
  );
}
