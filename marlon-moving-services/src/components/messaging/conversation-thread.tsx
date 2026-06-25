import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { brand } from '@/constants/operator-brand';
import {
  customerGetConversation,
  customerSendMessage,
  messageText,
  validateMessageBody,
  type ConversationDetail,
  type ConversationMessage,
} from '@/lib/messaging';

type CustomerConversationThreadProps = {
  title?: string;
  jobId?: string | null;
  quoteId?: string | null;
};

export function CustomerConversationThread({ title = 'Messages', jobId, quoteId }: CustomerConversationThreadProps) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState('');
  const key = ['customer-conversation', jobId ?? 'none', quoteId ?? 'none'] as const;
  const query = useQuery({
    queryKey: key,
    enabled: Boolean(jobId || quoteId),
    queryFn: () => customerGetConversation({ job_id: jobId ?? undefined, quote_id: quoteId ?? undefined }),
    refetchInterval: 15000,
  });
  const send = useMutation({
    mutationFn: (nextBody: string) =>
      customerSendMessage({
        conversation_id: query.data?.conversation?.id,
        job_id: jobId ?? undefined,
        quote_id: quoteId ?? undefined,
        body: nextBody,
      }),
    onSuccess: async () => {
      setBody('');
      await queryClient.invalidateQueries({ queryKey: key });
      await queryClient.invalidateQueries({ queryKey: ['customer-document-notification-count'] });
    },
  });

  const submit = () => {
    const error = validateMessageBody(body);
    if (error) return;
    send.mutate(body.trim());
  };

  if (!jobId && !quoteId) return null;

  return (
    <View style={{ backgroundColor: brand.surface, borderRadius: 20, borderCurve: 'continuous', borderWidth: 1, borderColor: brand.border, padding: 16, gap: 12, boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}>
      <Text selectable style={{ color: brand.text, fontSize: 18, fontWeight: '900' }}>{title}</Text>
      {query.isLoading ? <ActivityIndicator color={brand.blue} /> : null}
      {query.error ? <Text selectable style={{ color: brand.red, fontSize: 13, lineHeight: 18 }}>{query.error instanceof Error ? query.error.message : 'Unable to load messages.'}</Text> : null}
      <MessageList messages={query.data?.messages ?? []} currentRole="customer" />
      <Composer body={body} pending={send.isPending} placeholder="Type your message..." onChangeBody={setBody} onSubmit={submit} />
      {send.error ? <Text selectable style={{ color: brand.red, fontSize: 13, lineHeight: 18 }}>{send.error instanceof Error ? send.error.message : 'Unable to send message.'}</Text> : null}
    </View>
  );
}

export function MessageList({ messages, currentRole }: { messages: ConversationDetail['messages']; currentRole: 'admin' | 'customer' }) {
  if (!messages.length) {
    return <Text selectable style={{ color: brand.muted, fontSize: 13, lineHeight: 18 }}>No messages yet.</Text>;
  }
  return (
    <View style={{ gap: 10 }}>
      {messages.map((message) => {
        const mine = senderRole(message) === currentRole;
        return (
          <View key={message.id} style={{ alignItems: mine ? 'flex-end' : 'flex-start' }}>
            <View style={{ maxWidth: '86%', borderRadius: 18, borderCurve: 'continuous', backgroundColor: mine ? brand.blue : brand.bg, borderWidth: mine ? 0 : 1, borderColor: brand.border, padding: 12, gap: 4 }}>
              <Text selectable style={{ color: mine ? '#FFFFFF' : brand.text, lineHeight: 20 }}>{messageText(message)}</Text>
              <Text style={{ color: mine ? 'rgba(255,255,255,0.72)' : brand.muted, fontSize: 10, fontWeight: '800' }}>{relativeTime(message.created_at)}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function Composer({
  body,
  pending,
  placeholder,
  onChangeBody,
  onSubmit,
}: {
  body: string;
  pending: boolean;
  placeholder: string;
  onChangeBody: (value: string) => void;
  onSubmit: () => void;
}) {
  const error = body ? validateMessageBody(body) : '';
  return (
    <View style={{ gap: 9 }}>
      <TextInput
        value={body}
        onChangeText={onChangeBody}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        multiline
        style={{ minHeight: 92, borderWidth: 1, borderColor: error ? brand.red : brand.border, borderRadius: 14, padding: 12, color: brand.text, textAlignVertical: 'top' }}
      />
      {error ? <Text selectable style={{ color: brand.red, fontSize: 12, lineHeight: 17, fontWeight: '800' }}>{error}</Text> : null}
      <Pressable disabled={pending || Boolean(validateMessageBody(body))} onPress={onSubmit} style={{ minHeight: 48, borderRadius: 14, backgroundColor: brand.blue, opacity: pending || Boolean(validateMessageBody(body)) ? 0.6 : 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Send color="#FFFFFF" size={17} />
        <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '900' }}>{pending ? 'Sending...' : 'Send message'}</Text>
      </Pressable>
    </View>
  );
}

function senderRole(message: ConversationMessage) {
  return message.sender_role ?? message.role ?? 'system';
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

