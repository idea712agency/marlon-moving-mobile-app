import type { Json } from '@/types/supabase';
import { invokeSupabaseFunction } from '@/lib/supabase-functions';

export type QuoteReadiness = 'new' | 'estimate_ready' | 'sent' | 'booked' | 'lost';
export type QuoteWorkspaceStatus = 'new' | 'contacted' | 'sent' | 'booked' | 'won' | 'lost';
export type QuoteWorkspaceAction = 'build_estimate' | 'send_estimate' | 'mark_lost' | 'convert_to_job' | 'message_customer';

export type AdminQuoteListItem = {
  id: string;
  quote_number?: string | null;
  customer_name?: string | null;
  service_type?: string | null;
  move_date?: string | null;
  origin_city?: string | null;
  destination_city?: string | null;
  status?: QuoteWorkspaceStatus | string | null;
  readiness: QuoteReadiness;
  estimate_total?: number | null;
  last_activity_at?: string | null;
  has_estimate?: boolean | null;
  lead_source?: string | null;
};

export type QuotePipelineCounts = Partial<Record<QuoteReadiness, number | null>>;

export type AdminListQuotesResponse = {
  quotes: AdminQuoteListItem[];
  pagination?: {
    next_cursor?: string | null;
    has_more?: boolean | null;
    total?: number | null;
  } | null;
  quote_pipeline?: QuotePipelineCounts | null;
};

export type AdminListQuotesBody = {
  readiness?: QuoteReadiness | null;
  search?: string;
  limit?: number;
  cursor?: string | null;
};

export type AdminQuoteTimelineItem = {
  id?: string | null;
  type?: string | null;
  event_type?: string | null;
  label?: string | null;
  description?: string | null;
  actor_name?: string | null;
  created_at?: string | null;
};

export type AdminQuoteDetail = {
  quote: {
    id: string;
    quote_number?: string | null;
    customer_name?: string | null;
    customer_phone?: string | null;
    customer_email?: string | null;
    contact_id?: string | null;
    service_type?: string | null;
    move_date?: string | null;
    origin?: string | null;
    destination?: string | null;
    origin_city?: string | null;
    destination_city?: string | null;
    home_size?: string | null;
    status?: QuoteWorkspaceStatus | string | null;
    readiness: QuoteReadiness;
    estimate_total?: number | null;
    last_activity_at?: string | null;
    has_estimate?: boolean | null;
    lead_source?: string | null;
    conversation_data?: Json | null;
  };
  lead?: Record<string, unknown> | null;
  estimate?: {
    id?: string | null;
    totals?: Record<string, unknown> | null;
    total?: number | null;
    estimate_total?: number | null;
    status?: string | null;
  } | null;
  job?: {
    id?: string | null;
    job_id?: string | null;
    job_number?: string | null;
    status?: string | null;
    scheduled_date?: string | null;
  } | null;
  timeline?: AdminQuoteTimelineItem[];
  available_actions?: QuoteWorkspaceAction[];
};

export type AdminUpdateQuoteStatusResponse = {
  quote?: AdminQuoteDetail['quote'] | AdminQuoteListItem | null;
};

export function listAdminQuotes(body: AdminListQuotesBody) {
  return invokeSupabaseFunction<AdminListQuotesResponse>('admin-list-quotes', { body });
}

export function getAdminQuoteDetail(quoteId: string) {
  return invokeSupabaseFunction<AdminQuoteDetail>('admin-get-quote-detail', { body: { quote_id: quoteId } });
}

export function updateAdminQuoteStatus(quoteId: string, status: QuoteWorkspaceStatus, reason?: string) {
  return invokeSupabaseFunction<AdminUpdateQuoteStatusResponse>('admin-update-quote-status', {
    body: { quote_id: quoteId, status, reason },
  });
}
