// Error reporting without a vendor SDK. Set ERROR_WEBHOOK_URL to any endpoint
// that accepts a JSON POST (Better Stack, a Slack/Discord webhook, GlitchTip
// via a small relay). Server errors arrive through instrumentation.ts,
// client errors through /api/galat.

export type LaporanGalat = {
  sumber: "server" | "klien";
  pesan: string;
  stack?: string;
  url?: string;
  digest?: string;
  waktu: string;
};

export async function kirimGalat(laporan: LaporanGalat): Promise<void> {
  const url = process.env.ERROR_WEBHOOK_URL;
  if (!url) {
    console.error("[galat]", laporan.sumber, laporan.pesan, laporan.url ?? "");
    return;
  }
  try {
    await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(laporan) });
  } catch {
    // Never let error reporting cause another error.
  }
}
