import { createClient } from '@supabase/supabase-js';
import { createClient as createClerkClient } from '@clerk/nextjs/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Shared utility for the API's Auth mechanism
export async function validateApiKey(key: string) {
  // Security: We identify the key by prefix, then validate the hash (or simple comparison if using simple keys)
  // In a production environment, we'd use a secure hashing mechanism (scrypt/bcrypt)
  const prefix = key.split('_')[2]; // sk_live_RANDOM
  if (!prefix) return null;

  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .select('*')
    .eq('key_prefix', prefix)
    .eq('is_active', true)
    .single();

  if (error || !data) return null;
  
  return data;
}
