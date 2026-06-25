import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { MessageSquareText, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { Composer } from '@/components/messaging/conversation-thread';
import { OperatorCard, OperatorPageHeader, OperatorScreen } from '@/components/operator/app-shell';
import { brand } from '@/constants/operator-brand';
import {
  adminListConversations,
  adminSendMessage,
  conversationIdFromResponse,
  conversationPreview,
  conversationSubject,
  type ConversationSummary,
} from '@/lib/messaging';

export default function AdminMessagesScreen() {
  const params = useLocalSearchParams<{ job_id?: string; quote_id?: string; filter?: string }>();
  const jobId = one(params.job_id);
  const quoteId = one(params.quote_id);
  const filter = one(params.filter);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['admin-conversations', filter ?? 'all', search.trim()],
    queryFn: () => adminListConversations({ subject_type: filter === 'unread' ? 'unread' : null, search: search.trim() }),
  });
  const [body, setBody] = useState('');
  const start = useMutation({
    mutationFn: (nextBody: string) =>
      adminSendMessage({
        job_id: jobId ?? undefined,
        quote_id: quoteId ?? undefined,
        body: nextBody,
      }),
    onSuccess: async (response) => {
      setBody('');
      await queryClient.invalidateQueries({ queryKey: ['admin-conversations'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-app-dashboard'] });
      const conversationId = conversationIdFromResponse(response);
      if (conversationId) router.push(`/messages/${conversationId}`);
    },
  });
  const conversations = useMemo(() => query.data?.conversations ?? [], [query.data]);

  const submitNew = () => start.mutate(body.trim());

  return (
    <OperatorScreen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <OperatorPageHeader title="Messages" subtitle="Customer conversations across moves and quotes." />

      {jobId || quoteId ? (
        <OperatorCard>
          <Text selectable style={{ color: brand.text, fontSize: 17, fontWeight: '900' }}>Start customer conversation</Text>
          <Text selectable style={{ color: brand.muted, fontSize: 13, lineHeight: 19 }}>
            {jobId ? 'This will open or create the conversation for this move.' : 'This will open or create the conversation for this quote.'}
          </Text>
          <Composer body={body} pending={start.isPending} placeholder="Type the first message..." onChangeBody={setBody} onSubmit={submitNew} />
          {start.error ? <Text selectable style={{ color: brand.red, fontSize: 13, lineHeight: 18 }}>{start.error instanceof Error ? start.error.message : 'Unable to send message.'}</Text> : null}
        </OperatorCard>
      ) : null}

      <View style={{ height: 48, borderRadius: 14, borderWidth: 1, borderColor: brand.border, backgroundColor: brand.surface, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 9 }}>
        <Search color={brand.muted} size={18} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search conversations..."
          placeholderTextColor="#94A3B8"
          style={{ flex: 1, color: brand.text, fontSize: 14 }}
        />
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <FilterButton label="All" active={filter !== 'unread'} onPress={() => router.setParams({ filter: undefined })} />
        <FilterButton label="Unread" active={filter === 'unread'} onPress={() => router.setParams({ filter: 'unread' })} />
      </View>

      {query.isLoading ? <ActivityIndicator color={brand.blue} /> : null}
      {query.error ? <OperatorCard><Text selectable style={{ color: brand.red }}>{query.error instanceof Error ? query.error.message : 'Unable to load conversations.'}</Text></OperatorCard> : null}
      {!query.isLoading && !query.error && !conversations.length ? (
        <OperatorCard>
          <MessageSquareText color={brand.blue} size={30} />
          <Text style={{ color: brand.text, fontSize: 18, fontWeight: '900' }}>No conversations</Text>
          <Text style={{ color: brand.muted, lineHeight: 20 }}>Customer conversations will appear here after the first message.</Text>
        </OperatorCard>
      ) : null}

      {conversations.map((conversation) => <ConversationRow key={conversation.id} conversation={conversation} />)}
    </OperatorScreen>
  );
}

function ConversationRow({ conversation }: { conversation: ConversationSummary }) {
  const unread = conversation.unread_admin_count ?? 0;
  return (
    <Link href={`/messages/${conversation.id}`} asChild>
      <Pressable accessibilityLabel={`Open ${conversationSubject(conversation)}`} accessibilityRole="link">
        <OperatorCard>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text selectable numberOfLines={1} style={{ color: brand.text, fontSize: 16, fontWeight: '900' }}>{conversation.customer_name || 'Customer'}</Text>
              <Text selectable numberOfLines={1} style={{ color: brand.blue, fontSize: 12, fontWeight: '900' }}>{conversationSubject(conversation)}</Text>
            </View>
            {unread > 0 ? <UnreadPill count={unread} /> : null}
          </View>
          <Text selectable numberOfLines={2} style={{ color: brand.muted, fontSize: 13, lineHeight: 19 }}>{conversationPreview(conversation)}</Text>
          <Text selectable style={{ color: brand.muted, fontSize: 11, fontWeight: '800' }}>{conversation.last_message_at ? relativeTime(conversation.last_message_at) : 'No activity yet'}</Text>
        </OperatorCard>
      </Pressable>
    </Link>
  );
}

function FilterButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ minHeight: 38, borderRadius: 999, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? brand.blue : brand.surface, borderWidth: 1, borderColor: active ? brand.blue : brand.border }}>
      <Text style={{ color: active ? '#FFFFFF' : brand.text, fontSize: 12, fontWeight: '900' }}>{label}</Text>
    </Pressable>
  );
}

function UnreadPill({ count }: { count: number }) {
  return (
    <View style={{ minWidth: 28, height: 28, borderRadius: 999, backgroundColor: brand.red, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 }}>
      <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '900' }}>{Math.min(count, 99)}</Text>
    </View>
  );
}

function one(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value || '';
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

