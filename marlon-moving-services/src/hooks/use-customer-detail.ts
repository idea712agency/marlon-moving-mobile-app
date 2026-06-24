import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export function useCustomerDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['operator-customer', id],
    enabled: Boolean(id),
    queryFn: async () => {
      if (!id) throw new Error('Missing customer id');

      const [contactResult, jobsResult, invoicesResult] = await Promise.all([
        supabase.from('contacts').select('*').eq('id', id).maybeSingle(),
        supabase
          .from('jobs')
          .select('id, job_number, scheduled_date, status, estimated_total')
          .eq('contact_id', id)
          .order('scheduled_date', { ascending: false })
          .limit(20),
        supabase
          .from('invoices')
          .select('id, invoice_number, total, status, due_date')
          .eq('contact_id', id)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      if (contactResult.error) throw contactResult.error;
      if (jobsResult.error) throw jobsResult.error;
      if (invoicesResult.error) throw invoicesResult.error;

      return {
        contact: contactResult.data,
        jobs: jobsResult.data ?? [],
        invoices: invoicesResult.data ?? [],
      };
    },
  });
}
