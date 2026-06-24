import { Send } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { CustomerCard, CustomerEmpty, CustomerShell } from '@/components/customer/customer-shell';
import { brand } from '@/constants/operator-brand';
import { useCustomerDashboard } from '@/hooks/use-customer-dashboard';
import { errorMessage, type Conversation, type Message } from '@/lib/data';
import { supabase } from '@/lib/supabase';

export default function CustomerMessagesScreen() {
  const dashboard = useCustomerDashboard();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const jobId = dashboard.data?.job?.id;

  useEffect(() => {
    let active = true;
    const loadMessages = async () => {
      setLoadingMessages(true);
      setError('');
      const { data: conversationData, error: conversationError } = await supabase
        .from('chat_conversations')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!active) return;
      if (conversationError) {
        setError(errorMessage(conversationError));
        setLoadingMessages(false);
        return;
      }
      setConversation(conversationData);
      if (!conversationData) {
        setMessages([]);
        setLoadingMessages(false);
        return;
      }
      const { data: messageData, error: messageError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationData.id)
        .order('created_at', { ascending: true });
      if (!active) return;
      if (messageError) setError(errorMessage(messageError));
      setMessages(messageData ?? []);
      setLoadingMessages(false);
    };
    void loadMessages();
    return () => { active = false; };
  }, [jobId]);

  const sendMessage = async () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    setSending(true);
    setError('');
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('mobile-send-message', { body: { job_id: jobId, content: trimmed } });
      if (invokeError) throw invokeError;
      const response = data as { conversation?: Conversation; message?: Message };
      if (response.conversation) setConversation(response.conversation);
      if (response.message) setMessages((current) => [...current, response.message as Message]);
      setContent('');
    } catch (sendError) {
      setError(errorMessage(sendError));
    } finally {
      setSending(false);
    }
  };

  return (
    <CustomerShell title="Messages" subtitle="Chat directly with the Marlon Moving team." unread={dashboard.data?.unread_notifications ?? 0}>
      {dashboard.isLoading || loadingMessages ? <ActivityIndicator color={brand.blue} /> : null}
      {error ? <CustomerEmpty title="Messages unavailable" body={error} /> : null}
      {!error && !messages.length ? <CustomerEmpty title="No messages yet" body="Send a message below and our team will reply as soon as possible." /> : null}
      {messages.map((message) => {
        const mine = message.role === 'customer' || Boolean(message.customer_user_id);
        return (
          <View key={message.id} style={{ alignItems: mine ? 'flex-end' : 'flex-start' }}>
            <View style={{ maxWidth: '86%', borderRadius: 18, borderCurve: 'continuous', backgroundColor: mine ? brand.blue : brand.surface, borderWidth: mine ? 0 : 1, borderColor: brand.border, padding: 12 }}>
              <Text selectable style={{ color: mine ? '#FFFFFF' : brand.text, lineHeight: 20 }}>{message.content}</Text>
            </View>
          </View>
        );
      })}
      <CustomerCard>
        <Text style={{ color: brand.text, fontWeight: '900' }}>New message</Text>
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder={conversation ? 'Type your message…' : 'Ask us anything about your move…'}
          placeholderTextColor="#94A3B8"
          multiline
          style={{ minHeight: 92, borderWidth: 1, borderColor: brand.border, borderRadius: 14, padding: 12, color: brand.text, textAlignVertical: 'top' }}
        />
        <Pressable disabled={sending} onPress={() => void sendMessage()} style={{ minHeight: 48, borderRadius: 14, backgroundColor: brand.blue, opacity: sending ? 0.6 : 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Send color="#FFFFFF" size={17} />
          <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '900' }}>{sending ? 'Sending…' : 'Send message'}</Text>
        </Pressable>
      </CustomerCard>
    </CustomerShell>
  );
}
