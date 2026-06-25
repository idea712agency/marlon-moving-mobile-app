import { invokeSupabaseFunction } from '@/lib/supabase-functions';

export type ConversationSubjectType = 'job' | 'quote';
export type SenderRole = 'admin' | 'customer' | 'system';

export type ConversationSummary = {
  id: string;
  conversation_id?: string | null;
  job_id?: string | null;
  quote_id?: string | null;
  subject_type?: ConversationSubjectType | string | null;
  subject_label?: string | null;
  subject?: string | null;
  customer_name?: string | null;
  job_number?: string | null;
  origin?: string | null;
  destination?: string | null;
  preview?: string | null;
  last_message_preview?: string | null;
  last_message_at?: string | null;
  last_sender_role?: SenderRole | string | null;
  unread_admin_count?: number | null;
  unread_customer_count?: number | null;
};

export type ConversationMessage = {
  id: string;
  conversation_id?: string | null;
  sender_user_id?: string | null;
  sender_role?: SenderRole | string | null;
  role?: SenderRole | string | null;
  body?: string | null;
  content?: string | null;
  attachments?: unknown;
  created_at: string;
};

export type ConversationDetail = {
  conversation: ConversationSummary | null;
  messages: ConversationMessage[];
  pagination?: {
    next_cursor?: string | null;
  } | null;
};

export type ConversationListResponse = {
  conversations: ConversationSummary[];
  pagination?: {
    next_cursor?: string | null;
  } | null;
};

export type SendMessageResponse = {
  conversation_id?: string | null;
  conversation?: ConversationSummary | null;
  message?: ConversationMessage | null;
};

export const MESSAGE_MAX_LENGTH = 5000;

export function validateMessageBody(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return 'Type a message before sending.';
  if (trimmed.length > MESSAGE_MAX_LENGTH) return `Messages can be up to ${MESSAGE_MAX_LENGTH.toLocaleString()} characters.`;
  return '';
}

export function adminListConversations(body: { subject_type?: ConversationSubjectType | 'unread' | null; search?: string; cursor?: string | null } = {}) {
  return invokeSupabaseFunction<ConversationListResponse>('admin-list-conversations', { body });
}

export function adminGetConversation(conversationId: string, cursor?: string | null) {
  return invokeSupabaseFunction<ConversationDetail>('admin-get-conversation', {
    body: { conversation_id: conversationId, cursor },
  });
}

export function adminSendMessage(body: { conversation_id?: string; job_id?: string; quote_id?: string; body: string }) {
  return invokeSupabaseFunction<SendMessageResponse>('admin-send-message', { body });
}

export function customerGetConversation(body: { conversation_id?: string; job_id?: string; quote_id?: string; cursor?: string | null }) {
  return invokeSupabaseFunction<ConversationDetail>('customer-get-conversation', { body });
}

export function customerSendMessage(body: { conversation_id?: string; job_id?: string; quote_id?: string; body: string }) {
  return invokeSupabaseFunction<SendMessageResponse>('customer-send-message', { body });
}

export function conversationIdFromResponse(response?: SendMessageResponse | null) {
  return response?.conversation_id ?? response?.conversation?.id ?? response?.message?.conversation_id ?? null;
}

export function messageText(message: ConversationMessage) {
  return message.body ?? message.content ?? '';
}

export function conversationPreview(conversation: ConversationSummary) {
  return conversation.preview ?? conversation.last_message_preview ?? 'No messages yet.';
}

export function conversationSubject(conversation: ConversationSummary) {
  if (conversation.subject_label) return conversation.subject_label;
  if (conversation.subject) return conversation.subject;
  if (conversation.job_number) return `Move ${conversation.job_number}`;
  if (conversation.quote_id) return 'Quote';
  if (conversation.job_id) return 'Move';
  return 'Conversation';
}

