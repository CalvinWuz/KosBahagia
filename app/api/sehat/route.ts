import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// Uptime check target: 200 when the app and the database answer.
export const dynamic = "force-dynamic";

export async function GET() {
  const mulai = Date.now();
  const { error } = await supabaseServer().from("area").select("slug").limit(1);
  const ok = !error;
  return NextResponse.json({ ok, db: ok ? "ok" : error.message, ms: Date.now() - mulai }, { status: ok ? 200 : 503 });
}
