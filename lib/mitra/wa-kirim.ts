// Outbound WhatsApp. Uses the Meta Cloud API when WA_CLOUD_TOKEN and
// WA_CLOUD_PHONE_ID are set; otherwise it is a dry run that reports what it
// would have sent, so the cron can be exercised locally.

export type HasilKirim = { dikirim: boolean; alasan?: string };

export async function kirimWa(nomor: string, pesan: string): Promise<HasilKirim> {
  const token = process.env.WA_CLOUD_TOKEN;
  const phoneId = process.env.WA_CLOUD_PHONE_ID;
  if (!token || !phoneId) return { dikirim: false, alasan: "dry-run: WA_CLOUD_TOKEN/WA_CLOUD_PHONE_ID belum diisi" };
  const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to: nomor, type: "text", text: { body: pesan, preview_url: true } }),
  });
  if (!res.ok) return { dikirim: false, alasan: `Meta ${res.status}: ${(await res.text()).slice(0, 200)}` };
  return { dikirim: true };
}
