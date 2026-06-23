import type { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

type AuthValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  authError: string;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const ADMIN_REQUIRED_MESSAGE = 'Admin access required';
const ADMIN_CHECK_TIMEOUT_MS = 8000;

const AuthContext = createContext<AuthValue>({
  session: null,
  user: null,
  loading: true,
  isAdmin: false,
  authError: '',
  signInWithEmail: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

function paramsFromUrl(url: string) {
  const [, query = ''] = url.split('?');
  const [queryPart = '', hashPart = ''] = query.split('#');
  const hashOnly = url.includes('#') ? url.split('#')[1] : hashPart;
  return new URLSearchParams(`${queryPart}&${hashOnly}`);
}

function withTimeout<T>(promise: PromiseLike<T>, ms: number, message: string) {
  return Promise.race<T>([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authError, setAuthError] = useState('');

  const verifyAdminSession = useCallback(async (nextSession: Session | null, throwOnDenied = false) => {
    if (!nextSession?.user) {
      setSession(null);
      setIsAdmin(false);
      return false;
    }

    try {
      const { data, error } = await withTimeout(
        Promise.resolve(supabase.rpc('has_role', {
          _user_id: nextSession.user.id,
          _role: 'admin',
        })),
        ADMIN_CHECK_TIMEOUT_MS,
        'Admin role check timed out. Check your connection and try again.',
      );

      if (error) {
        if (!throwOnDenied) {
          // A customer session is still valid even when the optional admin-role
          // lookup is unavailable. Preserve it so refreshes and mutations cannot
          // accidentally sign customers out of their portal.
          setSession(nextSession);
          setIsAdmin(false);
          setAuthError('');
          return false;
        }

        setSession(null);
        setIsAdmin(false);
        setAuthError(error.message);
        await supabase.auth.signOut();
        throw error;
      }

      if (!data) {
        setSession(throwOnDenied ? null : nextSession);
        setIsAdmin(false);
        setAuthError(ADMIN_REQUIRED_MESSAGE);
        if (throwOnDenied) {
          await supabase.auth.signOut();
          throw new Error(ADMIN_REQUIRED_MESSAGE);
        }
        return false;
      }

      setSession(nextSession);
      setIsAdmin(true);
      setAuthError('');
      return true;
    } catch (error) {
      if (!throwOnDenied) {
        setSession(nextSession);
        setIsAdmin(false);
        setAuthError('');
        return false;
      }

      setSession(null);
      setIsAdmin(false);
      setAuthError(error instanceof Error ? error.message : 'Unable to verify admin access.');
      await supabase.auth.signOut();
      throw error;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const finishInitialSession = async () => {
      try {
        const { data } = await withTimeout(
          supabase.auth.getSession(),
          ADMIN_CHECK_TIMEOUT_MS,
          'Session restore timed out. Check your connection and try again.',
        );
        await verifyAdminSession(data.session);
      } catch (error) {
        setSession(null);
        setIsAdmin(false);
        setAuthError(error instanceof Error ? error.message : 'Unable to restore session.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void finishInitialSession();

    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      setTimeout(() => {
        verifyAdminSession(nextSession).finally(() => {
          setLoading(false);
        });
      }, 0);
    });

    const subscription = Linking.addEventListener('url', ({ url }) => {
      const params = paramsFromUrl(url);
      const code = params.get('code');
      if (!code) return;
      setLoading(true);
      setTimeout(() => {
        supabase.auth.exchangeCodeForSession(code).finally(() => {
          setLoading(false);
        });
      }, 0);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
      subscription.remove();
    };
  }, [verifyAdminSession]);

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    setAuthError('');
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setLoading(false);
      setAuthError(error.message);
      throw error;
    }
    try {
      await verifyAdminSession(data.session, true);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    setAuthError('');
    const redirectTo = Linking.createURL('/auth/sign-in');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      setLoading(false);
      setAuthError(error.message);
      throw error;
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success') {
      setLoading(false);
      return;
    }

    const params = paramsFromUrl(result.url);
    const code = params.get('code');
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    try {
      if (code) {
        const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;
        await verifyAdminSession(sessionData.session, true);
      } else if (accessToken && refreshToken) {
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) throw sessionError;
        await verifyAdminSession(sessionData.session, true);
      } else {
        throw new Error('Unable to complete Google sign in.');
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setAuthError('');
    setSession(null);
    setIsAdmin(false);
    await supabase.auth.signOut();
  };

  const value = useMemo(
    () => ({ session, user: session?.user ?? null, loading, isAdmin, authError, signInWithEmail, signInWithGoogle, signOut }),
    [session, loading, isAdmin, authError],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export const useAuth = () => use(AuthContext);
