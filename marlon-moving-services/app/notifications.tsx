import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Bell, CheckCheck } from 'lucide-react-native';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { CustomerCard, CustomerEmpty, CustomerShell } from '@/components/customer/customer-shell';
import { brand } from '@/constants/operator-brand';
import { errorMessage } from '@/lib/data';
import { invokeSupabaseFunction } from '@/lib/supabase-functions';

type CustomerNotification = {
  id: string;
  job_id: string | null;
  document_id?: string | null;
  title: string;
  body: string;
  type: string;
  read: boolean;
  created_at: string;
  payload?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
};

type NotificationsResponse = {
  notifications: CustomerNotification[];
  unread_count: number;
  next_cursor: string | null;
};

type MarkReadResponse = {
  updated: number;
  unread_count: number;
};

const PAGE_SIZE = 20;

export default function NotificationsScreen() {
  const queryClient = useQueryClient();
  const query = useInfiniteQuery({
    queryKey: ['customer-notifications'],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      invokeSupabaseFunction<NotificationsResponse>('mobile-get-notifications', {
        body: { limit: PAGE_SIZE, cursor: pageParam, unread_only: false },
      }),
    getNextPageParam: (lastPage) => lastPage.next_cursor,
  });

  const notifications = useMemo(
    () => query.data?.pages.flatMap((page) => page.notifications) ?? [],
    [query.data],
  );
  const unreadCount = query.data?.pages[0]?.unread_count ?? 0;

  const refreshNotifications = async () => {
    await queryClient.invalidateQueries({ queryKey: ['customer-notifications'] });
    await queryClient.invalidateQueries({ queryKey: ['customer-document-notification-count'] });
    await queryClient.invalidateQueries({ queryKey: ['customer-dashboard'] });
  };

  const markRead = useMutation({
    mutationFn: (notification: CustomerNotification) =>
      invokeSupabaseFunction<MarkReadResponse>('mobile-mark-notification-read', { body: { id: notification.id } }),
    onSuccess: async (_response, notification) => {
      await refreshNotifications();
      const documentId = notificationDocumentId(notification);
      if (documentId) {
        router.push(`/app/documents/${documentId}`);
        return;
      }
      if (notification.job_id) router.push(`/app/moves/${notification.job_id}`);
    },
  });

  const markAll = useMutation({
    mutationFn: () => invokeSupabaseFunction<MarkReadResponse>('mobile-mark-notification-read', { body: { mark_all: true } }),
    onSuccess: refreshNotifications,
  });

  const error = query.error || markRead.error || markAll.error;
  const isRefreshing = query.isRefetching && !query.isFetchingNextPage;

  return (
    <CustomerShell
      title="Notifications"
      subtitle="Move updates, payment reviews, and document alerts."
      unread={unreadCount}
      refreshing={isRefreshing}
      onRefresh={() => void query.refetch()}
      onEndReached={() => {
        if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
      }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <View style={styles.countPill}>
          <Bell color={brand.blue} size={15} />
          <Text style={styles.countText}>{unreadCount} unread</Text>
        </View>
        <Pressable
          disabled={markAll.isPending || unreadCount === 0}
          onPress={() => markAll.mutate()}
          style={[styles.markAllButton, { opacity: markAll.isPending || unreadCount === 0 ? 0.55 : 1 }]}>
          <CheckCheck color={brand.blue} size={16} />
          <Text style={styles.markAllText}>{markAll.isPending ? 'Marking...' : 'Mark all as read'}</Text>
        </Pressable>
      </View>

      {query.isLoading ? <ActivityIndicator color={brand.blue} /> : null}
      {error ? <CustomerEmpty title="Notifications unavailable" body={errorMessage(error)} /> : null}
      {!query.isLoading && !error && notifications.length === 0 ? (
        <CustomerEmpty title="You are all caught up" body="Move updates and messages will appear here." />
      ) : null}

      {notifications.map((item) => (
        <Pressable
          key={item.id}
          disabled={markRead.isPending}
          onPress={() => markRead.mutate(item)}
          style={{ opacity: markRead.isPending ? 0.72 : 1 }}>
          <CustomerCard>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
              <View style={[styles.iconBubble, { backgroundColor: item.read ? brand.bg : brand.blueSoft }]}>
                <Bell color={item.read ? brand.muted : brand.blue} size={18} />
              </View>
              <View style={{ flex: 1, gap: 5 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                  <Text selectable style={[styles.title, item.read ? { color: brand.text, fontWeight: '800' } : null]}>{item.title}</Text>
                  {!item.read ? <View style={styles.unreadDot} /> : null}
                </View>
                <Text selectable style={styles.body}>{item.body}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  <Text style={styles.meta}>{formatDateTime(item.created_at)}</Text>
                  {item.type ? <Text style={styles.typePill}>{titleCase(item.type)}</Text> : null}
                  {notificationDocumentId(item) ? <Text style={styles.jobHint}>Opens document</Text> : item.job_id ? <Text style={styles.jobHint}>Opens move</Text> : null}
                </View>
              </View>
            </View>
          </CustomerCard>
        </Pressable>
      ))}

      {query.isFetchingNextPage ? <ActivityIndicator color={brand.blue} /> : null}
      {query.hasNextPage && !query.isFetchingNextPage ? (
        <Pressable onPress={() => void query.fetchNextPage()} style={styles.loadMoreButton}>
          <Text style={styles.loadMoreText}>Load more</Text>
        </Pressable>
      ) : null}
    </CustomerShell>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

const titleCase = (value: string) => value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

function notificationDocumentId(notification: CustomerNotification) {
  if (notification.document_id) return notification.document_id;
  const payloadId = notification.payload?.document_id;
  if (typeof payloadId === 'string') return payloadId;
  const metadataId = notification.metadata?.document_id;
  if (typeof metadataId === 'string') return metadataId;
  return null;
}

const styles = {
  countPill: {
    minHeight: 36,
    borderRadius: 999,
    backgroundColor: brand.blueSoft,
    paddingHorizontal: 12,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 7,
  },
  countText: { color: brand.blue, fontSize: 12, fontWeight: '900' as const },
  markAllButton: {
    minHeight: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 7,
  },
  markAllText: { color: brand.blue, fontSize: 12, fontWeight: '900' as const },
  iconBubble: { width: 42, height: 42, borderRadius: 14, alignItems: 'center' as const, justifyContent: 'center' as const },
  title: { flex: 1, color: brand.text, fontSize: 15, lineHeight: 20, fontWeight: '900' as const },
  body: { color: brand.muted, fontSize: 13, lineHeight: 19 },
  meta: { color: brand.muted, fontSize: 11, fontWeight: '800' as const },
  typePill: {
    overflow: 'hidden' as const,
    borderRadius: 999,
    backgroundColor: brand.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    color: brand.muted,
    fontSize: 10,
    fontWeight: '900' as const,
  },
  jobHint: { color: brand.blue, fontSize: 10, fontWeight: '900' as const },
  unreadDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: brand.red, marginTop: 5 },
  loadMoreButton: { minHeight: 46, borderRadius: 14, backgroundColor: brand.blueSoft, alignItems: 'center' as const, justifyContent: 'center' as const },
  loadMoreText: { color: brand.blue, fontSize: 14, fontWeight: '900' as const },
};
