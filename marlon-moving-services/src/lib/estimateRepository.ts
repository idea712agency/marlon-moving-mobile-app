import type { Database, Json } from '@/types/supabase';
import { estimateFromUnknown, isEstimatePayload, priceRange, type EstimatePayload } from '@/lib/adminEstimate';
import { supabase } from '@/lib/supabase';

export type QuoteStatus = 'new' | 'draft' | 'sent' | 'accepted' | 'declined' | 'won' | 'lost';

export type QuoteContact = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

export type AdminQuote = Database['public']['Tables']['quote_requests']['Row'] & {
  contacts: QuoteContact | null;
};

const asRecord = (value: Json | null): Record<string, Json> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, Json>;
};

export type BookEstimateResponse = {
  job_id: string;
  quote_request_id: string;
  already_converted: boolean;
};

export const estimateFromQuote = (quote: AdminQuote) => {
  const conversation = asRecord(quote.conversation_data);
  const saved = estimateFromUnknown(conversation.estimate);
  if (conversation.estimate) return saved;

  return {
    ...saved,
    contact: {
      contactId: quote.contacts?.id ?? quote.contact_id,
      name: quote.contacts?.name ?? '',
      phone: quote.contacts?.phone ?? '',
      email: quote.contacts?.email ?? '',
    },
    addresses: {
      origin: quote.origin,
      destination: quote.destination,
      homeSize: quote.home_size,
    },
    schedule: {
      ...saved.schedule,
      moveDate: quote.move_date ?? '',
    },
  } satisfies EstimatePayload;
};

export async function fetchQuote(id: string) {
  const { data, error } = await supabase
    .from('quote_requests')
    .select('*, contacts(id, name, phone, email)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as unknown as AdminQuote;
}

export async function saveEstimate({
  quote,
  estimate,
  status,
  userId,
  createQuote = false,
}: {
  quote: AdminQuote;
  estimate: EstimatePayload;
  status: QuoteStatus;
  userId: string;
  createQuote?: boolean;
}) {
  let contactId = estimate.contact.contactId || quote.contact_id;

  if (contactId) {
    const { error: contactError } = await supabase
      .from('contacts')
      .update({
        name: estimate.contact.name.trim(),
        phone: estimate.contact.phone.trim() || null,
        email: estimate.contact.email.trim() || null,
      })
      .eq('id', contactId);
    if (contactError) throw contactError;
  } else if (estimate.contact.name.trim() && estimate.contact.phone.trim()) {
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .insert({
        name: estimate.contact.name.trim(),
        phone: estimate.contact.phone.trim() || null,
        email: estimate.contact.email.trim() || null,
        contact_type: 'customer',
        status: 'active',
        user_id: userId,
      })
      .select('id')
      .single();
    if (contactError) throw contactError;
    contactId = contact.id;
  }

  const nextEstimate: EstimatePayload = {
    ...estimate,
    contact: { ...estimate.contact, contactId: contactId ?? null },
  };
  const conversation = asRecord(quote.conversation_data);
  const range = priceRange(nextEstimate);
  const payload = {
      contact_id: contactId ?? null,
      origin: nextEstimate.addresses.origin || 'TBD',
      destination: nextEstimate.addresses.destination || 'TBD',
      home_size: 'custom',
      move_date: nextEstimate.schedule.moveDate || null,
      estimated_price_min: range.min,
      estimated_price_max: range.max,
      status,
      conversation_data: {
        ...conversation,
        estimate: nextEstimate as unknown as Json,
      },
    };
  const request = createQuote
    ? supabase.from('quote_requests').insert(payload)
    : supabase.from('quote_requests').update(payload).eq('id', quote.id);
  const { data, error } = await request.select('*, contacts(id, name, phone, email)').single();
  if (error) throw error;
  return { quote: data as unknown as AdminQuote, estimate: nextEstimate };
}

export function savedEstimateFromQuote(quote: AdminQuote) {
  const conversation = asRecord(quote.conversation_data);
  return isEstimatePayload(conversation.estimate) ? conversation.estimate : null;
}

export function convertedJobIdFromQuote(quote: AdminQuote) {
  return savedEstimateFromQuote(quote)?.converted_job_id ?? null;
}

export function validateBookableQuote(quote: AdminQuote) {
  const savedEstimate = savedEstimateFromQuote(quote);
  if (!savedEstimate) return 'Save an estimate before booking this move.';
  if (!(savedEstimate.contact.contactId || quote.contact_id)) return 'Save a customer contact before booking this move.';
  if (!quote.origin.trim()) return 'Add an origin address before booking this move.';
  if (!quote.destination.trim()) return 'Add a destination address before booking this move.';
  if (!quote.move_date) return 'Add a move date before booking this move.';
  return '';
}

export async function bookEstimate(quote: AdminQuote) {
  const validation = validateBookableQuote(quote);
  if (validation) throw new Error(validation);

  const { data, error } = await supabase.functions.invoke('book-estimate', {
    body: { quote_request_id: quote.id },
  });
  if (error) throw error;
  return data as BookEstimateResponse;
}
