import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { supabaseEnv } from "./env";

let instance: SupabaseClient<Database> | undefined;

// Browser singleton (anonymous). Used for typeahead and lead logging.
export function supabaseBrowser() {
  if (!instance) {
    const { url, anonKey } = supabaseEnv();
    instance = createClient<Database>(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return instance;
}
