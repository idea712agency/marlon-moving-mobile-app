import { QueryClient, QueryClientProvider, focusManager, onlineManager } from '@tanstack/react-query';
import { ReactNode, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

function onAppStateChange(status: AppStateStatus) {
  if (process.env.EXPO_OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

export function AppQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60,
            gcTime: 1000 * 60 * 10,
            retry: 1,
            refetchOnReconnect: true,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  useEffect(() => {
    onlineManager.setOnline(true);
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
