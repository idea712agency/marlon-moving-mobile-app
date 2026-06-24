import type { Database, Json } from '@/types/supabase';
import { estimateFromUnknown, hasPackingCharge, priceRange, type EstimatePayload } from '@/lib/adminEstimate';
import { supabase } from '@/lib/supabase';

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'won' | 'lost';

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

export async function convertEstimateToJob(quote: AdminQuote, estimate: EstimatePayload) {
  if (estimate.converted_job_id) {
    return { jobId: estimate.converted_job_id, alreadyConverted: true as const };
  }
  if (!estimate.schedule.moveDate) throw new Error('Add a move date before converting this estimate.');
  if (!estimate.addresses.origin || !estimate.addresses.destination) {
    throw new Error('Origin and destination are required before conversion.');
  }

  const { data: jobNumber, error: numberError } = await supabase.rpc('generate_job_number');
  if (numberError) throw numberError;
  const grid = priceRange(estimate);
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .insert({
      job_number: jobNumber,
      quote_request_id: quote.id,
      contact_id: estimate.contact.contactId ?? quote.contact_id,
      origin_address: estimate.addresses.origin,
      destination_address: estimate.addresses.destination,
      scheduled_date: estimate.schedule.moveDate,
      scheduled_start_time: estimate.schedule.arrivalWindow || null,
      job_type: 'local_move',
      service_category: 'moving',
      home_size: estimate.addresses.homeSize || null,
      crew_size: estimate.crew.size,
      hourly_rate: estimate.crew.hourlyRate,
      truck_fee: estimate.crew.truckFee,
      truck_size: estimate.crew.truckSize || null,
      estimated_duration_hours: estimate.hours[0] ?? estimate.crew.minimumHours,
      estimated_total: grid.max,
      packing_service_included: hasPackingCharge(estimate),
      payment_status: estimate.deposit.paidAmount > 0 ? 'deposit_paid' : 'pending',
      status: 'scheduled',
      special_instructions: estimate.notes || null,
    })
    .select('id')
    .single();
  if (jobError) throw jobError;

  const nextEstimate = { ...estimate, converted_job_id: job.id };
  const conversation = asRecord(quote.conversation_data);
  const { error: quoteError } = await supabase
    .from('quote_requests')
    .update({
      status: 'won',
      conversation_data: {
        ...conversation,
        estimate: nextEstimate as unknown as Json,
      },
    })
    .eq('id', quote.id);

  if (quoteError) {
    const recovery = new Error(
      `Job ${job.id} was created, but the quote could not be marked converted. Open that job and manually recover this quote before trying again.`,
    );
    recovery.name = 'PartialConversionError';
    throw recovery;
  }
  return { jobId: job.id, alreadyConverted: false as const };
}
