import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Card, EmptyState, ErrorState, Icon, LoadingState } from '@/components/ui';
import { colors, layout } from '@/constants/theme';
import type { Notification } from '@/lib/data';
import { errorMessage } from '@/lib/data';
import { supabase } from '@/lib/supabase';

export default function NotificationsScreen() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    supabase.from('customer_notifications').select('*').order('created_at', { ascending: false }).then(({ data, error: queryError }) => {
      if (queryError) setError(errorMessage(queryError)); setItems(data ?? []); setLoading(false);
    });
  }, []);
  const markRead = async (item: Notification) => {
    if (item.read) return;
    const { error: updateError } = await supabase.from('customer_notifications').update({ read: true }).eq('id', item.id);
    if (updateError) setError(errorMessage(updateError)); else setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, read: true } : entry));
  };
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: layout.screen, gap: 12, paddingBottom: 34 }}>
      {loading ? <LoadingState /> : null}{error ? <ErrorState message={error} /> : null}
      {!loading && !error && !items.length ? <EmptyState title="You’re all caught up" body="Move updates and messages will appear here." /> : null}
      {items.map((item) => <Pressable key={item.id} onPress={() => void markRead(item)}><Card style={{ flexDirection: 'row', alignItems: 'flex-start', backgroundColor: item.read ? colors.white : colors.paleBlue }}><View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' }}><Icon ios="bell.fill" android="notifications" /></View><View style={{ flex: 1, gap: 5 }}><Text selectable style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>{item.title}</Text><Text selectable style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}>{item.body}</Text><Text style={{ color: colors.muted, fontSize: 10 }}>{new Date(item.created_at).toLocaleString()}</Text></View>{!item.read ? <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary }} /> : null}</Card></Pressable>)}
    </ScrollView>
  );
}
