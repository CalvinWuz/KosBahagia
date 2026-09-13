import { headers } from "next/headers";

// The owner surface is served at mitra.<domain>/x but lives at /mitra/x in
// the app. On the mitra host the proxy rewrites, so links must be "/x";
// on plain localhost they must be "/mitra/x". This returns the prefix.
export async function dasarMitra(): Promise<string> {
  const host = (await headers()).get("host") ?? "";
  return host.startsWith("mitra.") ? "" : "/mitra";
}
