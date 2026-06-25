import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Card, EmptyState, ErrorState, Icon, LoadingState } from '@/components/ui';
import { colors, layout } from '@/constants/theme';
import type { Notification } from '@/lib/data';
import { errorMessage } from '@/lib/data';
import { invokeSupabaseFunction } from '@/lib/supabase-functions';

type NotificationsResponse = {
  notifications?: Notification[];
  items?: Notification[];
};

export default function NotificationsScreen() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['customer-notifications'],
    queryFn: async () => {
      const result = await invokeSupabaseFunction<NotificationsResponse | Notification[]>('mobile-get-notifications');
      return Array.isArray(result) ? result : result.notifications ?? result.items ?? [];
    },
  });
  const markRead = useMutation({
    mutationFn: (notificationId: string) => invokeSupabaseFunction('mobile-mark-notification-read', { body: { notification_id: notificationId } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['customer-notifications'] });
      await queryClient.invalidateQueries({ queryKey: ['customer-dashboard'] });
    },
  });
  const items = query.data ?? [];
  const error = query.error || markRead.error;

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: layout.screen, gap: 12, paddingBottom: 34 }}>
      {query.isLoading ? <LoadingState /> : null}
      {error ? <ErrorState message={errorMessage(error)} /> : null}
      {!query.isLoading && !error && !items.length ? <EmptyState title="You’re all caught up" body="Move updates and messages will appear here." /> : null}
      {items.map((item) => (
        <Pressable
          key={item.id}
          disabled={markRead.isPending || item.read}
          onPress={() => markRead.mutate(item.id)}
          style={{ opacity: markRead.isPending ? 0.7 : 1 }}>
          <Card style={{ flexDirection: 'row', alignItems: 'flex-start', backgroundColor: item.read ? colors.white : colors.paleBlue }}>
            <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' }}>
              <Icon ios="bell.fill" android="notifications" />
            </View>
            <View style={{ flex: 1, gap: 5 }}>
              <Text selectable style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>{item.title}</Text>
              <Text selectable style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}>{item.body}</Text>
              <Text style={{ color: colors.muted, fontSize: 10 }}>{new Date(item.created_at).toLocaleString()}</Text>
            </View>
            {!item.read ? <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary }} /> : null}
          </Card>
        </Pressable>
      ))}
    </ScrollView>
  );
}
