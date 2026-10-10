"""Browser scenarios for the UX v3 iteration (docs/hasil-iterasi-v3.md).

Runs the 26 scenarios from docs/prompt-ux-v3-kuesioner.md §14 against a running
build plus the local Supabase stack, checks counts against the database through
the same RPC the app calls, runs axe-core, and writes evidence screenshots.

  npm run build && npm run start -- --port 3011      # in another terminal
  python3 scripts/uji-ux-v3.py                       # needs: pip install playwright

Output: pemeriksaan JSON in docs/tangkapan/v3/hasil-uji.json, screenshots in
docs/tangkapan/v3/. Uses local data only; nothing is sent to WhatsApp or prod.
"""

import asyncio
import json
import os
import re
import sys
import time
import urllib.request
from pathlib import Path

from playwright.async_api import async_playwright, expect

AKAR = Path(__file__).resolve().parent.parent
BASE = os.environ.get("BASE", "http://localhost:3011")
REST = os.environ.get("REST", "http://127.0.0.1:54321/rest/v1")
# OUT_DIR keeps a regression run from overwriting the v3 evidence.
OUT = Path(os.environ["OUT_DIR"]) if os.environ.get("OUT_DIR") else AKAR / "docs" / "tangkapan" / "v3"
OUT.mkdir(parents=True, exist_ok=True)
ANON = next(
    l.split("=", 1)[1].strip()
    for l in (AKAR / ".env.local").read_text().splitlines()
    if l.startswith("NEXT_PUBLIC_SUPABASE_ANON_KEY=")
)
AXE = (AKAR / "node_modules" / "axe-core" / "axe.min.js").read_text()

