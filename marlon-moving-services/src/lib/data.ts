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
export type PortalStatusStage =
  | 'quote_submitted'
  | 'estimate_ready'
  | 'booked'
  | 'preparing'
  | 'move_day'
  | 'payment_pending_review'
  | 'invoice_due'
  | 'complete';

export type PortalStatusTimelineItem = {
  key: string;
  label: string;
  status: 'complete' | 'active' | 'pending';
  caption?: string;
};

export type PortalStatus = {
  stage: PortalStatusStage;
  label: string;
  description: string;
  next_action_label?: string;
  next_action_href?: string;
  current_lead_id?: string | null;
  quote_request_id?: string | null;
  job_id?: string | null;
  invoice_id?: string | null;
  timeline: PortalStatusTimelineItem[];
};

export type DashboardData = {
  job: Job | null;
  checklist: ChecklistItem[];
  invoice: Invoice | null;
  crew: CrewLocation | null;
  documents: Document[];
  unread_notifications: number;
  current_lead: { id: string } | null;
  portal_status?: PortalStatus | null;
};

export type ManualPaymentMethod = 'zelle' | 'bank_transfer' | 'check' | 'cash';
export type ManualPaymentStatus = 'submitted' | 'reviewed' | 'approved' | 'rejected';

export type PaymentMethod = {
  method: ManualPaymentMethod;
  label: string;
  description?: string | null;
  instructions?: string | null;
  requires_reference?: boolean | null;
};

export type ManualPaymentSubmission = {
  id: string;
  invoice_id: string;
  job_id?: string | null;
  customer_user_id: string;
  method: ManualPaymentMethod;
  amount: number;
  payment_date: string;
  reference_number?: string | null;
  notes?: string | null;
  proof_file_path?: string | null;
  status: ManualPaymentStatus;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at?: string | null;
};

export type PaymentDetail = {
  invoice: Invoice | null;
  job?: Job | null;
  methods: PaymentMethod[];
  submissions: ManualPaymentSubmission[];
};

export type DocumentDetail = {
  document: Document | null;
  signed: boolean;
  signer_name?: string | null;
  signed_at?: string | null;
  signed_url?: string | null;
  html_preview_url?: string | null;
  is_pdf?: boolean | null;
  is_html_snapshot?: boolean | null;
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
