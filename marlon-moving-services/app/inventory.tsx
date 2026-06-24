import * as ImagePicker from 'expo-image-picker';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';

import { Card, EmptyState, ErrorState, Icon, LoadingState, PrimaryButton, SectionTitle } from '@/components/ui';
import { colors, layout } from '@/constants/theme';
import type { InventoryItem, Job } from '@/lib/data';
import { errorMessage } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

export default function InventoryScreen() {
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [fragile, setFragile] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async () => {
    const { data: jobData } = await supabase.from('jobs').select('*').order('scheduled_date').limit(1).maybeSingle();
    setJob(jobData);
    const { data, error: queryError } = await supabase.from('move_inventory').select('*').order('category').order('item_name');
    if (queryError) setError(errorMessage(queryError)); setItems(data ?? []); setLoading(false);
  };
  useEffect(() => { void load(); }, []);
  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.75 });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };
  const add = async () => {
    if (!user || !job || !name.trim() || !category.trim()) return;
    setError('');
    let photoUrl: string | null = null;
    if (photoUri) {
      const response = await fetch(photoUri);
      const blob = await response.blob();
      const path = `customers/${user.id}/inventory/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('media').upload(path, blob, { contentType: 'image/jpeg' });
      if (uploadError) { setError(errorMessage(uploadError)); return; }
      photoUrl = supabase.storage.from('media').getPublicUrl(path).data.publicUrl;
    }
    const { error: insertError } = await supabase.from('move_inventory').insert({ job_id: job.id, customer_user_id: user.id, item_name: name.trim(), category: category.trim(), quantity: Math.max(1, Number(quantity) || 1), fragile, photo_url: photoUrl });
    if (insertError) setError(errorMessage(insertError)); else { setName(''); setCategory(''); setQuantity('1'); setFragile(false); setPhotoUri(null); setShowForm(false); await load(); }
  };
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: layout.screen, gap: 14, paddingBottom: 34 }}>
      {loading ? <LoadingState /> : null}{error ? <ErrorState message={error} /> : null}
      {!loading && !job ? <EmptyState title="No linked move" body="Inventory can be added after your move is linked." /> : null}
      {job && !showForm ? <PrimaryButton label="Add Inventory Item" onPress={() => setShowForm(true)} icon={<Icon ios="plus" android="add" size={18} color={colors.white} />} /> : null}
      {showForm ? <Card><SectionTitle title="New inventory item" /><TextInput value={name} onChangeText={setName} placeholder="Item name" placeholderTextColor={colors.grayIcon} style={{ height: 50, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 13, color: colors.text }} /><TextInput value={category} onChangeText={setCategory} placeholder="Category / room" placeholderTextColor={colors.grayIcon} style={{ height: 50, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 13, color: colors.text }} /><TextInput value={quantity} onChangeText={setQuantity} keyboardType="number-pad" placeholder="Quantity" placeholderTextColor={colors.grayIcon} style={{ height: 50, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 13, color: colors.text }} /><View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={{ color: colors.text, fontWeight: '700' }}>Fragile</Text><Switch value={fragile} onValueChange={setFragile} /></View><PrimaryButton label={photoUri ? 'Photo Selected' : 'Choose Photo'} secondary onPress={pickPhoto} /><PrimaryButton label="Save Item" onPress={add} /></Card> : null}
      {!loading && job && !items.length ? <EmptyState title="Inventory is empty" body="Add furniture, boxes, fragile items, and photos for your moving crew." /> : null}
      {items.map((item) => <Link key={item.id} href={`/inventory/${item.id}`} asChild><Pressable><Card style={{ flexDirection: 'row', alignItems: 'center' }}><View style={{ width: 50, height: 50, borderRadius: 14, backgroundColor: item.fragile ? '#FFF1F0' : colors.paleBlue, alignItems: 'center', justifyContent: 'center' }}><Icon ios={item.fragile ? 'exclamationmark.triangle.fill' : 'shippingbox.fill'} android={item.fragile ? 'warning' : 'inventory_2'} color={item.fragile ? colors.danger : colors.primary} /></View><View style={{ flex: 1, gap: 4 }}><Text selectable style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>{item.item_name}</Text><Text selectable style={{ color: colors.muted, fontSize: 12 }}>{item.category} · Qty {item.quantity}</Text></View><Icon ios="chevron.right" android="chevron_right" size={18} color={colors.muted} /></Card></Pressable></Link>)}
    </ScrollView>
  );
}
