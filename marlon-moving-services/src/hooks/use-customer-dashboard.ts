import { useQuery } from '@tanstack/react-query';

import type { DashboardData } from '@/lib/data';
import { supabase } from '@/lib/supabase';

export function useCustomerDashboard() {
  return useQuery({
    queryKey: ['customer-dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('mobile-get-dashboard');
      if (error) throw error;
      return data as DashboardData;
    },
  });
}
