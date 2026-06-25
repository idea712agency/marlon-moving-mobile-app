import 'react-native-url-polyfill/auto';

import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/types/supabase';

export const SUPABASE_URL = 'https://njdrpgpcyeieynhgnupc.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qZHJwZ3BjeWVpZXluaGdudXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNDY0NTIsImV4cCI6MjA3OTkyMjQ1Mn0.X3Zb0lpF3rVs7ZNXu6FE5fqeYhcpFt5yAMWpFBlaycQ';

const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
const isServer = typeof window === 'undefined';

const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      // iOS can reject SecureStore reads during background auth refresh ticks.
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // Preserve app stability if native secure storage is temporarily unavailable.
    }
  },
  removeItem: async (key: string) => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Preserve app stability if native secure storage is temporarily unavailable.
    }
  },
};

const WebStorageAdapter = {
  getItem: (key: string) => {
    try {
      return Promise.resolve(window.localStorage.getItem(key));
    } catch {
      return Promise.resolve(null);
    }
  },
  setItem: (key: string, value: string) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Browsers can reject storage access in private or restricted contexts.
    }
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Browsers can reject storage access in private or restricted contexts.
    }
    return Promise.resolve();
  },
};

const ServerStorageAdapter = {
  getItem: () => Promise.resolve(null),
  setItem: () => Promise.resolve(),
  removeItem: () => Promise.resolve(),
};

function createStorageAdapter() {
  if (isBrowser) return WebStorageAdapter;
  if (isServer) return ServerStorageAdapter;
  return ExpoSecureStoreAdapter;
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: createStorageAdapter(),
    autoRefreshToken: !isServer,
    persistSession: !isServer,
    detectSessionInUrl: isBrowser,
  },
});
