import "server-only";
import { createClient } from "@supabase/supabase-js";

function getSupabaseUrl() {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
}

function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseUrl() && getSupabaseServiceRoleKey());
}

let supabaseClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdminClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  if (!supabaseClient) {
    supabaseClient = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return supabaseClient;
}
