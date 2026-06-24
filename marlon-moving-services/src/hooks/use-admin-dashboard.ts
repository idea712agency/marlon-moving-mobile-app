import { useQuery } from '@tanstack/react-query';

import { adminDashboardSchema } from '@/lib/schemas/admin-dashboard';
import { supabase } from '@/lib/supabase';

export const adminDashboardQueryKey = ['admin-app-dashboard'] as const;

export function useAdminDashboard() {
  return useQuery({
    queryKey: adminDashboardQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('mobile-admin-dashboard');
      if (error) throw error;
      return adminDashboardSchema.parse(data);
    },
  });
}
