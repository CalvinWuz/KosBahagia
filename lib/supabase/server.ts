import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { supabaseEnv } from "./env";

// Anonymous client for Server Components and route handlers on the renter
// surface. Renters never sign in, so there is no session to carry.
export function supabaseServer() {
  const { url, anonKey } = supabaseEnv();
  return createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
