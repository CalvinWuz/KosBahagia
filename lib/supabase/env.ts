// Public Supabase connection values. Both are safe in the browser; RLS is
// the security boundary. The service-role key never goes through here.
export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY belum diisi (lihat .env.example)",
    );
  }
  return { url, anonKey };
}
