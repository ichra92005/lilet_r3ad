/* src/lib/supabaseClient.js
 * Shared Supabase client for the app.
 * Reads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from import.meta.env.
 * Uses PKCE flow to avoid hash‑router conflicts.
 */

import { createClient } from '@supabase/supabase-js';

// NOTE: "Confirm email" must be disabled in Supabase Auth settings for username sign‑up to work.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
});
