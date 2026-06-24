import { useQuery } from '@tanstack/react-query';

import type { CustomerListItem } from '@/components/operator/CustomerRow';
import { supabase } from '@/lib/supabase';

let hasLoggedCustomerUser = false;

export function useCustomers(search: string) {
  return useQuery({
    queryKey: ['operator-customers', search],
    queryFn: async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!hasLoggedCustomerUser) {
        console.info('[Customers] authenticated user:', user?.id ?? null);
        hasLoggedCustomerUser = true;
      }

      if (authError) throw authError;
      if (!user) throw new Error('No authenticated operator session.');

      let query = supabase
        .from('contacts')
        .select('id, name, email, phone, status')
        .order('name', { ascending: true })
        .limit(100);

      if (search.trim()) query = query.ilike('name', `%${search.trim()}%`);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as CustomerListItem[];
    },
  });
}
