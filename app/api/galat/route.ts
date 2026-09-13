import { NextResponse } from "next/server";
import { kirimGalat } from "@/lib/galat";

// Client error boundaries post here (sendBeacon-friendly: tiny JSON body).
export async function POST(req: Request) {
  try {
    const b = (await req.json()) as { pesan?: string; stack?: string; url?: string; digest?: string };
    if (!b.pesan || typeof b.pesan !== "string") return NextResponse.json({ ok: false }, { status: 400 });
    await kirimGalat({ sumber: "klien", pesan: b.pesan.slice(0, 500), stack: b.stack?.slice(0, 4000), url: b.url?.slice(0, 500), digest: b.digest, waktu: new Date().toISOString() });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
