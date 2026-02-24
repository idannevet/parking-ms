import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? 'https://placeholder.supabase.co';
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key';
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY ?? supabaseAnon;

// Client-side client (anon key)
export const supabase = createClient(supabaseUrl, supabaseAnon);

// Server-side admin client (service role)
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRole,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
