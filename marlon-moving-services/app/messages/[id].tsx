import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Composer, MessageList } from '@/components/messaging/conversation-thread';
import { OperatorCard, OperatorPageHeader, OperatorScreen } from '@/components/operator/app-shell';
import { brand } from '@/constants/operator-brand';
import { adminGetConversation, adminSendMessage, conversationSubject } from '@/lib/messaging';

export default function AdminConversationThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = Array.isArray(id) ? id[0] : id;
  const queryClient = useQueryClient();
  const [body, setBody] = useState('');
  const query = useQuery({
    queryKey: ['admin-conversation', conversationId],
    enabled: Boolean(conversationId),
    queryFn: () => adminGetConversation(conversationId),
    refetchInterval: 15000,
  });
  const send = useMutation({
    mutationFn: (nextBody: string) => adminSendMessage({ conversation_id: conversationId, body: nextBody }),
    onSuccess: async () => {
      setBody('');
      await queryClient.invalidateQueries({ queryKey: ['admin-conversation', conversationId] });
      await queryClient.invalidateQueries({ queryKey: ['admin-conversations'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-app-dashboard'] });
    },
  });

  const conversation = query.data?.conversation ?? null;

  return (
    <OperatorScreen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <Pressable accessibilityLabel="Back" accessibilityRole="button" onPress={() => router.back()} style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: brand.surface, borderWidth: 1, borderColor: brand.border, alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft color={brand.navy} size={19} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <OperatorPageHeader title={conversation?.customer_name || 'Conversation'} subtitle={conversation ? conversationSubject(conversation) : 'Loading thread'} />
        </View>
      </View>

      <OperatorCard>
        {query.isLoading ? <ActivityIndicator color={brand.blue} /> : null}
        {query.error ? <Text selectable style={{ color: brand.red, fontSize: 13, lineHeight: 18 }}>{query.error instanceof Error ? query.error.message : 'Unable to load conversation.'}</Text> : null}
        <MessageList messages={query.data?.messages ?? []} currentRole="admin" />
      </OperatorCard>

      <OperatorCard>
        <Text style={{ color: brand.text, fontSize: 17, fontWeight: '900' }}>Reply</Text>
        <Composer body={body} pending={send.isPending} placeholder="Type your reply..." onChangeBody={setBody} onSubmit={() => send.mutate(body.trim())} />
        {send.error ? <Text selectable style={{ color: brand.red, fontSize: 13, lineHeight: 18 }}>{send.error instanceof Error ? send.error.message : 'Unable to send message.'}</Text> : null}
      </OperatorCard>
    </OperatorScreen>
  );
}

