import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { supabaseEnv } from "./env";
import { COOKIE_MITRA } from "./mitra-cookie";

// Owner-surface clients. The auth cookie is named separately and is
// host-scoped to mitra.*, so the renter surface never sees a session.

export async function mitraServer() {
  const { url, anonKey } = supabaseEnv();
  const store = await cookies();
  return createServerClient<Database>(url, anonKey, {
    cookieOptions: { name: COOKIE_MITRA },
    cookies: {
      getAll: () => store.getAll(),
      setAll: (semua) => {
        try {
          semua.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Called from a Server Component: the proxy refreshes cookies instead.
        }
      },
    },
  });
}

/** Service role. Server only — cron jobs and team tooling. Never import from a client component. */
export function mitraAdmin() {
  const { url } = supabaseEnv();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY belum diisi");
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
