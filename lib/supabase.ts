import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase public environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

let supabaseAdminSingleton: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('Supabase admin client is server-side only');
  }

  if (!supabaseAdminSingleton) {
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseServiceKey) {
      throw new Error('Missing Supabase service role key');
    }
    if (!supabaseUrl) {
      throw new Error('Missing Supabase URL');
    }

    supabaseAdminSingleton = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabaseAdminSingleton;
}
