import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

let cachedClient: SupabaseClient | null = null;

/**
 * Server-only Supabase client using the service role key. This client
 * bypasses Row Level Security entirely, which is why it must never be
 * imported from a Client Component or exposed to the browser.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!cachedClient) {
    cachedClient = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cachedClient;
}
