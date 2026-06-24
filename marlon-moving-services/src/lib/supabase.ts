import 'react-native-url-polyfill/auto';

import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/types/supabase';

export const SUPABASE_URL = 'https://njdrpgpcyeieynhgnupc.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qZHJwZ3BjeWVpZXluaGdudXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNDY0NTIsImV4cCI6MjA3OTkyMjQ1Mn0.X3Zb0lpF3rVs7ZNXu6FE5fqeYhcpFt5yAMWpFBlaycQ';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
