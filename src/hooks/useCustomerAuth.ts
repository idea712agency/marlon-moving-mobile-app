import * as Linking from 'expo-linking';

import { supabase } from '@/lib/supabase';

export function useCustomerAuth() {
  const signUp = async ({ fullName, email, password }: { fullName: string; email: string; password: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim() },
      },
    });
    if (error) throw error;
    if (data.session) return data;
    const signedIn = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (signedIn.error) throw signedIn.error;
    return signedIn.data;
  };

  const signIn = async ({ email, password }: { email: string; password: string }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
    const { data: isAdmin, error: roleError } = await supabase.rpc('has_role', {
      _user_id: data.user.id,
      _role: 'admin',
    });
    if (roleError) throw new Error(`Unable to verify account access: ${roleError.message}`);
    return { ...data, isAdmin: Boolean(isAdmin) };
  };

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: Linking.createURL('/app/login'),
    });
    if (error) throw error;
    return data;
  };

  return { signUp, signIn, resetPassword };
}
