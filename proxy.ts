import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { COOKIE_MITRA } from "@/lib/supabase/mitra-cookie";

// Two surfaces, one app:
//   kosbahagia.com          → app/(user)
//   mitra.kosbahagia.com    → app/(mitra)/mitra/* (rewritten so URLs stay short)
// A renter on the main host never reaches owner UI: /mitra/* there is sent
// to the mitra host. Locally (no subdomain) /mitra/* stays reachable so the
// surface can be developed on plain localhost.

const MITRA_URL = process.env.NEXT_PUBLIC_MITRA_URL ?? "https://mitra.kosbahagia.com";
const HOST_UTAMA = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://kosbahagia.com").host;
  } catch {
    return "kosbahagia.com";
  }
})();


function hostMitra(host: string) {
  return host.startsWith("mitra.");
}

export async function proxy(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const url = req.nextUrl.clone();
  const diMitra = hostMitra(host);

  // Main production host: owner UI is not served here.
  if (!diMitra && url.pathname.startsWith("/mitra") && (host === HOST_UTAMA || host === `www.${HOST_UTAMA}`)) {
    const tujuan = new URL(url.pathname.replace(/^\/mitra/, "") || "/", MITRA_URL);
    tujuan.search = url.search;
    return NextResponse.redirect(tujuan, 308);
  }

  // Mitra host: /x → /mitra/x internally; /mitra/x → /x so links stay short.
  if (diMitra) {
    if (url.pathname.startsWith("/mitra")) {
      url.pathname = url.pathname.replace(/^\/mitra/, "") || "/";
      return NextResponse.redirect(url, 308);
    }
    url.pathname = `/mitra${url.pathname === "/" ? "" : url.pathname}`;
  }

  const internal = url.pathname; // path as the app sees it
  let res = diMitra ? NextResponse.rewrite(url, { request: req }) : NextResponse.next({ request: req });

  // Session refresh + gate for the dashboard. Cookies are host-scoped, so
  // the renter surface never carries them.
  if (internal.startsWith("/mitra")) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      {
        cookieOptions: { name: COOKIE_MITRA },
        cookies: {
          getAll: () => req.cookies.getAll(),
          setAll: (semua) => {
            semua.forEach(({ name, value }) => req.cookies.set(name, value));
            res = diMitra ? NextResponse.rewrite(url, { request: req }) : NextResponse.next({ request: req });
            semua.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
          },
        },
      },
    );
    const { data } = await supabase.auth.getUser();
    if (!data.user && internal.startsWith("/mitra/dashboard")) {
      const masuk = req.nextUrl.clone();
      masuk.pathname = diMitra ? "/masuk" : "/mitra/masuk";
      masuk.search = `?next=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`;
      return NextResponse.redirect(masuk);
    }
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|maplibre/|robots.txt|sitemap.xml).*)"],
};
