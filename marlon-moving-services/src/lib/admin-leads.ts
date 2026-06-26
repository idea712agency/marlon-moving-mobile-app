import { invokeSupabaseFunction } from '@/lib/supabase-functions';

export type ConvertLeadToJobResponse = {
  job_id: string;
  lead_id: string;
  contact_id: string | null;
  already_converted: boolean;
};

export function convertLeadToJob(leadId: string) {
  return invokeSupabaseFunction<ConvertLeadToJobResponse>('admin-convert-lead-to-job', {
    body: { lead_id: leadId },
  });
}
