import {
  ARRIVAL_WINDOWS,
  customerEstimateDefaults,
  EstimateSchema,
  type CustomerEstimatePayload,
} from '@/lib/estimate-schema';
import { supabase } from '@/lib/supabase';
import type { Json } from '@/types/supabase';

export type CustomerLead = {
  id: string;
  created_at: string;
  status: string;
  move_type: string | null;
  move_date: string | null;
  origin_address: string | null;
  destination_address: string | null;
  estimate_payload: Json | null;
  revision_of: string | null;
};

const LEAD_FIELDS =
  'id, created_at, status, move_type, move_date, origin_address, destination_address, estimate_payload, revision_of';

export async function listCustomerQuoteRequests() {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error('Sign in to view your quote requests.');

  const { data, error } = await (supabase.from('leads') as any)
    .select(LEAD_FIELDS)
    .eq('customer_user_id', userData.user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as CustomerLead[];
}

export async function getCustomerQuoteRequest(id: string) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error('Sign in to view this quote request.');

  const { data, error } = await (supabase.from('leads') as any)
    .select(LEAD_FIELDS)
    .eq('id', id)
    .eq('customer_user_id', userData.user.id)
    .single();
  if (error) throw error;
  return data as unknown as CustomerLead;
}

export function customerEstimateFromLead(lead: CustomerLead): CustomerEstimatePayload {
  const defaults = customerEstimateDefaults();
  const raw = asRecord(lead.estimate_payload);
  const nested = asRecord(raw.payload);
  const source = Object.keys(nested).length ? nested : raw;
  const contact = asRecord(source.contact);
  const rawInventory = Array.isArray(source.inventory) ? source.inventory : [];
  const inventory = rawInventory
    .map((item) => {
      const row = asRecord(item);
      const label = stringValue(row.label ?? row.name ?? row.item);
      if (!label) return null;
      const quantity = Number(row.qty ?? row.quantity ?? 1);
      return { label, qty: Number.isFinite(quantity) && quantity > 0 ? Math.round(quantity) : 1 };
    })
    .filter((item): item is { label: string; qty: number } => Boolean(item));
  const arrivalWindow = stringValue(source.arrivalWindow ?? source.arrival_window);
  const preferredMethod = stringValue(contact.preferredMethod ?? contact.preferred_method);
  const normalized = {
    ...defaults,
    moveType: normalizeMoveType(source.moveType ?? source.move_type ?? lead.move_type),
    pickup: stringValue(source.pickup ?? source.origin ?? source.origin_address ?? lead.origin_address),
    delivery: stringValue(source.delivery ?? source.destination ?? source.destination_address ?? lead.destination_address),
    propertyTags: stringArray(source.propertyTags ?? source.property_tags ?? source.rooms ?? source.homeDetails),
    inventory,
    services: stringArray(source.services),
    moveDate: stringValue(source.moveDate ?? source.move_date ?? lead.move_date) || defaults.moveDate,
    arrivalWindow: ARRIVAL_WINDOWS.includes(arrivalWindow as (typeof ARRIVAL_WINDOWS)[number])
      ? arrivalWindow
      : defaults.arrivalWindow,
    notes: stringValue(source.notes),
    photoPaths: stringArray(source.photoPaths ?? source.photo_paths ?? source.photos),
    contact: {
      name: stringValue(contact.name ?? source.name),
      email: stringValue(contact.email ?? source.email),
      phone: stringValue(contact.phone ?? source.phone),
      preferredMethod: ['phone', 'email', 'text'].includes(preferredMethod)
        ? preferredMethod
        : defaults.contact.preferredMethod,
    },
    honeypot: '',
  };
  const parsed = EstimateSchema.safeParse(normalized);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || 'This request does not contain a complete estimate payload.');
  }
  return parsed.data;
}

export async function createEstimatePhotoUrls(paths: string[]) {
  if (!paths.length) return [] as { path: string; url: string }[];
  const results = await Promise.all(
    paths.map(async (path) => {
      const { data, error } = await supabase.storage.from('estimate-photos').createSignedUrl(path, 60 * 30);
      if (error) return null;
      return { path, url: data.signedUrl };
    }),
  );
  return results.filter((item): item is { path: string; url: string } => Boolean(item));
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};

const stringValue = (value: unknown) => typeof value === 'string' ? value.trim() : '';

const stringArray = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => typeof item === 'string' ? item : stringValue(asRecord(item).label ?? asRecord(item).name ?? asRecord(item).path))
    .filter(Boolean);
};

const normalizeMoveType = (value: unknown): CustomerEstimatePayload['moveType'] => {
  const normalized = stringValue(value).toLowerCase();
  return normalized === 'office' || normalized === 'commercial' ? 'office' : 'residential';
};
