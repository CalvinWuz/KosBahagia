import type { Database } from "./types";
import { supabaseEnv } from "./env";

// A ~40-line PostgREST client for the renter surface. It replaces
// supabase-js in the browser bundle (61 KB gzipped) — renters never
// authenticate, so all we need is anonymous rpc / select / insert.

type Fungsi = Database["public"]["Functions"];
type Tabel = Database["public"]["Tables"];
type View = Database["public"]["Views"];

export type HasilRest<T> = { data: T | null; error: { message: string } | null };

function kepala(extra: Record<string, string> = {}) {
  const { anonKey } = supabaseEnv();
  return { apikey: anonKey, Authorization: `Bearer ${anonKey}`, "Content-Type": "application/json", ...extra };
}

async function jalankan<T>(path: string, init: RequestInit): Promise<HasilRest<T>> {
  try {
    const { url } = supabaseEnv();
    const res = await fetch(`${url}/rest/v1/${path}`, init);
    if (!res.ok) {
      const teks = await res.text().catch(() => "");
      return { data: null, error: { message: `${res.status} ${teks.slice(0, 200)}` } };
    }
    if (res.status === 204) return { data: null, error: null };
    return { data: (await res.json()) as T, error: null };
  } catch (e) {
    return { data: null, error: { message: e instanceof Error ? e.message : String(e) } };
  }
}

/** POST /rpc/<fn> */
export function restRpc<F extends keyof Fungsi>(fn: F, args: Fungsi[F]["Args"]): Promise<HasilRest<Fungsi[F]["Returns"]>> {
  return jalankan(`rpc/${fn}`, { method: "POST", headers: kepala(), body: JSON.stringify(args) });
}

/** GET /<table>?select=…&col=op.value — filters are PostgREST syntax, e.g. { id: "in.(a,b)" }. */
export function restSelect<T extends keyof (Tabel & View)>(
  tabel: T,
  filter: Record<string, string>,
): Promise<HasilRest<Array<(Tabel & View)[T]["Row"]>>> {
  const sp = new URLSearchParams(filter);
  return jalankan(`${tabel}?${sp.toString()}`, { method: "GET", headers: kepala() });
}

/** POST /<table> with return=minimal. */
export function restInsert<T extends keyof Tabel>(tabel: T, baris: Tabel[T]["Insert"]): Promise<HasilRest<null>> {
  return jalankan(`${tabel}`, { method: "POST", headers: kepala({ Prefer: "return=minimal" }), body: JSON.stringify(baris) });
}

/** Shape shared by supabase-js (server) and this client (browser) for the search helpers. */
export const restKlien = { rpc: restRpc };
