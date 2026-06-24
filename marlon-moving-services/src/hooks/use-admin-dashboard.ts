import { useQuery } from '@tanstack/react-query';

import { invokeSupabaseFunction } from '@/lib/supabase-functions';
import { adminDashboardSchema } from '@/lib/schemas/admin-dashboard';

export const adminDashboardQueryKey = ['admin-app-dashboard'] as const;

export function useAdminDashboard() {
  return useQuery({
    queryKey: adminDashboardQueryKey,
    queryFn: async () => {
      const data = await invokeSupabaseFunction('mobile-admin-dashboard');
      return adminDashboardSchema.parse(data);
    },
  });
}
