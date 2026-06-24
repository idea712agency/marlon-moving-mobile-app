import type { Database } from '@/types/supabase';

export type Job = Database['public']['Tables']['jobs']['Row'];
export type Invoice = Database['public']['Tables']['invoices']['Row'];
export type Document = Database['public']['Tables']['documents']['Row'];
export type ChecklistItem = Database['public']['Tables']['move_checklist_items']['Row'];
export type CrewLocation = Database['public']['Tables']['crew_locations']['Row'];
export type InventoryItem = Database['public']['Tables']['move_inventory']['Row'];
export type Notification = Database['public']['Tables']['customer_notifications']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Conversation = Database['public']['Tables']['chat_conversations']['Row'];
export type Message = Database['public']['Tables']['chat_messages']['Row'];

export type DashboardData = {
  job: Job | null;
  checklist: ChecklistItem[];
  invoice: Invoice | null;
  crew: CrewLocation | null;
  documents: Document[];
  unread_notifications: number;
};

export const money = (value?: number | null) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value ?? 0);

export const shortDate = (value?: string | null) => {
  if (!value) return 'Not scheduled';
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

export const shortTime = (value?: string | null) => {
  if (!value) return 'Time pending';
  const [hours, minutes] = value.split(':').map(Number);
  const parsed = new Date();
  parsed.setHours(hours, minutes, 0, 0);
  return parsed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Something went wrong. Please try again.';
