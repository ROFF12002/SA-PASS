import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ──────────────────────────────────────────────
// Supabase Configuration (Hardcoded – No ENV)
// ──────────────────────────────────────────────
const SUPABASE_URL = 'https://wtcsdcwrhsnfwekfgnjr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_KZtTfCFFAeMbRr4bsVaGAw_3HY41Flf';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
