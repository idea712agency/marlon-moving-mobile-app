import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { CustomerCard, CustomerEmpty, CustomerShell } from '@/components/customer/customer-shell';
import { brand } from '@/constants/operator-brand';
import { useCustomerDashboard } from '@/hooks/use-customer-dashboard';
import type { Conversation, Message } from '@/lib/data';
import { errorMessage, shortDate, shortTime } from '@/lib/data';
import { invokeSupabaseFunction } from '@/lib/supabase-functions';

type MessagesResponse = {
  conversation: Conversation | null;
  messages: Message[];
};

type SendMessageResponse = {
  conversation?: Conversation;
  message?: Message;
};

export default function CustomerMessagesScreen() {
  const dashboard = useCustomerDashboard();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const job = dashboard.data?.job ?? null;
  const jobId = job?.id;

  const messages = useQuery({
    queryKey: ['customer-messages', jobId ?? 'current'],
    enabled: !dashboard.isLoading,
    queryFn: () => invokeSupabaseFunction<MessagesResponse>('mobile-get-messages', { body: jobId ? { job_id: jobId } : {} }),
  });

  const send = useMutation({
    mutationFn: async (nextContent: string) =>
      invokeSupabaseFunction<SendMessageResponse>('mobile-send-message', {
        body: { job_id: jobId, content: nextContent },
      }),
    onSuccess: async () => {
      setContent('');
      await queryClient.invalidateQueries({ queryKey: ['customer-messages', jobId ?? 'current'] });
      await queryClient.invalidateQueries({ queryKey: ['customer-dashboard'] });
    },
  });

  const submit = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    send.mutate(trimmed);
  };

  const error = dashboard.error || messages.error || send.error;
  const items = messages.data?.messages ?? [];

  return (
    <CustomerShell title="Messages" subtitle="Chat directly with the Marlon Moving team." unread={dashboard.data?.unread_notifications ?? 0}>
      {dashboard.isLoading || messages.isLoading ? <ActivityIndicator color={brand.blue} /> : null}
      {error ? <CustomerEmpty title="Messages unavailable" body={errorMessage(error)} /> : null}
      {job ? <CurrentMoveHeader title={job.job_number} subtitle={`${shortDate(job.scheduled_date)} · ${shortTime(job.scheduled_start_time)}`} /> : null}
      {!dashboard.isLoading && !job ? <CustomerEmpty title="No linked move" body="Messages will be available once your move is linked." /> : null}
      {!error && job && !items.length ? <CustomerEmpty title="No messages yet" body="Send a message below and our team will reply as soon as possible." /> : null}
      {items.map((message) => {
        const mine = message.role === 'customer' || Boolean(message.customer_user_id);
        return (
          <View key={message.id} style={{ alignItems: mine ? 'flex-end' : 'flex-start' }}>
            <View style={{ maxWidth: '86%', borderRadius: 18, borderCurve: 'continuous', backgroundColor: mine ? brand.blue : brand.surface, borderWidth: mine ? 0 : 1, borderColor: brand.border, padding: 12 }}>
              <Text selectable style={{ color: mine ? '#FFFFFF' : brand.text, lineHeight: 20 }}>{message.content}</Text>
            </View>
          </View>
        );
      })}
      {job ? (
        <CustomerCard>
          <Text style={{ color: brand.text, fontWeight: '900' }}>New message</Text>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder={messages.data?.conversation ? 'Type your message...' : 'Ask us anything about your move...'}
            placeholderTextColor="#94A3B8"
            multiline
            style={{ minHeight: 92, borderWidth: 1, borderColor: brand.border, borderRadius: 14, padding: 12, color: brand.text, textAlignVertical: 'top' }}
          />
          <Pressable disabled={send.isPending || !content.trim()} onPress={submit} style={{ minHeight: 48, borderRadius: 14, backgroundColor: brand.blue, opacity: send.isPending || !content.trim() ? 0.6 : 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Send color="#FFFFFF" size={17} />
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '900' }}>{send.isPending ? 'Sending...' : 'Send message'}</Text>
          </Pressable>
        </CustomerCard>
      ) : null}
    </CustomerShell>
  );
}

function CurrentMoveHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <CustomerCard>
      <Text style={{ color: brand.muted, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' }}>Current move</Text>
      <Text selectable style={{ color: brand.text, fontSize: 18, fontWeight: '900' }}>{title}</Text>
      <Text selectable style={{ color: brand.muted, fontSize: 13 }}>{subtitle}</Text>
    </CustomerCard>
  );
}
