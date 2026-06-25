import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { invokeSupabaseFunction } from '@/lib/supabase-functions';
import type { ManualPaymentSubmission } from '@/lib/data';
import type { Database, Json } from '@/types/supabase';

export type OperatorJob = Database['public']['Tables']['jobs']['Row'];
export type OperatorContact = Database['public']['Tables']['contacts']['Row'];
export type OperatorInvoice = Database['public']['Tables']['invoices']['Row'];
export type OperatorDocument = Database['public']['Tables']['documents']['Row'];
export type OperatorInventoryItem = Database['public']['Tables']['move_inventory']['Row'];
export type OperatorChecklistItem = Database['public']['Tables']['move_checklist_items']['Row'];
export type OperatorCrewLocation = Database['public']['Tables']['crew_locations']['Row'];
export type OperatorConversation = Database['public']['Tables']['chat_conversations']['Row'];
export type OperatorMessage = Database['public']['Tables']['chat_messages']['Row'];
export type OperatorActivity = Database['public']['Tables']['job_activities']['Row'];
export type OperatorQuoteRequest = Database['public']['Tables']['quote_requests']['Row'];
export type OperatorLead = Database['public']['Tables']['leads']['Row'];

export type OperatorJobDetail = {
  job: OperatorJob;
  contact: OperatorContact | null;
  invoice: OperatorInvoice | null;
  documents: OperatorDocument[];
  inventory: OperatorInventoryItem[];
  checklist: OperatorChecklistItem[];
  crew_location: OperatorCrewLocation | null;
  conversation: OperatorConversation | null;
  messages: OperatorMessage[];
  activities: OperatorActivity[];
  manual_payments?: ManualPaymentSubmission[];
  quote_request?: OperatorQuoteRequest | null;
  lead?: OperatorLead | null;
};

type AdminFunctionResponse<T> = {
  ok?: boolean;
  data?: T;
  error?: string;
  message?: string;
};

type JobPatch = Partial<
  Pick<
    OperatorJob,
    | 'status'
    | 'scheduled_date'
    | 'scheduled_start_time'
    | 'internal_notes'
    | 'crew_size'
    | 'truck_size'
    | 'crew_members'
    | 'actual_total'
  >
> & { dispatch_status?: string | null };

type InvoicePatch = Partial<Pick<OperatorInvoice, 'status' | 'due_date' | 'notes' | 'paid_at'>>;

async function invokeAdmin<T>(name: string, body: Record<string, unknown>) {
  const result = await invokeSupabaseFunction<AdminFunctionResponse<T>>(name, { body });
  if (result?.ok === false) throw new Error(result.error || result.message || `${name} failed.`);
  if (!('data' in result)) throw new Error(`${name} returned no data.`);
  return result.data as T;
}

export function useOperatorJob(jobId: string | undefined) {
  return useQuery({
    queryKey: ['operator-job', jobId],
    enabled: Boolean(jobId),
    queryFn: async () => {
      if (!jobId) throw new Error('Missing job id.');
      return invokeAdmin<OperatorJobDetail>('admin-get-job-detail', { job_id: jobId });
    },
  });
}

export function useOperatorJobActions(jobId: string | undefined) {
  const queryClient = useQueryClient();
  const invalidate = async (nextJobId = jobId) => {
    if (nextJobId) await queryClient.invalidateQueries({ queryKey: ['operator-job', nextJobId] });
    await queryClient.invalidateQueries({ queryKey: ['operator-moves'] });
    await queryClient.invalidateQueries({ queryKey: ['operator-schedule'] });
  };

  const updateJob = useMutation({
    mutationFn: async (patch: JobPatch) => {
      if (!jobId) throw new Error('Missing job id.');
      return invokeAdmin<OperatorJob>('admin-update-job', { job_id: jobId, patch });
    },
    onSuccess: () => void invalidate(),
  });

  const updateChecklistItem = useMutation({
    mutationFn: async ({ itemId, completed }: { itemId: string; completed: boolean }) =>
      invokeAdmin<OperatorChecklistItem>('admin-update-job-checklist-item', { item_id: itemId, completed }),
    onSuccess: () => void invalidate(),
  });

  const assignCrew = useMutation({
    mutationFn: async (payload: { crew_members: Json[]; crew_size?: number | null; truck_size?: string | null; assigned_to?: string | null }) => {
      if (!jobId) throw new Error('Missing job id.');
      return invokeAdmin<OperatorJob>('admin-assign-job-crew', { job_id: jobId, ...payload });
    },
    onSuccess: () => void invalidate(),
  });

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!jobId) throw new Error('Missing job id.');
      return invokeAdmin<OperatorMessage>('admin-send-job-message', { job_id: jobId, content });
    },
    onSuccess: () => void invalidate(),
  });

  const updateInvoice = useMutation({
    mutationFn: async ({ invoiceId, patch }: { invoiceId: string; patch: InvoicePatch }) =>
      invokeAdmin<OperatorInvoice>('admin-update-job-invoice', { invoice_id: invoiceId, patch }),
    onSuccess: () => void invalidate(),
  });

  const reviewManualPayment = useMutation({
    mutationFn: async ({ submissionId, action, rejectionReason }: { submissionId: string; action: 'approve' | 'reject'; rejectionReason?: string }) =>
      invokeAdmin<ManualPaymentSubmission>('admin-review-manual-payment', {
        submission_id: submissionId,
        action,
        rejection_reason: rejectionReason?.trim() || undefined,
      }),
    onSuccess: () => void invalidate(),
  });

  const logActivity = useMutation({
    mutationFn: async ({ description, activity_type, metadata }: { description: string; activity_type?: string; metadata?: Json }) => {
      if (!jobId) throw new Error('Missing job id.');
      return invokeAdmin<OperatorActivity>('admin-log-job-activity', { job_id: jobId, description, activity_type, metadata });
    },
    onSuccess: () => void invalidate(),
  });

  return { updateJob, updateChecklistItem, assignCrew, sendMessage, updateInvoice, reviewManualPayment, logActivity };
}
