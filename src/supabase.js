import { createClient } from '@supabase/supabase-js';

// The Supabase client, or null when the project is not configured. Both values
// are public by design (the anon key only grants what row-level security
// allows); set them in .env.local. See supabase/schema.sql for the tables.
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && key
  ? createClient(url, key, { auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null;
