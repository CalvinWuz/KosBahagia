"""Browser checks for the v3.1 minor update (docs/hasil-update-minor-v3-motion.md):
page transitions, the reload logo intro, and the simplified condition section.

  npm run build && npm run start -- --port 3011      # in another terminal
  python3 scripts/uji-motion-v31.py                  # pip install playwright; python3 -m playwright install chromium webkit
  DEV=http://localhost:3010 python3 scripts/uji-motion-v31.py   # also checks React StrictMode on `npm run dev`
  MESIN=chromium HANYA=1,12-15 python3 scripts/uji-motion-v31.py  # one engine, some scenarios

Writes docs/tangkapan/v3-motion/hasil-uji.json, screenshots and short videos
(video/*.webm). Timing numbers are from headless browsers on this machine.
"""

import asyncio
import json
import os
import re
import shutil
import time
from pathlib import Path

from playwright.async_api import async_playwright, expect

AKAR = Path(__file__).resolve().parent.parent
BASE = os.environ.get("BASE", "http://localhost:3011")
DEV = os.environ.get("DEV")
OUT = Path(os.environ["OUT_DIR"]) if os.environ.get("OUT_DIR") else AKAR / "docs" / "tangkapan" / "v3-motion"
VIDEO = OUT / "video"
OUT.mkdir(parents=True, exist_ok=True)
VIDEO.mkdir(parents=True, exist_ok=True)

