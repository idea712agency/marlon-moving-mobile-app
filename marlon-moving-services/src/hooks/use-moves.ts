import { useQuery } from '@tanstack/react-query';

import type { MoveListItem } from '@/components/operator/MoveCard';
import { supabase } from '@/lib/supabase';

export type MoveFilter = 'all' | 'upcoming' | 'in_progress' | 'completed' | 'today';

const localDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function useMoves(filter: MoveFilter) {
  return useQuery({
    queryKey: ['operator-moves', filter, localDate()],
    queryFn: async () => {
      let query = supabase
        .from('jobs')
        .select(
          'id, job_number, scheduled_date, scheduled_start_time, status, origin_address, destination_address, job_type, crew_size, crew_members, truck_size, packing_service_included, estimated_total, actual_total, payment_status, contacts(name, phone)',
        )
        .order('scheduled_date', { ascending: true })
        .order('scheduled_start_time', { ascending: true })
        .limit(200);

      const today = localDate();

      if (filter === 'upcoming') {
        query = query.gte('scheduled_date', today).in('status', ['scheduled', 'confirmed', 'new']);
      } else if (filter === 'in_progress') {
        query = query.eq('status', 'in_progress');
      } else if (filter === 'completed') {
        query = query.eq('status', 'completed');
      } else if (filter === 'today') {
        query = query.eq('scheduled_date', today);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []) as MoveListItem[];
    },
  });
}