PUSAT = {"binus-kemanggisan": (-6.2019, 106.7818, 2000), "palmerah": (-6.1985, 106.7905, 3000)}
HP = dict(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
PC = dict(viewport={"width": 1440, "height": 900}, device_scale_factor=1)

hasil: list[dict] = []


def catat(no: int, nama: str, lulus: bool, catatan: str = ""):
    hasil.append({"no": no, "skenario": nama, "lulus": bool(lulus), "catatan": catatan})
    print(f"{'LULUS' if lulus else 'GAGAL'} {no:>2} {nama}: {catatan}", flush=True)


def rest(path: str, body=None):
    req = urllib.request.Request(
        f"{REST}/{path}",
        data=json.dumps(body).encode() if body is not None else None,
        headers={"apikey": ANON, "Authorization": f"Bearer {ANON}", "Content-Type": "application/json"},
        method="POST" if body is not None else "GET",
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


def cari(area: str, limit=200, **f):
    """cari_kos_v4 with the same arguments the app builds (lib/cari/ambil.ts)."""
    lat, lng, radius = PUSAT[area]
    aturan = {}
    args = {"p_lat": lat, "p_lng": lng, "p_radius_m": radius, "p_limit": limit, "p_aturan": aturan}
    for k, v in f.items():
        args[f"p_{k}"] = v
    return rest("rpc/cari_kos_v4", args)


def total(area: str, **f) -> int:
    r = cari(area, limit=1, **f)
    return int(r[0]["total_count"]) if r else 0


async def buka(pg, url: str):
    """Load, then give the network a moment to settle (prefetches never block the check)."""
    await pg.goto(url, wait_until="load", timeout=60000)
    try:
        await pg.wait_for_load_state("networkidle", timeout=8000)
    except Exception:  # noqa: BLE001 - a slow prefetch is not a failure
        pass


async def jumlah_ui(pg) -> int:
    loc = pg.locator("p[aria-live=polite]").first
    await expect(loc).to_have_text(re.compile(r"^\d+ kos$"), timeout=15000)
    return int((await loc.inner_text()).split()[0])


async def tunggu_url(pg, pola: str):
    await pg.wait_for_function("p => location.href.includes(p)", arg=pola, timeout=15000)


async def foto(pg, nama: str, full=False):
    await pg.screenshot(path=str(OUT / nama), full_page=full)


def kartu_utama(pg):
    return pg.locator("ul.grid[aria-busy=false] > li > article")


async def jalankan(no, nama, fungsi):
    try:
        await fungsi()
    except Exception as e:  # noqa: BLE001 - record and continue
        catat(no, nama, False, f"{type(e).__name__}: {str(e)[:300]}")


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()

        async def baru(opsi=HP, **extra):
            c = await b.new_context(**opsi, **extra)
            pg = await c.new_page()
            pg.galat = []
            pg.on("pageerror", lambda e: pg.galat.append(str(e)))
            pg.on("console", lambda m: pg.galat.append(m.text) if m.type == "error" and "favicon" not in m.text else None)
            return c, pg

        # 1 -----------------------------------------------------------------
        async def s1():
            c, pg = await baru()
            await buka(pg, BASE + "/")
            await pg.get_by_role("link", name=re.compile("^Kamar mandi dalam")).first.click()
            await tunggu_url(pg, "fasilitas=kamar-mandi-dalam")
            n = await jumlah_ui(pg)
            k = kartu_utama(pg).first
            teks = await k.inner_text()
            ada = all(re.search(x, teks) for x in [r"Rp[\d.]+/bln", r"(Total|Estimasi|Total sementara)", r"(Tersedia|Penuh|Belum dikonfirmasi)", r"Kamar "])
            await k.locator("h3 a").click()
            await pg.wait_for_url(re.compile(r"/kos/"), timeout=15000)
            await expect(pg.locator("h1")).to_be_visible()
            bar = await pg.locator("div.fixed.bottom-0").first.inner_text()
            catat(1, "Beranda → cari → detail", ada and n > 0 and "/bln" in bar, f"{n} kos; kartu memuat total, status, kamar; detail terbuka dengan bar harga")
            await c.close()

        # 2 + 3 ---------------------------------------------------------------
        async def s2_3():
            c, pg = await baru()
            await buka(pg, BASE + "/cari?area=binus-kemanggisan")
            k = kartu_utama(pg).first
            nama = (await k.locator("h3").inner_text()).strip()
            url = pg.url
            await k.get_by_role("button", name=f"Simpan {nama}").click()
            tombol = k.get_by_role("button", name=re.compile(r"^Tersimpan"))
            await expect(tombol).to_have_attribute("aria-pressed", "true")
            await expect(pg.get_by_text("tersimpan di perangkat ini")).to_be_visible()
            tetap = pg.url == url
            await foto(pg, "01-kartu-tersimpan-hp.png")
            await pg.get_by_role("button", name="Menu").first.click()
            dialog = pg.get_by_role("dialog")
            await expect(dialog.get_by_role("link", name=re.compile("^Simpanan"))).to_contain_text("1 kos tersimpan", timeout=15000)
            await dialog.get_by_role("link", name=re.compile("^Simpanan")).click()
            await pg.wait_for_url(re.compile(r"/disimpan"), timeout=15000)
            await expect(pg.locator("article h3", has_text=nama)).to_be_visible()
            await pg.reload(wait_until="load")
            await expect(pg.locator("article h3", has_text=nama)).to_be_visible()
            catat(2, "Simpan dari kartu, buka simpanan, reload", tetap, f"'{nama}' tersimpan; tombol jadi Tersimpan; tidak pindah halaman; masih ada setelah reload")
            # 3: remove from the list, then save/unsave on the detail page
            await pg.locator("article").first.get_by_role("button", name=re.compile(r"^Tersimpan")).click()
            await expect(pg.get_by_text("Belum ada kos tersimpan.")).to_be_visible()
            await buka(pg, BASE + "/kos/kost-anggrek-cakra")
            await pg.get_by_role("button", name="Simpan Kost Anggrek Cakra").click()
            await expect(pg.get_by_role("button", name=re.compile(r"^Tersimpan: Kost Anggrek Cakra"))).to_have_attribute("aria-pressed", "true")
            await pg.get_by_role("button", name=re.compile(r"^Tersimpan: Kost Anggrek Cakra")).click()
            disk = await pg.evaluate("localStorage.getItem('kb:simpan')")
            await buka(pg, BASE + "/cari?area=binus-kemanggisan")
            k2 = pg.locator("article", has=pg.locator("h3", has_text="Kost Anggrek Cakra")).first
            await expect(k2.get_by_role("button", name="Simpan Kost Anggrek Cakra")).to_have_attribute("aria-pressed", "false")
            catat(3, "Hapus simpanan dari daftar, detail, kartu", disk == "[]", "dari /disimpan dan dari detail; kartu di hasil ikut kembali ke 'Simpan'; localStorage kosong")
            await c.close()

        # 4 + 5 ---------------------------------------------------------------
        async def s4_5():
            c, pg = await baru()
            ac = rest("tipe_kamar?select=id&nama=eq.AC%20%2B%20kamar%20mandi%20dalam&kos_id=eq." + rest("kos?select=id&slug=eq.kost-anggrek-cakra")[0]["id"])[0]["id"]
            await buka(pg, BASE + "/kos/kost-anggrek-cakra")
            await pg.get_by_role("radiogroup", name="Pilih tipe kamar").get_by_role("radio", name=re.compile(r"^AC \+ kamar mandi dalam")).click()
            await pg.get_by_role("button", name=re.compile(r"^Bandingkan Kost Anggrek Cakra, kamar AC")).click()
            await expect(pg.get_by_role("button", name=re.compile(r"^Dalam banding: Kost Anggrek Cakra, kamar AC"))).to_be_visible()
            await foto(pg, "06-detail-header-label-hp.png")
            await buka(pg, BASE + "/kos/kos-putri-melati")
            await pg.get_by_role("button", name=re.compile(r"^Bandingkan Kos Putri Melati")).click()
            await buka(pg, BASE + "/banding")
            await pg.wait_for_url(re.compile(r"/banding\?kos="), timeout=15000)
            tabel = pg.get_by_role("region", name=re.compile("Tabel perbandingan"))
            pilih = tabel.locator("select").first
            nilai = await pilih.input_value()
            isi = await tabel.inner_text()
            ok4 = nilai == ac and "Kos putri" in isi and "Rp2.195.000" in isi and "Penuh" in isi
            await foto(pg, "19-banding-dua-kos-hp.png")
            catat(4, "Banding dua kos dengan tipe kamar tertentu", ok4, "kolom Anggrek Cakra tetap kamar AC (Rp2.195.000, Penuh), tipe penghuni tertulis")
            # 5: a fourth candidate asks which one to replace
            for slug in ["kost-putri-aisyah", "griya-asri-kemanggisan"]:
                await buka(pg, BASE + f"/kos/{slug}")
                await pg.get_by_role("button", name=re.compile(r"^Bandingkan ")).first.click()
            dialog = pg.get_by_role("dialog", name="Sudah 3 pilihan dibandingkan")
            # Headless UI's dialog root is 0×0 (its panel is fixed): check what it shows instead.
            await expect(dialog.get_by_text(re.compile("Ganti yang mana"))).to_be_visible(timeout=15000)
            await foto(pg, "20-ganti-kandidat-keempat-hp.png")
            sebelum = json.loads(await pg.evaluate("localStorage.getItem('kb:banding')"))
            await dialog.get_by_role("button", name=re.compile("Kos Putri Melati")).click()
            sesudah = json.loads(await pg.evaluate("localStorage.getItem('kb:banding')"))
            nama = [x["nama"] for x in sesudah]
            ok5 = len(sebelum) == 3 and len(sesudah) == 3 and "Kos Putri Melati" not in nama and "Griya Asri Kemanggisan" in nama and "Kost Anggrek Cakra" in nama
            catat(5, "Tambah kandidat keempat", ok5, f"sebelum {[x['nama'] for x in sebelum]}, sesudah {nama}")
            await c.close()

        # 6–9 -----------------------------------------------------------------
        async def s6_9():
            c, pg = await baru()
            await buka(pg, BASE + "/cari?area=palmerah")
            semua = await jumlah_ui(pg)
            await pg.locator("button[aria-haspopup=dialog]", has_text="Filter").first.click()
            d = pg.get_by_role("dialog")
            await d.get_by_role("button", name="Putra", exact=True).click()
            await tunggu_url(pg, "tipe=putra")
            await d.get_by_role("button", name="Campur", exact=True).click()
            await tunggu_url(pg, "tipe=putra,campur")
            lihat = d.get_by_role("button", name=re.compile(r"^Lihat \d+ kos$"))
            await expect(lihat).to_be_visible(timeout=15000)
            n_sheet = int(re.search(r"\d+", await lihat.inner_text()).group())
            await foto(pg, "03-filter-sheet-tipe-hp.png")
            pressed = [await d.get_by_role("button", name=t, exact=True).get_attribute("aria-pressed") for t in ["Putra", "Putri", "Campur"]]
            await lihat.click()
            await expect(pg.locator("[role=dialog]")).to_have_count(0, timeout=5000)
            await pg.wait_for_timeout(600)  # the sheet's own copy of the chips leaves with its exit transition
            n_db = total("palmerah", tipe=["putra", "campur"])
            tipe_kartu = await kartu_utama(pg).locator("span.rounded-md.bg-kertas-50").all_inner_texts()
            ok6 = n_sheet == n_db and pressed == ["true", "false", "true"] and "Putri" not in tipe_kartu and set(tipe_kartu) <= {"Putra", "Campur"}
            catat(6, "Pilih Putra + Campur", ok6, f"UI {n_sheet} = DB {n_db}; kartu dimuat: {sorted(set(tipe_kartu))}")
            await foto(pg, "04-filter-aktif-hp.png")
            await pg.get_by_role("button", name="Hapus filter Kos putra").click()
            await pg.wait_for_function("() => new URLSearchParams(location.search).get('tipe') === 'campur'", timeout=15000)
            n7 = await jumlah_ui(pg)
            catat(7, "Hapus Putra dari pilihan", n7 == total("palmerah", tipe=["campur"]), f"URL tipe=campur; {n7} kos (DB {total('palmerah', tipe=['campur'])})")
            await buka(pg, BASE + "/cari?area=palmerah&tipe=putra,putri,campur")
            n_tiga = await jumlah_ui(pg)
            catat(8, "Tanpa tipe = ketiga tipe", n_tiga == semua == total("palmerah"), f"tanpa pilihan {semua}, ketiganya {n_tiga}, DB {total('palmerah')}")
            await buka(pg, BASE + "/cari?area=palmerah&tipe=putra")
            n_lama = await jumlah_ui(pg)
            badge = await pg.locator("button[aria-haspopup=dialog]", has_text="Filter").first.inner_text()
            chip = await pg.get_by_role("button", name="Hapus filter Kos putra").count()
            await buka(pg, BASE + "/cari?area=palmerah&tipe=campur,putra,asrama")
            n_multi = await jumlah_ui(pg)
            ok9 = n_lama == total("palmerah", tipe=["putra"]) and "1" in badge and chip == 1 and n_multi == total("palmerah", tipe=["putra", "campur"])
            catat(9, "URL tipe lama dan multi-tipe", ok9, f"tipe=putra → {n_lama}, badge '{badge.strip()}'; tipe=campur,putra,asrama → {n_multi} (nilai asing dibuang)")
            await c.close()

        # 10–12 ---------------------------------------------------------------
        async def s10_12():
            c, pg = await baru()
            ac = rest("tipe_kamar?select=id&nama=eq.AC%20%2B%20kamar%20mandi%20dalam&kos_id=eq." + rest("kos?select=id&slug=eq.kost-anggrek-cakra")[0]["id"])[0]["id"]
            await buka(pg, BASE + "/cari?area=binus-kemanggisan&fasilitas=kamar-mandi-dalam")
            k = pg.locator("article", has=pg.locator("h3", has_text="Kost Anggrek Cakra")).first
            await k.scroll_into_view_if_needed()
            teks = await k.inner_text()
            href = await k.locator("h3 a").get_attribute("href")
            await foto(pg, "05-km-dalam-kamar-acuan-hp.png")
            await k.locator("h3 a").click()
            await pg.wait_for_url(re.compile(r"/kos/kost-anggrek-cakra"), timeout=15000)
            ringkas = await pg.locator("#ringkasan").inner_text()
            tombol = await pg.locator("div.fixed.bottom-0").first.inner_text()
            ok10 = "Kamar AC + kamar mandi dalam" in teks and href.endswith(ac) and "AC + kamar mandi dalam" in ringkas and "Penuh" in ringkas and "Tanya kapan tersedia" in tombol
            catat(10, "Kamar mandi dalam pada kos bertipe kamar campuran", ok10, "kartu dan detail menunjuk kamar AC + kamar mandi dalam (Penuh, Rp2.195.000), tombol 'Tanya kapan tersedia'")
            await buka(pg, BASE + "/cari?area=binus-kemanggisan&harga_max=2200000&tipe=putri&fasilitas=kamar-mandi-dalam")
            n11 = await jumlah_ui(pg)
            db11 = cari("binus-kemanggisan", harga_max=2200000, tipe=["putri"], fasilitas=["kamar-mandi-dalam"])
            semua_ok = all(r["total_bulanan"] <= 2200000 and r["total_lengkap"] and r["kamar"]["kamar_mandi_dalam"] for r in db11)
            kartu11 = await kartu_utama(pg).all_inner_texts()
            ok11 = n11 == len(db11) and semua_ok and all("kamar mandi dalam" in t for t in kartu11)
            catat(11, "Harga + kamar mandi dalam + tipe", ok11, f"{n11} kos; setiap kamar acuan ≤ Rp2.200.000, total lengkap, ada kamar mandi dalam")
            await c.close()
            c, pg = await baru(PC)
            await buka(pg, BASE + "/cari?area=binus-kemanggisan&fasilitas=kamar-mandi-dalam")
            n12 = await jumlah_ui(pg)
            db12 = cari("binus-kemanggisan", fasilitas=["kamar-mandi-dalam"])
            slug_db = {r["slug"] for r in db12}
            promo = await pg.locator("section[aria-labelledby=promosi-judul] article h3 a").evaluate_all("as => as.map(a => a.getAttribute('href').split('/')[2].split('?')[0])")
            utama = await kartu_utama(pg).locator("h3 a").evaluate_all("as => as.map(a => a.getAttribute('href').split('/')[2].split('?')[0])")
            ok12 = n12 == len(db12) and set(promo) <= slug_db and set(utama) <= slug_db and len(utama) == min(20, len(db12))
            await pg.wait_for_timeout(1500)
            await foto(pg, "02-hasil-filter-peta-desktop.png")
            catat(12, "Daftar, promosi, jumlah, peta memakai filter yang sama", ok12, f"jumlah {n12} = DB {len(db12)}; promosi {promo} ⊆ hasil; peta menerima array hasil yang sama (PetaHasil kos={{hasil}})")
            await c.close()

        # 13 -----------------------------------------------------------------
        async def s13():
            c, pg = await baru()
            await buka(pg, BASE + "/cari?area=binus-kemanggisan")
            tahan = {"n": 0}

            async def lambat(route):
                body = route.request.post_data or ""
                # The first request after the click (kebersihan only) is held back.
                if '"p_min_kebersihan":4' in body and '"p_min_kedap"' not in body and tahan["n"] == 0:
                    tahan["n"] += 1
                    await asyncio.sleep(2.5)
                await route.continue_()

            await pg.route("**/rest/v1/rpc/cari_kos_v4", lambat)
            await pg.locator('ul[aria-label="Filter cepat"]').get_by_role("button", name="Bersih").click()
            await pg.wait_for_timeout(150)
            await pg.locator('ul[aria-label="Filter cepat"]').get_by_role("button", name="Kedap suara").click()
            await tunggu_url(pg, "kedap=4")
            await pg.wait_for_timeout(3500)  # the held response has landed by now
            n = await jumlah_ui(pg)
            db = total("binus-kemanggisan", min_kebersihan=4, min_kedap=4)
            catat(13, "Ubah filter cepat saat request berjalan", n == db and tahan["n"] == 1, f"respons lama ditahan 2,5 s; tampil {n} kos = DB {db} untuk pilihan terbaru")
            await c.close()

        # 14 + 15 -----------------------------------------------------------
        async def s14_15():
            c, pg = await baru()
            await buka(pg, BASE + "/cari?area=binus-kemanggisan")
            await pg.locator('ul[aria-label="Filter cepat"]').get_by_role("button", name="Kamar mandi dalam").click()
            await tunggu_url(pg, "fasilitas=kamar-mandi-dalam")
            await pg.get_by_role("button", name=re.compile("^Peta|^Daftar")).click()
            await tunggu_url(pg, "tampil=peta")
            u1 = pg.url
            await pg.reload(wait_until="load")
            await expect(pg.get_by_role("button", name="Daftar")).to_be_visible(timeout=15000)
            reload_ok = pg.url == u1
            c2, pg2 = await baru()
            await buka(pg2, u1)
            await expect(pg2.get_by_role("button", name="Daftar")).to_be_visible(timeout=15000)
            await pg2.get_by_role("button", name="Daftar").click()
            await expect(pg2.get_by_role("button", name="Hapus filter Kamar mandi dalam")).to_be_visible(timeout=15000)
            share_ok = "fasilitas=kamar-mandi-dalam" in pg2.url
            await c2.close()
            await pg.go_back()
            await pg.wait_for_function("() => !location.search.includes('kamar-mandi-dalam')", timeout=15000)
            back_ok = "area=binus-kemanggisan" in pg.url
            await pg.go_forward()
            await tunggu_url(pg, "fasilitas=kamar-mandi-dalam")
            catat(14, "Refresh, URL dibagikan, back/forward", reload_ok and share_ok and back_ok, f"filter dan mode peta bertahan setelah reload ({reload_ok}) dan di konteks baru ({share_ok}); back/forward menelusuri pilihan chip ({back_ok})")
            # 15
            await buka(pg, BASE + "/cari?area=binus-kemanggisan")
            h0 = await pg.evaluate("history.length")
            tombol = pg.locator("button[aria-haspopup=dialog]", has_text="Filter").first
            await tombol.click()
            d = pg.get_by_role("dialog")
            await d.get_by_role("button", name="Putri", exact=True).click()
            await tunggu_url(pg, "tipe=putri")
            await d.get_by_role("button", name="AC", exact=True).click()
            await tunggu_url(pg, "fasilitas=ac")
            await pg.keyboard.press("Escape")
            await expect(pg.locator("[role=dialog]")).to_have_count(0, timeout=5000)
            await pg.wait_for_timeout(500)
            fokus = await pg.evaluate("document.activeElement?.innerText || ''")
            h1 = await pg.evaluate("history.length")
            u_esc = pg.url
            await tombol.click()
            await d.get_by_role("button", name="Campur", exact=True).click()
            await tunggu_url(pg, "tipe=putri,campur")
            await pg.go_back()
            await expect(pg.locator("[role=dialog]")).to_have_count(0, timeout=5000)
            await pg.wait_for_timeout(500)
            tetap = "tipe=putri,campur" in pg.url
            await tombol.click()
            await d.get_by_role("button", name=re.compile(r"^Tutup filter")).click()
            await expect(pg.locator("[role=dialog]")).to_have_count(0, timeout=5000)
            ok15 = "Filter" in fokus and h1 == h0 + 1 and "tipe=putri" in u_esc and "fasilitas=ac" in u_esc and tetap
            catat(15, "Tutup FilterSheet lewat Escape, back, tombol", ok15, f"satu sesi = {h1 - h0} entri history; pilihan tetap setelah Escape dan back; fokus kembali ke '{fokus.strip()[:20]}'")
            await c.close()

        # 16 -----------------------------------------------------------------
        async def s16():
            c, pg = await baru()
            await buka(pg, BASE + "/cari?area=binus-kemanggisan&harga_min=2000000&harga_max=1500000")
            galat = await pg.get_by_role("alert").filter(has_text="Rentang harga tidak valid").count()
            await buka(pg, BASE + "/cari?area=binus-kemanggisan&harga_max=1500000&fasilitas=kamar-mandi-dalam,ac")
            await expect(pg.get_by_text("Nggak ada yang pas.")).to_be_visible()
            saran = pg.locator("a", has_text=re.compile(r"\d+ kos$"))
            await expect(saran.first).to_be_visible(timeout=20000)
            await foto(pg, "21-hasil-nol-saran-hp.png")
            cek = []
            for i in range(await saran.count()):
                href = await saran.nth(i).get_attribute("href")
                label = await saran.nth(i).inner_text()
                n_ui = int(re.search(r"(\d+) kos$", label).group(1))
                q = dict(x.split("=", 1) for x in href.split("?", 1)[1].split("&"))
                f = {}
                if "harga_max" in q:
                    f["harga_max"] = int(q["harga_max"])
                if "fasilitas" in q:
                    f["fasilitas"] = q["fasilitas"].split(",")
                cek.append((label.split("\n")[0], n_ui, total("binus-kemanggisan", **f)))
            ok = galat == 1 and cek and all(a == b for _, a, b in cek)
            catat(16, "Rentang harga salah dan hasil nol", ok, f"error rentang tampil; saran: {cek}")
            await c.close()

        # 17–19 ---------------------------------------------------------------
        async def s17_19():
            c, pg = await baru()
            await buka(pg, BASE + "/kos/kost-anggrek-cakra")
            arti = pg.get_by_role("button", name="Arti skor").first
            await arti.click()
            d = pg.get_by_role("dialog", name="Arti angka skor")
            await expect(d).to_contain_text("Skor Bahagia (0–10)")
            await expect(d).to_contain_text("hasil ukur, bukan skor")
            await foto(pg, "08-bantuan-skor-hp.png")
            await pg.keyboard.press("Escape")
            await expect(pg.locator("[role=dialog]")).to_have_count(0, timeout=5000)
            await pg.wait_for_timeout(500)
            fokus1 = await pg.evaluate("document.activeElement?.innerText || ''")
            jarak = pg.get_by_role("button", name="Cara jarak dihitung").first
            await jarak.focus()
            await pg.keyboard.press("Enter")
            d2 = pg.get_by_role("dialog", name="Cara jarak dihitung")
            await expect(d2).to_contain_text("Jarak garis lurus")
            await foto(pg, "09-bantuan-jarak-hp.png")
            await pg.keyboard.press("Escape")
            await expect(pg.locator("[role=dialog]")).to_have_count(0, timeout=5000)
            await pg.wait_for_timeout(500)
            fokus2 = await pg.evaluate("document.activeElement?.innerText || ''")
            await pg.get_by_role("link", name="Lihat rincian biaya").first.click()
            await pg.wait_for_timeout(900)
            akordeon = pg.locator("#rincian-biaya button[aria-expanded]")
            terbuka = await akordeon.get_attribute("aria-expanded")
            atas = await pg.locator("#rincian-biaya").evaluate("e => e.getBoundingClientRect().top")
            await foto(pg, "10-rincian-biaya-terbuka-hp.png")
            ok17 = "Arti skor" in fokus1 and "Cara jarak" in fokus2 and terbuka == "true" and atas >= 56
            catat(17, "Bantuan skor/biaya/jarak lewat tap dan keyboard", ok17, f"sheet skor & jarak dibuka (tap, Enter), Escape menutup, fokus kembali; 'Lihat rincian biaya' membuka rincian (top {atas:.0f}px, di bawah header)")
            # 18: change room type
            await buka(pg, BASE + "/kos/kost-anggrek-cakra")
            sebelum = await pg.locator("#ringkasan").inner_text()
            await pg.get_by_role("radiogroup", name="Pilih tipe kamar").get_by_role("radio", name=re.compile(r"^AC \+ kamar mandi dalam")).click()
            await pg.wait_for_timeout(300)
            ringkas = await pg.locator("#ringkasan").inner_text()
            fas = await pg.locator("#fasilitas").inner_text()
            bar = await pg.locator("div.fixed.bottom-0").first.inner_text()
            ok18 = "Rp1.645.000" in sebelum and "Rp2.195.000" in ringkas and "Penuh" in ringkas and "Di kamar AC + kamar mandi dalam" in fas and "Kamar mandi dalam" in fas and "Tanya kapan tersedia" in bar and "kamar=" in pg.url
            catat(18, "Ganti tipe kamar di detail", ok18, "total, status, fasilitas kamar, tombol kontak, dan ?kamar= ikut berubah")
            # 19: section chips open folded parts
            await pg.evaluate("window.scrollTo(0, 1400)")
            await pg.wait_for_timeout(400)
            nav = pg.locator("nav[aria-label='Bagian halaman']").first
            await nav.get_by_role("link", name="Biaya").click()
            await pg.wait_for_timeout(1000)
            exp = await pg.locator("#rincian-biaya button[aria-expanded]").get_attribute("aria-expanded")
            atas_b = await pg.locator("#biaya").evaluate("e => e.getBoundingClientRect().top")
            tinggi_header = await pg.locator("div.sticky.top-0").first.evaluate("e => e.getBoundingClientRect().bottom")
            await nav.get_by_role("link", name="Sekitar").click()
            await pg.wait_for_timeout(1000)
            atas_s = await pg.locator("#sekitar").evaluate("e => e.getBoundingClientRect().top")
            await nav.get_by_role("link", name="Fasilitas").click()
            await pg.wait_for_timeout(1000)
            atas_f = await pg.locator("#fasilitas").evaluate("e => e.getBoundingClientRect().top")
            c2, pg2 = await baru()
            await buka(pg2, BASE + "/kos/kost-anggrek-cakra#rincian-biaya")
            await pg2.wait_for_timeout(600)
            exp2 = await pg2.locator("#rincian-biaya button[aria-expanded]").get_attribute("aria-expanded")
            await c2.close()
            ok19 = exp == "true" and exp2 == "true" and min(atas_b, atas_s, atas_f) >= tinggi_header - 1
            catat(19, "Anchor biaya/fasilitas/sekitar saat terlipat", ok19, f"chip Biaya membuka rincian; tautan langsung #rincian-biaya terbuka; target di bawah header ({tinggi_header:.0f}px): biaya {atas_b:.0f}, sekitar {atas_s:.0f}, fasilitas {atas_f:.0f}")
            await c.close()

        # 20 -----------------------------------------------------------------
        async def s20():
            c, pg = await baru()
            await buka(pg, BASE + "/kos/kos-putra-bahagia")
            belum = await pg.locator("#skor").inner_text()
            await buka(pg, BASE + "/kos/kos-om-deddy")
            ringkas = await pg.locator("#ringkasan").inner_text()
            biaya = await pg.locator("#biaya").inner_text()
            await buka(pg, BASE + "/kos/rumah-kos-cendana")
            panel = pg.get_by_role("alert").filter(has_text="Perlu kamu tahu")
            terlihat = await panel.is_visible()
            dalam_akordeon = await panel.evaluate("e => !!e.closest('[inert]')")
            ok = "Belum dinilai" in belum and "Total sementara" in ringkas and "belum diketahui" in ringkas and "Listrik belum diketahui" in ringkas and "Belum termasuk listrik" in biaya and terlihat and not dalam_akordeon
            catat(20, "Skor null, biaya belum diketahui, kamar penuh, red flag", ok, "Belum dinilai; Total sementara + nama biaya yang belum diketahui terlihat tanpa membuka rincian; panel keselamatan selalu terbuka (kamar penuh: skenario 10)")
            await c.close()

        # 21 -----------------------------------------------------------------
        async def s21():
            c, pg = await baru()
            await buka(pg, BASE + "/")
            kartu = pg.locator("[data-panduan-baru]").first
            awal = await kartu.is_visible()
            await kartu.scroll_into_view_if_needed()
            await foto(pg, "15-panduan-beranda-hp.png")
            await kartu.get_by_role("button", name="Mengerti").click()
            hilang = await kartu.is_hidden()
            await pg.wait_for_timeout(200)
            fokus = await pg.evaluate("document.activeElement?.id || ''")
            await pg.goto(BASE + "/", wait_until="domcontentloaded")
            tampil_awal = await pg.evaluate("getComputedStyle(document.querySelector('[data-panduan-baru]')).display")
            simpan = await pg.evaluate("[localStorage.getItem('kb:panduan'), localStorage.getItem('kb:simpan')]")
            await buka(pg, BASE + "/cari?area=palmerah")
            petunjuk_cari = await pg.locator("[data-panduan-baru]").first.is_visible()
            await pg.get_by_role("button", name="Menu").first.click()
            await pg.get_by_role("dialog").get_by_role("link", name=re.compile("^Cara menggunakan")).click()
            await pg.wait_for_url(re.compile("/cara-menggunakan"), timeout=15000)
            await pg.get_by_role("button", name="Tampilkan lagi").click()
            await pg.go_back()
            await pg.wait_for_url(re.compile("/cari"), timeout=15000)
            kembali_cari = "area=palmerah" in pg.url
            await buka(pg, BASE + "/")
            lagi = await pg.locator("[data-panduan-baru]").first.is_visible()
            await c.close()
            # storage blocked: the site still works and the guide can be closed for the page
            c, pg = await baru()
            await pg.add_init_script("Object.defineProperty(window, 'localStorage', { get() { throw new Error('diblokir'); } });")
            await buka(pg, BASE + "/")
            k2 = pg.locator("[data-panduan-baru]").first
            await k2.get_by_role("button", name="Mengerti").click()
            tanpa_storage = await k2.is_hidden() and not [g for g in pg.galat if "diblokir" in g]
            await buka(pg, BASE + "/cari?area=palmerah")
            cari_jalan = await jumlah_ui(pg) > 0
            await c.close()
            ok = awal and hilang and fokus == "preset" and tampil_awal == "none" and simpan[0] == "v1" and simpan[1] is None and not petunjuk_cari and kembali_cari and lagi and tanpa_storage and cari_jalan
            catat(21, "Panduan pertama kali, lewati, buka ulang", ok, f"kartu tampil lalu tertutup (fokus ke #{fokus}); setelah reload sudah display:none sebelum hidrasi; kunci kb:panduan terpisah dari kb:simpan; dibuka ulang dari menu; tanpa localStorage tetap jalan")

        # 22 -----------------------------------------------------------------
        async def s22():
            c, pg = await baru()
            await buka(pg, BASE + "/kos/kos-ibu-lastri")
            kosong = await pg.locator("#sekitar").inner_text()
            await buka(pg, BASE + "/kos/dkost-syahdan")
            sebagian = await pg.locator("#sekitar").inner_text()
            await pg.locator("#sekitar").scroll_into_view_if_needed()
            await foto(pg, "12-sekitar-sebagian-hp.png")
            await buka(pg, BASE + "/kos/kost-anggrek-cakra")
            lengkap = await pg.locator("#sekitar").inner_text()
            ok = "Belum kami catat" in kosong and "Belum kami catat" in sebagian and "Tidak ada yang dekat" not in (kosong + sebagian + lengkap) and "sekali makan sekitar Rp" in lengkap and "/kg" in lengkap
            catat(22, "Data sekitar kosong/sebagian, harga laundry tidak tersedia", ok, "tanpa data: 'Belum kami catat'; tidak ada klaim 'tidak ada yang dekat'; harga makan dan laundry tampil hanya bila tercatat")
            await c.close()

        # 23 -----------------------------------------------------------------
        async def s23():
            c, pg = await baru()
            hasil23 = []
            for url in ["/cari?area=binus-kemanggisan&tipe=putri", "/kos/kost-anggrek-cakra"]:
                await buka(pg, BASE + url)
                m = pg.get_by_role("button", name="Menu").first
                await m.click()
                d = pg.get_by_role("dialog", name="Menu")
                await expect(d.get_by_role("link").first).to_be_visible(timeout=15000)
                link = await d.get_by_role("link").all_inner_texts()
                label = [x.split("\n")[0] for x in link]
                if url.startswith("/kos"):
                    await foto(pg, "13-menu-hp.png")
                await pg.keyboard.press("Escape")
                await expect(pg.locator("[role=dialog]")).to_have_count(0, timeout=5000)
                await pg.wait_for_timeout(500)
                fokus = await pg.evaluate("document.activeElement?.innerText || ''")
                hasil23.append(all(x in " ".join(label) for x in ["Cari kos", "Simpanan", "Bandingkan", "Cara menggunakan"]) and "Menu" in fokus)
            await pg.get_by_role("button", name="Menu").first.click()
            await pg.get_by_role("dialog", name="Menu").get_by_role("link", name=re.compile("^Cari kos")).click()
            await pg.wait_for_url(re.compile(r"/cari\?area=binus-kemanggisan&tipe=putri"), timeout=15000)
            catat(23, "Menu dari header khusus /cari dan /kos di HP", all(hasil23), "Cari kos, Simpanan, Bandingkan, Cara menggunakan dapat dicapai; Escape menutup dan fokus kembali ke Menu; 'Cari kos' kembali ke pencarian terakhir beserta filternya")
            await c.close()

        # 24 -----------------------------------------------------------------
        async def s24():
            luap = []
            for w in (320, 360, 390, 768, 1440):
                c, pg = await baru(dict(viewport={"width": w, "height": 900}, is_mobile=w < 768, has_touch=w < 768))
                for u in [
                    "/",
                    "/cari?area=binus-kemanggisan&tipe=putra,campur&fasilitas=kamar-mandi-dalam",
                    "/cari?area=binus-kemanggisan&harga_min=2000000&harga_max=1500000",
                    "/cari?area=binus-kemanggisan&harga_max=1500000&fasilitas=kamar-mandi-dalam,ac&dekat_minimarket=1",
                    "/kos/kost-anggrek-cakra",
                    "/banding?kos=kost-anggrek-cakra,kos-putri-melati",
                    "/banding",
                    "/disimpan",
                    "/cara-menggunakan",
                    "/cara-kami-menilai",
                ]:
                    await buka(pg, BASE + u)
                    sw = await pg.evaluate("document.documentElement.scrollWidth")
                    if sw > w:
                        luap.append(f"{w}px {u}: {sw}")
                await c.close()
            # 200 %: text at double size on a phone, and a 1280 px screen zoomed to 200 % (= 640 css px)
            for w, skala in ((390, 2), (640, 1)):
                c, pg = await baru(dict(viewport={"width": w, "height": 900}))
                for u in ["/", "/cari?area=binus-kemanggisan", "/cari?area=binus-kemanggisan&harga_max=1500000&fasilitas=kamar-mandi-dalam,ac", "/kos/kost-anggrek-cakra", "/banding?kos=kost-anggrek-cakra,kos-putri-melati", "/cara-menggunakan"]:
                    await buka(pg, BASE + u)
                    await pg.wait_for_timeout(1500)
                    if skala == 2:
                        await pg.evaluate("document.documentElement.style.fontSize = '200%'")
                        await pg.wait_for_timeout(300)
                    sw = await pg.evaluate("document.documentElement.scrollWidth")
                    if sw > w:
                        luap.append(f"{w}px teks {skala * 100}% {u}: {sw}")
                await c.close()
            c, pg = await baru(PC, reduced_motion="reduce")
            await buka(pg, BASE + "/cari?area=binus-kemanggisan")
            durasi = await pg.locator('ul[aria-label="Filter cepat"] button').first.evaluate("e => getComputedStyle(e).transitionDuration")
            # keyboard: Tab to the first card's Simpan button and press Enter
            await pg.locator("ul.grid[aria-busy=false] article h3 a").first.focus()
            await pg.keyboard.press("Tab")
            nama_fokus = await pg.evaluate("document.activeElement?.getAttribute('aria-label') || ''")
            url = pg.url
            await pg.keyboard.press("Enter")
            await pg.wait_for_timeout(300)
            ditekan = await pg.evaluate("document.activeElement?.getAttribute('aria-pressed')")
            await c.close()
            ok = not luap and durasi in ("1e-05s", "0.01ms", "0s") and nama_fokus.startswith("Simpan ") and ditekan == "true" and url == pg.url
            catat(24, "HP, PC, zoom 200%, keyboard, reduced motion", ok, f"overflow: {luap or 'tidak ada'} (320/360/390/768/1440 px, teks 200% di 390 px, 640 px = 1280 px zoom 200%); transisi reduced motion {durasi}; Tab dari judul kartu ke '{nama_fokus[:30]}', Enter menyimpan tanpa pindah halaman")

        # 25 -----------------------------------------------------------------
        async def s25():
            c, pg = await baru(PC)
            await buka(pg, BASE + "/cari?area=binus-kemanggisan&fasilitas=kamar-mandi-dalam&urut=termurah")
            utama = await kartu_utama(pg).locator("h3 a").evaluate_all("as => as.map(a => a.getAttribute('href').split('/')[2].split('?')[0])")
            db = [r["slug"] for r in cari("binus-kemanggisan", fasilitas=["kamar-mandi-dalam"], urut="termurah", limit=20)]
            harga = [r["total_bulanan"] for r in cari("binus-kemanggisan", fasilitas=["kamar-mandi-dalam"], urut="termurah", limit=20) if r["total_lengkap"]]
            await buka(pg, BASE + "/cari?area=binus-kemanggisan&tipe=putri&urut=skor")
            skor_ui = await kartu_utama(pg).locator("h3 a").evaluate_all("as => as.map(a => a.getAttribute('href').split('/')[2].split('?')[0])")
            skor_db = [r["slug"] for r in cari("binus-kemanggisan", tipe=["putri"], urut="skor", limit=20)]
            ok = utama == db and harga == sorted(harga) and skor_ui == skor_db
            catat(25, "Termurah/Skor tertinggi setelah filter", ok, "urutan kartu = urutan cari_kos_v4; total lengkap naik; promosi di blok terpisah tidak menyisip")
            await c.close()

        # 26 -----------------------------------------------------------------
        async def s26():
            c, pg = await baru()
            await buka(pg, BASE + "/kos/kost-putri-aisyah")
            popup = []
            pg.context.on("page", lambda x: popup.append(x))
            await pg.locator("div.fixed.bottom-0").get_by_role("button", name=re.compile("^(Chat pemilik|Tanya)")).click()
            d = pg.get_by_role("dialog")
            await expect(d).to_contain_text("Di situs asli, tombol ini membuka WhatsApp")
            label = await pg.get_by_text("Data contoh").count()
            ok = not popup and "wa.me" not in pg.url and label >= 2
            catat(26, "Mode demo dan kontak", ok, f"tombol kontak menampilkan pesan, tidak membuka WhatsApp; {label} label 'Data contoh' di detail")
            await c.close()

        for no, nama, f in [
            (1, "Beranda → cari → detail", s1),
            (2, "Simpan dari kartu", s2_3),
            (4, "Banding", s4_5),
            (6, "Tipe multi", s6_9),
            (10, "Kamar mandi dalam", s10_12),
            (13, "Request bersaing", s13),
            (14, "History", s14_15),
            (16, "Hasil nol", s16),
            (17, "Bantuan", s17_19),
            (20, "Data tepi", s20),
            (21, "Panduan", s21),
            (22, "Sekitar", s22),
            (23, "Menu", s23),
            (24, "Responsif", s24),
            (25, "Urutan", s25),
            (26, "Demo", s26),
        ]:
            await jalankan(no, nama, f)

        # axe-core ------------------------------------------------------------
        pelanggaran = {}
        for label, opsi in (("390", HP), ("1440", PC)):
            c, pg = await baru(opsi)
            for u in ["/", "/cari?area=binus-kemanggisan&tipe=putra,campur", "/kos/kost-anggrek-cakra", "/banding?kos=kost-anggrek-cakra,kos-putri-melati", "/disimpan", "/cara-menggunakan", "/cara-kami-menilai"]:
                await buka(pg, BASE + u)
                await pg.wait_for_timeout(1200)  # entrance animations (hero chips fade in after 460 ms) have finished
                await pg.add_script_tag(content=AXE)
                r = await pg.evaluate("async () => (await axe.run(document, { runOnly: ['wcag2a','wcag2aa','wcag21a','wcag21aa','best-practice'] })).violations.map(v => v.id + ' (' + v.nodes.length + '): ' + v.nodes.map(n => n.target.join(' ') + ' ' + n.any.map(a => a.message).join('|')).join('; ').slice(0, 300))")
                pelanggaran[f"{label} {u}"] = r
            await buka(pg, BASE + "/cari?area=binus-kemanggisan")
            await pg.locator("button[aria-haspopup=dialog]", has_text="Filter").first.click()
            await pg.wait_for_timeout(500)
            await pg.add_script_tag(content=AXE)
            pelanggaran[f"{label} sheet Filter"] = await pg.evaluate("async () => (await axe.run(document.querySelector('[role=dialog]'), { runOnly: ['wcag2a','wcag2aa','wcag21a','wcag21aa'] })).violations.map(v => v.id + ' (' + v.nodes.length + ')')")
            if label == "390":
                await pg.keyboard.press("Escape")
                await pg.get_by_role("button", name="Menu").first.click()
                await pg.wait_for_timeout(500)
                pelanggaran[f"{label} sheet Menu"] = await pg.evaluate("async () => (await axe.run(document.querySelector('[role=dialog]'), { runOnly: ['wcag2a','wcag2aa','wcag21a','wcag21aa'] })).violations.map(v => v.id + ' (' + v.nodes.length + ')')")
            await c.close()
        jumlah_axe = sum(len(v) for v in pelanggaran.values())
        catat(99, "axe-core (WCAG 2.1 A/AA + best practice)", jumlah_axe == 0, json.dumps({k: v for k, v in pelanggaran.items() if v}, ensure_ascii=False) or "0 pelanggaran")

        # Evidence screenshots ------------------------------------------------
        c, pg = await baru()
        await buka(pg, BASE + "/cari?area=binus-kemanggisan")
        await kartu_utama(pg).first.scroll_into_view_if_needed()
        await pg.evaluate("window.scrollBy(0, -70)")
        await foto(pg, "01-kartu-label-hp.png")
        await buka(pg, BASE + "/kos/kost-anggrek-cakra")
        await foto(pg, "07-detail-layar-pertama-hp.png")
        await pg.locator("#ringkasan").scroll_into_view_if_needed()
        await pg.evaluate("window.scrollBy(0, -120)")
        await foto(pg, "07b-detail-ringkasan-hp.png")
        await pg.locator("#skor").scroll_into_view_if_needed()
        await pg.evaluate("window.scrollBy(0, -120)")
        await foto(pg, "08b-skor-dijelaskan-hp.png")
        await pg.locator("#fasilitas").scroll_into_view_if_needed()
        await pg.evaluate("window.scrollBy(0, -120)")
        await foto(pg, "11-fasilitas-hp.png")
        await buka(pg, BASE + "/cari?area=palmerah")
        await foto(pg, "16-panduan-cari-hp.png")
        await buka(pg, BASE + "/banding")
        await foto(pg, "18-banding-kosong-hp.png")
        await buka(pg, BASE + "/banding?kos=kost-anggrek-cakra")
        await foto(pg, "18b-banding-satu-hp.png")
        await c.close()
        c, pg = await baru(PC)
        await buka(pg, BASE + "/kos/kost-anggrek-cakra")
        await foto(pg, "22-detail-desktop.png")
        await buka(pg, BASE + "/cara-menggunakan")
        await foto(pg, "17-cara-menggunakan-desktop.png", full=True)
        await buka(pg, BASE + "/")
        await foto(pg, "14-nav-desktop.png")
        await c.close()
        await b.close()

    (OUT / "hasil-uji.json").write_text(json.dumps({"base": BASE, "waktu": time.strftime("%Y-%m-%d %H:%M"), "hasil": hasil}, ensure_ascii=False, indent=2))
    gagal = [h for h in hasil if not h["lulus"]]
    print(f"\n{len(hasil) - len(gagal)}/{len(hasil)} lulus")
    sys.exit(1 if gagal else 0)


asyncio.run(main())