HP = dict(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
PC = dict(viewport={"width": 1440, "height": 900}, device_scale_factor=1)

hasil: list[dict] = []


def catat(no, nama: str, lulus: bool, catatan: str = "", mesin: str = "chromium"):
    hasil.append({"no": no, "skenario": nama, "mesin": mesin, "lulus": bool(lulus), "catatan": catatan})
    print(f"{'LULUS' if lulus else 'GAGAL'} {str(no):>4} [{mesin}] {nama}: {catatan}", flush=True)


# Records every view transition the page starts and, once it is ready, the
# pseudo-element animations it runs. Installed before any page script.
REKAM_VT = """(() => {
  window.__vt = [];
  const asli = Document.prototype.startViewTransition;
  if (!asli) return;
  Document.prototype.startViewTransition = function (...arg) {
    const t = asli.apply(this, arg);
    const e = { anim: [] };
    window.__vt.push(e);
    t.ready.then(() => {
      e.anim = document.getAnimations().filter((x) => x.effect && x.effect.pseudoElement)
        .map((x) => ({ nama: x.animationName || "", durasi: Number(x.effect.getComputedTiming().duration) || 0 }));
    }, () => { e.dilewati = true; });
    return t;
  };
})()"""


def nama_vt(vt: list) -> list[str]:
    return sorted({a["nama"] for e in vt for a in e["anim"] if a["nama"]})


# Samples the intro every animation frame for `ms`.
SAMPEL_INTRO = """(ms) => new Promise((res) => {
  const out = []; const t0 = performance.now();
  const kotak = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round); };
  const tick = () => {
    const ov = document.querySelector('[data-intro-logo]');
    const g = document.querySelector('[data-intro-gerak]');
    const mark = document.querySelector('[data-intro-gerak] svg');
    const senyum = document.querySelector('.intro-senyum');
    const hm = document.querySelector('[data-logo-header]');
    out.push({
      t: Math.round(performance.now()),
      intro: document.documentElement.dataset.intro || '-',
      overlay: ov ? getComputedStyle(ov).display : 'x',
      markOpacity: mark ? Number(getComputedStyle(mark).opacity) : null,
      senyum: senyum ? Number.parseFloat(getComputedStyle(senyum).strokeDashoffset) : null,
      gerak: g ? getComputedStyle(g).transform : 'x',
      gerakOpacity: g ? Number(getComputedStyle(g).opacity) : null,
      markKotak: kotak(mark),
      headerKotak: kotak(hm),
      headerOpacity: hm ? Number(getComputedStyle(hm).opacity) : null,
    });
    if (performance.now() - t0 < ms) requestAnimationFrame(tick); else res(out);
  };
  tick();
})"""


def ringkas_intro(s: list[dict]) -> dict:
    """Phases seen in the samples, the end state, and how far the mark landed from the header mark."""
    tampil = [x for x in s if x["overlay"] == "grid"]
    if not tampil:
        return {"main": False}
    akhir_overlay = max(x["t"] for x in tampil)
    mulai = min(x["t"] for x in tampil)
    terbang = [x for x in tampil if x["gerak"] not in ("none", "x") and "matrix" in x["gerak"]]
    meleset = None
    if terbang and terbang[-1]["markKotak"] and terbang[-1]["headerKotak"] and terbang[-1]["headerKotak"][2] > 0:
        m, h = terbang[-1]["markKotak"], terbang[-1]["headerKotak"]
        meleset = max(abs((m[0] + m[2] / 2) - (h[0] + h[2] / 2)), abs((m[1] + m[3] / 2) - (h[1] + h[3] / 2)), abs(m[2] - h[2]))
    skala_akhir = None
    if terbang:
        cocok = re.match(r"matrix\(([-\d.e]+)", terbang[-1]["gerak"])
        skala_akhir = round(float(cocok.group(1)), 3) if cocok else None
    senyum = [x["senyum"] for x in tampil if x["senyum"] is not None]
    return {
        "main": True,
        "durasi_ms": akhir_overlay - mulai,
        "mark_muncul": any(x["markOpacity"] is not None and x["markOpacity"] < 0.9 for x in tampil[:3]) or tampil[0]["markOpacity"] == 1,
        "senyum_tergambar": bool(senyum) and max(senyum) > 0.5 and min(senyum) < 0.05,
        "terbang": bool(terbang),
        "skala_akhir": skala_akhir,
        "meleset_px": meleset,
        "pudar_ditempat": any((x["gerakOpacity"] or 1) < 0.5 for x in tampil) and not any("matrix(0.3" in x["gerak"] or "matrix(0.4" in x["gerak"] for x in tampil),
        "akhir": {k: s[-1][k] for k in ("intro", "overlay", "headerOpacity")},
    }


def tepat(r: dict) -> bool:
    """The flying mark ended on the header mark (0 px is a hit, so no `or` default)."""
    return r.get("meleset_px") is not None and r["meleset_px"] <= 2


async def buka(pg, url):
    await pg.goto(url, wait_until="load", timeout=60000)
    try:
        await pg.wait_for_load_state("networkidle", timeout=8000)
    except Exception:  # noqa: BLE001
        pass


async def ke_tengah(loc):
    """Scrolls without the site's smooth scrolling; Playwright's own scroll-into-view
    under `scroll-behavior: smooth` keeps the element moving in WebKit."""
    await loc.evaluate("e => e.scrollIntoView({ block: 'center', behavior: 'instant' })")
    await loc.page.wait_for_timeout(150)


async def reload_amati(pg, ms=1700):
    await pg.reload(wait_until="commit")
    return await pg.evaluate(SAMPEL_INTRO, ms)


async def jalankan(no, nama, f, mesin="chromium"):
    try:
        await f()
    except Exception as e:  # noqa: BLE001
        catat(no, nama, False, f"{type(e).__name__}: {str(e)[:300]}", mesin)


async def suite(p, jenis: str):
    mesin = getattr(p, jenis)
    b = await mesin.launch()

    async def baru(opsi=HP, video=None, **extra):
        if video:
            extra["record_video_dir"] = str(VIDEO / "_mentah")
            extra["record_video_size"] = opsi["viewport"]
        c = await b.new_context(**opsi, **extra)
        await c.add_init_script(REKAM_VT)
        pg = await c.new_page()
        pg.galat = []
        pg.on("pageerror", lambda e: pg.galat.append(str(e)))
        pg.on("console", lambda m: pg.galat.append(m.text) if m.type == "error" and "favicon" not in m.text else None)
        return c, pg

    async def amati_vt(pg, aksi, tunggu=1200):
        """View transitions started by `aksi` and within `tunggu` ms after it."""
        await pg.evaluate("window.__vt = []")
        await aksi()
        await pg.wait_for_timeout(tunggu)
        return await pg.evaluate("window.__vt || []")

    async def tutup_video(c, pg, nama):
        v = pg.video
        await c.close()
        if v:
            shutil.move(await v.path(), VIDEO / f"{nama}-{jenis}.webm")

    # 5 + 6: reload intro on the homepage, phone and desktop, twice ---------------
    async def s5_6():
        for label, opsi in (("HP", HP), ("PC", PC)):
            c, pg = await baru(opsi, video=True)
            await buka(pg, BASE + "/")
            pertama = await pg.evaluate("document.documentElement.dataset.intro || '-'")
            r1 = ringkas_intro(await reload_amati(pg))
            await pg.wait_for_timeout(300)
            r2 = ringkas_intro(await reload_amati(pg))
            await pg.wait_for_timeout(300)
            await tutup_video(c, pg, f"intro-beranda-{label.lower()}")
            ok5 = pertama == "-" and r1["main"] and r1["senyum_tergambar"] and r1["terbang"] and tepat(r1) and 800 <= r1["durasi_ms"] <= 1400 and r1["akhir"] == {"intro": "-", "overlay": "none", "headerOpacity": 1}
            catat(5, f"Refresh beranda {label}", ok5, f"muat pertama tanpa intro; reload: senyum tergambar, terbang ke header, skala akhir {r1.get('skala_akhir')}, meleset {r1.get('meleset_px')} px, {r1.get('durasi_ms')} ms, akhir {r1.get('akhir')}", jenis)
            catat(6, f"Refresh ulang {label}", r2["main"] and r2["terbang"], f"intro berjalan lagi ({r2.get('durasi_ms')} ms); tidak ada penanda 'sudah dilihat'", jenis)

    # 7: pages whose phone header is their own bar --------------------------------
    async def s7():
        catatan = []
        ok = True
        for label, opsi, url, harap in (
            ("HP /cari", HP, "/cari?area=binus-kemanggisan", "pudar"),
            ("HP /kos", HP, "/kos/kost-anggrek-cakra", "pudar"),
            ("PC /kos", PC, "/kos/kost-anggrek-cakra", "terbang"),
        ):
            c, pg = await baru(opsi, video=label == "HP /cari")
            await buka(pg, BASE + url)
            bar = pg.locator("div.sticky.top-0").first
            sebelum = await bar.bounding_box()
            r = ringkas_intro(await reload_amati(pg))
            sesudah = await bar.bounding_box()
            if label == "HP /cari":
                await tutup_video(c, pg, "intro-cari-hp-pudar")
            else:
                await c.close()
            sesuai = r["main"] and (r["pudar_ditempat"] if harap == "pudar" else r["terbang"] and tepat(r))
            ok = ok and sesuai and r["akhir"]["intro"] == "-" and sebelum == sesudah
            catatan.append(f"{label}: {harap} ({'ya' if sesuai else 'TIDAK'}, {r.get('durasi_ms')} ms)")
        catat(7, "Refresh halaman dengan header mobile khusus", ok, "; ".join(catatan) + "; bar halaman tidak bergeser", jenis)

    # 8: input, resize and navigation during the intro ---------------------------
    async def s8():
        cek = []
        for aksi in ("wheel", "resize", "navigasi"):
            c, pg = await baru(PC)
            await buka(pg, BASE + "/")
            await pg.reload(wait_until="load")
            await pg.wait_for_timeout(350)
            t0 = time.time()
            if aksi == "wheel":
                await pg.mouse.wheel(0, 300)
            elif aksi == "resize":
                await pg.set_viewport_size({"width": 1100, "height": 800})
            else:
                await pg.get_by_role("navigation", name="Menu utama").get_by_role("link", name=re.compile("^Simpanan")).click()
            await pg.wait_for_function("() => !document.documentElement.dataset.intro", timeout=3000)
            ms = round((time.time() - t0) * 1000)
            mark = await pg.evaluate("Number(getComputedStyle(document.querySelector('[data-logo-header]')).opacity)")
            cek.append((aksi, ms, mark))
            await c.close()
        ok = all(m == 1 for _, _, m in cek)
        catat(8, "Scroll/resize/navigasi saat intro", ok, ", ".join(f"{a}: selesai {ms} ms setelahnya, mark header {m}" for a, ms, m in cek), jenis)

    # 1: home → search → detail → back, header stays put -------------------------
    async def s1():
        c, pg = await baru(HP, video=True)
        await buka(pg, BASE + "/")
        vt1 = await amati_vt(pg, lambda: pg.get_by_role("link", name=re.compile("^Kamar mandi dalam")).first.click())
        await pg.wait_for_url(re.compile(r"/cari\?"))
        await pg.wait_for_timeout(600)
        await pg.evaluate("window.scrollBy(0, 900)")  # mouse.wheel is not available in mobile WebKit
        await pg.wait_for_timeout(500)
        y_cari = await pg.evaluate("scrollY")
        vt2 = await amati_vt(pg, lambda: pg.locator("ul.grid[aria-busy=false] article h3 a").first.click(), 1500)
        await pg.wait_for_url(re.compile(r"/kos/"))
        await pg.wait_for_timeout(500)
        vt3 = await amati_vt(pg, lambda: pg.get_by_role("button", name="Kembali").first.click())
        await pg.wait_for_url(re.compile(r"/cari\?.*kamar-mandi-dalam"))
        await pg.wait_for_timeout(800)
        y_balik = await pg.evaluate("scrollY")
        await tutup_video(c, pg, "navigasi-hp")
        # desktop: the header does not move while the content transitions
        c, pg = await baru(PC, video=True)
        await buka(pg, BASE + "/cari?area=binus-kemanggisan")
        await pg.wait_for_timeout(800)
        kartu = pg.locator("ul.grid[aria-busy=false] article h3 a").first
        await kartu.scroll_into_view_if_needed()
        await pg.wait_for_timeout(300)
        atas_awal = await pg.evaluate("(() => { const r = document.querySelector('header').getBoundingClientRect(); return Math.round(r.top) + ',' + Math.round(r.height); })()")
        # header position every frame for 2 s, recorded in the page while the click happens
        await pg.evaluate("""() => { window.__header = new Set(); const h = document.querySelector('header'); const t0 = performance.now();
          const tick = () => { const r = h.getBoundingClientRect(); window.__header.add(Math.round(r.top) + ',' + Math.round(r.height)); if (performance.now() - t0 < 2000) requestAnimationFrame(tick); }; tick(); }""")
        vt4 = await amati_vt(pg, kartu.click, 2000)
        posisi = await pg.evaluate("[...window.__header]")
        await pg.wait_for_url(re.compile(r"/kos/"))
        await pg.wait_for_timeout(900)
        atas_akhir = await pg.evaluate("(() => { const r = document.querySelector('header').getBoundingClientRect(); return Math.round(r.top) + ',' + Math.round(r.height); })()")
        # Only the before and after positions (the new page starts at the top); nothing in between.
        header_tetap = set(posisi) <= {atas_awal, atas_akhir}
        await pg.get_by_role("navigation", name="Menu utama").get_by_role("link", name=re.compile("^Cara menggunakan")).click()
        await pg.wait_for_url(re.compile("/cara-menggunakan"))
        await pg.wait_for_timeout(900)
        await tutup_video(c, pg, "navigasi-pc")
        ada = lambda vt, kelas: kelas in nama_vt(vt)  # noqa: E731
        ok = ada(vt1, "kb-halaman-maju") and ada(vt1, "kb-halaman-keluar") and ada(vt2, "kb-halaman-maju") and header_tetap and ada(vt4, "kb-halaman-maju") and y_balik > 300
        catat(1, "Beranda → Cari → Detail → kembali", ok, f"beranda→cari {nama_vt(vt1)}, cari→detail HP {nama_vt(vt2)}, PC {nama_vt(vt4)}; kembali (router.back): {nama_vt(vt3) or 'tanpa animasi'}; scroll hasil {y_cari:.0f} → {y_balik:.0f} px setelah kembali; header PC selama transisi: {sorted(posisi)} (sebelum {atas_awal}, sesudah {atas_akhir}, tanpa posisi antara)", jenis)

    # 2: search/detail → saved / compare / help ----------------------------------
    async def s2():
        c, pg = await baru(HP)
        await buka(pg, BASE + "/cari?area=binus-kemanggisan")
        k = pg.locator("ul.grid[aria-busy=false] > li > article").first
        nama = (await k.locator("h3").inner_text()).strip()
        await k.get_by_role("button", name=f"Simpan {nama}").click()
        await k.get_by_role("button", name=re.compile(f"^Bandingkan {re.escape(nama)}")).click()
        vt = []
        for tujuan, pola in (("Simpanan", r"/disimpan"), ("Bandingkan", r"/banding"), ("Cara menggunakan", r"/cara-menggunakan")):
            await pg.get_by_role("button", name="Menu").first.click()
            d = pg.get_by_role("dialog", name="Menu")
            await expect(d.get_by_role("link").first).to_be_visible(timeout=15000)
            jejak = await amati_vt(pg, d.get_by_role("link", name=re.compile(f"^{tujuan}")).click)
            vt.append("kb-halaman-masuk" in nama_vt(jejak))
            await pg.wait_for_url(re.compile(pola))
            if tujuan == "Simpanan":
                await expect(pg.locator("article h3", has_text=nama)).to_be_visible()
        simpan = json.loads(await pg.evaluate("localStorage.getItem('kb:simpan')"))
        banding = json.loads(await pg.evaluate("localStorage.getItem('kb:banding')"))
        await c.close()
        ok = all(vt) and len(simpan) == 1 and len(banding) == 1
        catat(2, "Cari → Simpanan/Bandingkan/Cara menggunakan", ok, f"crossfade (tanpa arah) di tiap tujuan {vt}; simpanan {len(simpan)} dan kandidat banding {len(banding)} tetap", jenis)

    # 3: rapid navigation ---------------------------------------------------------
    async def s3():
        c, pg = await baru(PC)
        await buka(pg, BASE + "/cari?area=binus-kemanggisan")
        h0 = await pg.evaluate("history.length")
        nav = pg.get_by_role("navigation", name="Menu utama")
        await pg.locator("ul.grid[aria-busy=false] article h3 a").first.click()
        await pg.wait_for_timeout(40)
        await nav.get_by_role("link", name=re.compile("^Simpanan")).click()
        await pg.wait_for_timeout(40)
        await nav.get_by_role("link", name=re.compile("^Bandingkan")).click()
        await pg.wait_for_timeout(40)
        await nav.get_by_role("link", name=re.compile("^Cara menggunakan")).click()
        await pg.wait_for_url(re.compile("/cara-menggunakan"), timeout=15000)
        await pg.wait_for_timeout(900)
        sisa = await pg.evaluate("document.getAnimations().filter(a => a.effect && a.effect.pseudoElement).length")
        teks = len((await pg.locator("main").inner_text()).strip())
        await nav.get_by_role("link", name=re.compile("^Cari kos")).click()
        await pg.wait_for_url(re.compile("/cari"), timeout=15000)
        await pg.wait_for_timeout(600)
        bisa_klik = await pg.locator('ul[aria-label="Filter cepat"]').get_by_role("button", name="Bersih").count() == 1
        h1 = await pg.evaluate("history.length")
        await c.close()
        ok = sisa == 0 and teks > 200 and bisa_klik and h1 - h0 <= 5 and not pg.galat
        catat(3, "Navigasi cepat berulang", ok, f"4 klik berturut-turut: tidak ada transisi tertinggal ({sisa}), halaman berisi, klik berikutnya berfungsi, history +{h1 - h0} untuk 5 navigasi, error {pg.galat[:1]}", jenis)

    # 4: query changes do not replay anything -------------------------------------
    async def s4():
        c, pg = await baru(HP)
        await buka(pg, BASE + "/cari?area=binus-kemanggisan")
        dilihat = []
        panggilan = 0

        async def amati(aksi):
            nonlocal panggilan
            jejak = await amati_vt(pg, aksi, 900)
            dilihat.extend(nama_vt(jejak))
            panggilan += len(jejak)

        await amati(lambda: pg.locator('ul[aria-label="Filter cepat"]').get_by_role("button", name="Kamar mandi dalam").click())
        await amati(lambda: pg.get_by_label("Urutkan").select_option("termurah"))
        await amati(lambda: pg.get_by_role("button", name=re.compile("^Peta")).click())
        await amati(lambda: pg.get_by_role("button", name="Daftar").click())
        await buka(pg, BASE + "/cari")
        kartu = pg.locator("ul.grid[aria-busy=false] > li > article")
        n0 = await kartu.count()

        async def muat_lagi():
            await pg.evaluate("window.scrollTo(0, document.documentElement.scrollHeight)")
            try:
                await pg.get_by_role("button", name="Muat lebih banyak").click(timeout=3000)
            except Exception:  # noqa: BLE001 - the scroll sentinel may already be loading the next page
                pass

        await amati(muat_lagi)
        n1 = await kartu.count()
        await buka(pg, BASE + "/kos/kost-anggrek-cakra")
        radio = pg.get_by_role("radiogroup", name="Pilih tipe kamar").get_by_role("radio", name=re.compile(r"^AC \+ kamar mandi dalam"))
        await ke_tengah(radio)
        await amati(radio.click)
        intro = await pg.evaluate("document.documentElement.dataset.intro || '-'")
        await c.close()
        catat(4, "Filter, urutan, mode peta, tipe kamar", not dilihat and intro == "-" and n1 > n0, f"chip filter, urutan, peta/daftar, muat lebih banyak ({n0} → {n1} kartu), tipe kamar: animasi transisi {dilihat or 'tidak ada'} ({panggilan} panggilan startViewTransition); intro tidak diputar ulang", jenis)

    # 9: no JavaScript / no View Transitions --------------------------------------
    async def s9():
        c, pg = await baru(PC, java_script_enabled=False)
        await pg.goto(BASE + "/", wait_until="load")
        await pg.reload(wait_until="load")
        teks = len(await pg.locator("main").inner_text())
        terlihat = await pg.locator("[data-logo-header]").is_visible()
        overlay = await pg.locator("[data-intro-logo]").is_visible()
        await c.close()
        c, pg = await baru(PC)
        await pg.add_init_script("delete Document.prototype.startViewTransition;")
        await buka(pg, BASE + "/cari?area=binus-kemanggisan")
        await pg.locator("ul.grid[aria-busy=false] article h3 a").first.click()
        await pg.wait_for_url(re.compile(r"/kos/"), timeout=15000)
        await expect(pg.locator("h1")).to_be_visible()
        await c.close()
        catat(9, "Tanpa JavaScript / tanpa View Transitions", terlihat and not overlay and teks > 200, "tanpa JS: konten dan logo header tampil, overlay tidak; tanpa startViewTransition: navigasi tetap jalan tanpa animasi", jenis)

    # 10: reduced motion -------------------------------------------------------------
    async def s10():
        c, pg = await baru(PC, reduced_motion="reduce")
        await buka(pg, BASE + "/")
        r = ringkas_intro(await reload_amati(pg, 900))
        jejak = await amati_vt(pg, lambda: pg.get_by_role("link", name=re.compile("^Kamar mandi dalam")).first.click())
        maks = max([a["durasi"] for e in jejak for a in e["anim"]] or [0])
        await pg.wait_for_url(re.compile(r"/cari\?"))
        await c.close()
        c, pg = await baru(PC)
        await buka(pg, BASE + "/")
        await pg.reload(wait_until="load")
        await pg.wait_for_timeout(300)
        await pg.emulate_media(reduced_motion="reduce")
        await pg.wait_for_function("() => !document.documentElement.dataset.intro", timeout=2000)
        await pg.wait_for_timeout(100)
        mark = await pg.evaluate("Number(getComputedStyle(document.querySelector('[data-logo-header]')).opacity)")
        await c.close()
        catat(10, "Reduced motion dari awal dan saat berjalan", not r["main"] and maks <= 1 and mark == 1, f"reduce dari awal: intro tidak tampil, durasi animasi transisi terpanjang {maks} ms; berubah saat intro: intro langsung berhenti, mark header {mark}", jenis)

    # 11: back/forward cache, history, StrictMode ---------------------------------
    async def s11():
        c, pg = await baru(PC)
        await buka(pg, BASE + "/")
        h0 = await pg.evaluate("history.length")
        await pg.reload(wait_until="load")
        await pg.wait_for_timeout(1800)
        h1 = await pg.evaluate("history.length")
        await pg.evaluate("window.__tanda = 'masih-sama'; addEventListener('pageshow', (e) => { window.__persisted = e.persisted; });")
        await buka(pg, BASE + "/mitra")
        await pg.go_back(wait_until="load")
        await pg.wait_for_timeout(200)
        sampel = await pg.evaluate(SAMPEL_INTRO, 900)
        dari_bfcache = await pg.evaluate("window.__tanda === 'masih-sama'")
        tampil = any(x["overlay"] == "grid" for x in sampel)
        await c.close()
        strict = "tidak diuji (set DEV)"
        ok_strict = True
        if DEV:
            c, pg = await baru(PC)
            await pg.add_init_script("""(() => { const asli = Element.prototype.animate; window.__gerak = 0;
              Element.prototype.animate = function (...a) { if (this.matches && this.matches('[data-intro-gerak]')) window.__gerak++; return asli.apply(this, a); }; })()""")
            await buka(pg, DEV + "/")
            await pg.reload(wait_until="load")
            await pg.wait_for_timeout(2500)
            n = await pg.evaluate("window.__gerak")
            akhir = await pg.evaluate("document.documentElement.dataset.intro || '-'")
            await c.close()
            ok_strict = n == 1 and akhir == "-"
            strict = f"next dev (StrictMode): {n} animasi gerak untuk satu reload, intro selesai"
        ok = h1 == h0 and not tampil and ok_strict
        catat(11, "Back/forward cache, history, StrictMode", ok, f"history tetap {h0} → {h1}; kembali dari /mitra ({'bfcache' if dari_bfcache else 'dimuat ulang (back_forward)'}): intro tidak diputar; {strict}", jenis)

    # 12–15: condition section --------------------------------------------------------
    async def s12_15():
        c, pg = await baru(HP)
        cek = {}
        for slug in ("kost-anggrek-cakra", "kos-putra-bahagia", "kos-mbak-tuti", "rumah-kos-bu-endang"):
            await buka(pg, BASE + f"/kos/{slug}")
            cek[slug] = await pg.locator("#kebersihan").inner_text()
        ok12 = (
            "5/5" in cek["kost-anggrek-cakra"] and "Sangat bersih" in cek["kost-anggrek-cakra"] and "1/5" in cek["kost-anggrek-cakra"] and "Berisik" in cek["kost-anggrek-cakra"]
            and "3,5/5" in cek["kos-putra-bahagia"] and "Belum dinilai" in cek["kos-putra-bahagia"] and "0/5" not in cek["kos-putra-bahagia"]
            and "Belum dinilai" in cek["kos-mbak-tuti"] and "4/5" in cek["kos-mbak-tuti"]
            and "Belum kami catat" in cek["rumah-kos-bu-endang"]
        )
        catat(12, "Detail dengan skor tinggi, rendah, null", ok12, "Anggrek Cakra 5/5 Sangat bersih + 1/5 Berisik; Putra Bahagia 3,5/5 + kedap 'Belum dinilai'; Mbak Tuti kebersihan 'Belum dinilai' + 4/5; tanpa penilaian: 'Belum kami catat'; tidak ada nilai 0", jenis)

        # 13: evidence and help with the keyboard; numbers unchanged
        await buka(pg, BASE + "/kos/kost-anggrek-cakra")
        bk = pg.get_by_role("button", name=re.compile("^Lihat bukti kebersihan"))
        await bk.focus()
        await pg.keyboard.press("Enter")
        await expect(bk).to_have_attribute("aria-expanded", "true")
        await pg.wait_for_timeout(350)  # the panel opens with a 200 ms grid-rows transition
        isi_k = await pg.locator("#bukti-kebersihan").inner_text()
        bs = pg.get_by_role("button", name=re.compile("^Lihat bukti kedap suara"))
        await bs.focus()
        await pg.keyboard.press("Enter")
        await expect(bs).to_have_attribute("aria-expanded", "true")
        await pg.wait_for_timeout(350)
        isi_s = await pg.locator("#bukti-kedap").inner_text()
        await pg.locator("#kebersihan").scroll_into_view_if_needed()
        await pg.screenshot(path=str(OUT / f"kondisi-bukti-terbuka-hp-{jenis}.png"), full_page=False)
        await pg.locator("#kebersihan").screenshot(path=str(OUT / f"kondisi-bukti-terbuka-hp-bagian-{jenis}.png"))
        await pg.keyboard.press("Enter")
        await expect(bs).to_have_attribute("aria-expanded", "false")
        cara = pg.get_by_role("button", name="Cara dinilai")
        await cara.focus()
        await pg.keyboard.press("Enter")
        d = pg.get_by_role("dialog", name="Arti angka skor")
        await expect(d.get_by_text("Skor Bahagia (0–10)")).to_be_visible(timeout=15000)
        await pg.keyboard.press("Escape")
        await expect(pg.locator("[role=dialog]")).to_have_count(0, timeout=5000)
        await pg.wait_for_timeout(500)
        fokus = await pg.evaluate("document.activeElement?.innerText || ''")
        kurang = [x for x in ("Kamar mandi", "5/5", "Dapur bersama", "Belum kami catat", "Koridor", "Yang membersihkan", "Sampah diangkut") if x not in isi_k] + [
            x for x in ("49 dB", "81 dB", "Selisih 32 dB", "tembus jelas", "gypsum", "Diukur di", "Sumber bising", "Batas pengukuran", "bukan skor") if x not in isi_s
        ]
        angka = not kurang
        catat(13, "Buka/tutup dua bukti dan bantuan", angka and "Cara dinilai" in fokus, f"Enter membuka/menutup kedua accordion; angka lama {'semua ada (5/5, 49/81 dB, selisih 32)' if angka else 'TIDAK ditemukan: ' + str(kurang)}; 'Cara dinilai' membuka sheet, Escape mengembalikan fokus ke '{fokus.strip()[:20]}'", jenis)

        # 14: anchors
        await buka(pg, BASE + "/kos/kost-anggrek-cakra#bukti-kedap")
        await pg.wait_for_timeout(900)
        terbuka = await pg.get_by_role("button", name=re.compile("^Lihat bukti kedap suara")).get_attribute("aria-expanded")
        atas = await pg.locator("#bukti-kedap").evaluate("e => e.getBoundingClientRect().top")
        await pg.evaluate("window.scrollTo(0, 0)")
        await pg.wait_for_timeout(300)
        await pg.get_by_role("link", name="Lihat kebersihan & kedap suara").click()
        await pg.wait_for_timeout(900)
        atas2 = await pg.locator("#kebersihan").evaluate("e => e.getBoundingClientRect().top")
        # lowest edge of the phone bar, including the section nav hanging below it
        bawah_header = await pg.evaluate("Math.max(...[...document.querySelectorAll('div.sticky.top-0, div.sticky.top-0 nav')].map((e) => e.getBoundingClientRect().bottom))")
        # Around the point where the title leaves the bar, the page must stand still
        # (the nav used to grow the bar and hide itself again, every frame, in WebKit).
        goyang = await pg.evaluate("""async () => {
          const tunggu = (ms) => new Promise((r) => setTimeout(r, ms));
          window.scrollTo({ top: 0, behavior: 'instant' }); await tunggu(200);
          const r = document.querySelector('h1').getBoundingClientRect(); const out = [];
          // each position is reached in one jump from the top, like a fling or an anchor jump
          for (let y = Math.round(r.top + scrollY) - 20; y <= Math.round(r.bottom + scrollY) + 60; y += 5) {
            window.scrollTo({ top: 0, behavior: 'instant' }); await tunggu(120);
            window.scrollTo({ top: y, behavior: 'instant' }); await tunggu(150);
            const lihat = new Set();
            for (let i = 0; i < 10; i++) { await new Promise((q) => requestAnimationFrame(q)); lihat.add(document.documentElement.scrollHeight + ':' + Math.round(scrollY)); }
            if (lihat.size > 1) out.push(y + ' px: ' + [...lihat].join(' / '));
          }
          return out; }""")
        catat(14, "Anchor menuju kondisi/bukti", terbuka == "true" and atas >= 56 and atas2 >= bawah_header - 1 and not goyang, f"#bukti-kedap langsung terbuka (top {atas:.0f} px); tautan dari Skor Bahagia ke #kebersihan (top {atas2:.0f} px, bar + nav bagian sampai {bawah_header:.0f} px); halaman diam di sekitar batas judul: {goyang or 'ya, tiap 5 px di sekitar judul × 10 frame'}", jenis)

        # 15: red flag and incomplete cost stay visible
        await buka(pg, BASE + "/kos/rumah-kos-cendana")
        panel = pg.get_by_role("alert").filter(has_text="Perlu kamu tahu")
        rf = await panel.is_visible() and not await panel.evaluate("e => !!e.closest('[inert]')")
        await buka(pg, BASE + "/kos/kos-om-deddy")
        sementara = "Total sementara" in await pg.locator("#ringkasan").inner_text()
        await c.close()
        catat(15, "Red flag dan biaya belum lengkap", rf and sementara, "panel keselamatan tetap terbuka; 'Total sementara' dan nama biaya yang belum diketahui tetap di ringkasan", jenis)

    # 16: map and 360° are not reloaded or blacked out by the transition ------------
    async def s16():
        c, pg = await baru(PC)
        minta = []
        pg.on("request", lambda r: minta.append(r.url))
        await buka(pg, BASE + "/cari?area=binus-kemanggisan")
        await pg.wait_for_timeout(2500)
        await pg.locator("ul.grid[aria-busy=false] article h3 a").first.click()
        await pg.wait_for_timeout(45)
        foto = await pg.screenshot(clip={"x": 760, "y": 140, "width": 600, "height": 600})
        await pg.wait_for_url(re.compile(r"/kos/"))
        await pg.wait_for_timeout(1200)
        await pg.go_back()
        await pg.wait_for_url(re.compile(r"/cari"))
        await pg.wait_for_timeout(2000)
        (OUT / f"_peta-saat-transisi-{jenis}.png").write_bytes(foto)
        from PIL import Image, ImageStat  # local import: only this check needs Pillow

        terang = sum(ImageStat.Stat(Image.open(OUT / f"_peta-saat-transisi-{jenis}.png").convert("L")).mean)
        (OUT / f"_peta-saat-transisi-{jenis}.png").unlink()
        worker = sum("maplibre-gl-worker" in u for u in minta)
        tur = sum("360" in u and ("foto360" in u or u.endswith(".jpg")) for u in minta)
        await c.close()
        catat(16, "Peta dan 360° saat navigasi", terang > 60 and worker <= 1 and tur == 0, f"peta tidak hitam saat transisi (kecerahan rata-rata {terang:.0f}/255); worker peta diminta {worker}×; file 360° tidak dimuat ({tur})", jenis)

    # 17: overflow during and after the intro, landscape, 200 % -------------------
    async def s17():
        luap = []
        for nama, opsi, teks2x in (
            ("360", dict(viewport={"width": 360, "height": 780}, is_mobile=True, has_touch=True), False),
            ("390", dict(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True), False),
            ("768", dict(viewport={"width": 768, "height": 1024}), False),
            ("1440", dict(viewport={"width": 1440, "height": 900}), False),
            ("landscape 844×390", dict(viewport={"width": 844, "height": 390}, is_mobile=True, has_touch=True), False),
            ("640 (zoom 200%)", dict(viewport={"width": 640, "height": 900}), False),
            ("390 teks 200%", dict(viewport={"width": 390, "height": 844}), True),
        ):
            c, pg = await baru(opsi)
            for u in ("/", "/cari?area=binus-kemanggisan", "/kos/kost-anggrek-cakra"):
                await buka(pg, BASE + u)
                await pg.reload(wait_until="load")
                if teks2x:
                    await pg.evaluate("document.documentElement.style.fontSize = '200%'")
                await pg.wait_for_timeout(250)
                selama = await pg.evaluate("document.documentElement.scrollWidth")
                await pg.wait_for_timeout(1600)
                sesudah = await pg.evaluate("document.documentElement.scrollWidth")
                w = opsi["viewport"]["width"]
                if max(selama, sesudah) > w:
                    luap.append(f"{nama} {u}: {max(selama, sesudah)}")
                overlay = await pg.locator("[data-intro-logo]").is_visible()
                if overlay:
                    luap.append(f"{nama} {u}: overlay masih tampil")
            await c.close()
        catat(17, "Zoom 200%, landscape, layar kecil", not luap, f"overflow/overlay tertinggal: {luap or 'tidak ada'} (selama dan sesudah intro)", jenis)

    # Condition section: default and open, phone and desktop; sizes for comparison.
    async def bukti_kondisi():
        ukuran = {}
        for label, opsi in (("hp", HP), ("pc", PC)):
            c, pg = await baru(opsi)
            await buka(pg, BASE + "/kos/kost-anggrek-cakra")
            for sel in ("#skor", "#kebersihan"):
                el = pg.locator(sel)
                await el.scroll_into_view_if_needed()
                # same measure as docs/tangkapan/v3-motion/sebelum/ukuran.json (default state; innerText also counts
                # text in closed accordions), plus the words outside closed accordions
                ukuran[f"{label} {sel}"] = await el.evaluate("e => { const kata = (x) => x.innerText.split(/\\s+/).filter(Boolean).length; const tertutup = [...e.querySelectorAll('[inert]')].reduce((n, x) => n + kata(x), 0); return { tinggi_px: Math.round(e.getBoundingClientRect().height), jumlah_kata: kata(e), kata_terlihat: kata(e) - tertutup }; }")
                await el.screenshot(path=str(OUT / f"{label}-{sel[1:]}-default-{jenis}.png"))
            if label == "pc":
                for t in ("Lihat bukti kebersihan", "Lihat bukti kedap suara"):
                    await pg.get_by_role("button", name=re.compile(f"^{t}")).click()
                await pg.wait_for_timeout(400)
                await pg.locator("#kebersihan").screenshot(path=str(OUT / f"pc-kebersihan-terbuka-{jenis}.png"))
            await c.close()
        (OUT / f"ukuran-{jenis}.json").write_text(json.dumps(ukuran, indent=2))
        print("ukuran", ukuran)

    async def intro_frames():
        c, pg = await baru(HP)
        await buka(pg, BASE + "/")
        await pg.reload(wait_until="commit")
        t_awal = time.time()
        for t, nama in ((90, "1-muncul"), (330, "2-senyum"), (700, "3-terbang"), (1500, "4-selesai")):
            sisa = t / 1000 - (time.time() - t_awal)
            if sisa > 0:
                await pg.wait_for_timeout(sisa * 1000)
            await pg.screenshot(path=str(OUT / f"intro-hp-{nama}-{jenis}.png"))
        await c.close()

    daftar = [
        ("5/6", "Intro beranda", s5_6),
        (7, "Intro header mobile khusus", s7),
        (8, "Intro dihentikan", s8),
        (1, "Alur utama", s1),
        (2, "Simpanan/Bandingkan", s2),
        (3, "Navigasi cepat", s3),
        (4, "Query", s4),
        (9, "Tanpa JS", s9),
        (10, "Reduced motion", s10),
        (11, "bfcache/StrictMode", s11),
        ("12-15", "Kondisi", s12_15),
        (16, "Peta", s16),
        (17, "Overflow", s17),
    ]
    if jenis == "webkit":
        # Safari engine: the parts that depend on browser features.
        daftar = [d for d in daftar if d[0] in ("5/6", 7, 1, 4, 9, "12-15", 17)]
    hanya = [x for x in os.environ.get("HANYA", "").split(",") if x]  # e.g. HANYA=1,12-15
    if hanya:
        daftar = [d for d in daftar if str(d[0]) in hanya]
    for no, nama, f in daftar:
        await jalankan(no, nama, f, jenis)
    if not hanya:
        await jalankan("bukti", "Screenshot kondisi", bukti_kondisi, jenis)
        if jenis == "chromium":
            await jalankan("bukti", "Frame intro", intro_frames, jenis)
    await b.close()


async def main():
    async with async_playwright() as p:
        for jenis in [j for j in os.environ.get("MESIN", "chromium,webkit").split(",") if j]:
            try:
                await suite(p, jenis)
            except Exception as e:  # noqa: BLE001 - e.g. webkit not installed
                catat("-", f"Mesin {jenis}", False, f"tidak bisa dijalankan: {str(e)[:200]}", jenis)
    shutil.rmtree(VIDEO / "_mentah", ignore_errors=True)
    (OUT / "hasil-uji.json").write_text(json.dumps({"base": BASE, "waktu": time.strftime("%Y-%m-%d %H:%M"), "hasil": hasil}, ensure_ascii=False, indent=2))
    gagal = [h for h in hasil if not h["lulus"]]
    print(f"\n{len(hasil) - len(gagal)}/{len(hasil)} lulus")


asyncio.run(main())
