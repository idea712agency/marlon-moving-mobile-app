import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/types/supabase';

export const SUPABASE_URL = 'https://njdrpgpcyeieynhgnupc.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qZHJwZ3BjeWVpZXluaGdudXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNDY0NTIsImV4cCI6MjA3OTkyMjQ1Mn0.X3Zb0lpF3rVs7ZNXu6FE5fqeYhcpFt5yAMWpFBlaycQ';

const isWeb = typeof window !== 'undefined';

function createStorageAdapter() {
  if (isWeb) {
    return {
      getItem: (key: string) => {
        try {
          return Promise.resolve(localStorage.getItem(key));
        } catch {
          return Promise.resolve(null);
        }
      },
      setItem: (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
        } catch {
          // noop
        }
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key);
        } catch {
          // noop
        }
        return Promise.resolve();
      },
    };
  }

  // SSR (Node.js) — in-memory no-op to prevent localStorage crashes
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => Promise.resolve(store.get(key) ?? null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    },
    removeItem: (key: string) => {
      store.delete(key);
      return Promise.resolve();
    },
  };
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: createStorageAdapter(),
    autoRefreshToken: isWeb,
    persistSession: isWeb,
    detectSessionInUrl: isWeb,
  },
});
