import { useCallback, useEffect, useState } from 'react';

import type { DashboardData } from '@/lib/data';
import { errorMessage } from '@/lib/data';
import { supabase } from '@/lib/supabase';

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data: result, error: invokeError } = await supabase.functions.invoke('mobile-get-dashboard');
    if (invokeError) setError(errorMessage(invokeError));
    else setData(result as DashboardData);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
