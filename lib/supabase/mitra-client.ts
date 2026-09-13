"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";
import { supabaseEnv } from "./env";
import { COOKIE_MITRA } from "./mitra-cookie";

let instance: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function mitraBrowser() {
  if (!instance) {
    const { url, anonKey } = supabaseEnv();
    instance = createBrowserClient<Database>(url, anonKey, { cookieOptions: { name: COOKIE_MITRA } });
  }
  return instance;
}
