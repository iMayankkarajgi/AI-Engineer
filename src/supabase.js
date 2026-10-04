import { createClient } from '@supabase/supabase-js';

// The Supabase client, or null when the project is not configured. Both
// defaults are public by design: the project URL and the publishable key ship
// to every visitor's browser, and row-level security (supabase/schema.sql) is
// what protects the data. Override them with VITE_SUPABASE_URL and
// VITE_SUPABASE_ANON_KEY; set either to an empty string to turn Supabase off
// (the static build does this).
const url = import.meta.env.VITE_SUPABASE_URL ?? 'https://jrqqubxwroziwocyyqwy.supabase.co';
const key = import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'sb_publishable_L-UemOhaM0jLKowF_Y_tGg_MMOhqZpH';

export const supabase = url && key
  ? createClient(url, key, { auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null;
