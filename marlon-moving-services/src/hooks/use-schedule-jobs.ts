import { useQuery } from '@tanstack/react-query';

import type { ScheduleJob } from '@/components/operator/schedule/JobRow';
import { supabase } from '@/lib/supabase';

export function useScheduleJobs(rangeStart: string, rangeEnd: string) {
  return useQuery({
    queryKey: ['operator-schedule', rangeStart, rangeEnd],
    queryFn: async () => {
      const { data, error } = await (supabase.from('jobs') as any)
        .select(
          'id, job_number, scheduled_date, scheduled_start_time, status, dispatch_status, origin_address, destination_address, crew_size, truck_size, contacts(name)',
        )
        .gte('scheduled_date', rangeStart)
        .lte('scheduled_date', rangeEnd)
        .order('scheduled_date', { ascending: true })
        .order('scheduled_start_time', { ascending: true });

      if (error) throw error;
      return (data ?? []) as ScheduleJob[];
    },
  });
}
