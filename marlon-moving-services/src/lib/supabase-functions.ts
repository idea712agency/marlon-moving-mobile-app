import { supabase } from '@/lib/supabase';

type InvokeOptions = {
  body?: NonNullable<Parameters<typeof supabase.functions.invoke>[1]>['body'];
};

async function messageFromFunctionError(error: unknown) {
  const maybeContext = error && typeof error === 'object' && 'context' in error ? error.context : null;

  if (maybeContext instanceof Response) {
    const status = `${maybeContext.status}${maybeContext.statusText ? ` ${maybeContext.statusText}` : ''}`;
    const text = await maybeContext.text().catch(() => '');
    if (!text) return `Edge Function returned ${status}.`;

    try {
      const json = JSON.parse(text);
      const detail = json.error ?? json.message ?? json.msg ?? text;
      return `Edge Function returned ${status}: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`;
    } catch {
      return `Edge Function returned ${status}: ${text}`;
    }
  }

  return error instanceof Error ? error.message : 'Edge Function request failed.';
}

export async function invokeSupabaseFunction<T>(name: string, options: InvokeOptions = {}) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  const { data, error } = await supabase.functions.invoke(name, {
    body: options.body,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (error) {
    throw new Error(await messageFromFunctionError(error));
  }

  return data as T;
}
