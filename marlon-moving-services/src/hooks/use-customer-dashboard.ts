import { useQuery } from '@tanstack/react-query';

import type { DashboardData } from '@/lib/data';
import { invokeSupabaseFunction } from '@/lib/supabase-functions';

export function useCustomerDashboard() {
  return useQuery({
    queryKey: ['customer-dashboard'],
    queryFn: async () => {
      return invokeSupabaseFunction<DashboardData>('mobile-get-dashboard');
    },
  });
}
