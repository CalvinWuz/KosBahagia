"""Browser checks for the second pass over UX v3 (docs/hasil-iterasi-v3.md §12):
the gaps the 11 October audit found inside the six v3 directives.

  npm run build && npm run start -- --port 3011      # in another terminal, local Supabase running
  python3 scripts/uji-ux-v3-ulang.py                 # pip install playwright; python3 -m playwright install chromium webkit
  MESIN=chromium python3 scripts/uji-ux-v3-ulang.py  # one engine

Numbers continue from the v3 suite (scripts/uji-ux-v3.py, 1–26). Counts and
totals are checked against the database through the same RPC the app calls.
Writes docs/tangkapan/v3-ulang/hasil-uji.json. Local data only.
"""

import asyncio
import json
import os
import re
import statistics
import time
import urllib.request
from urllib.parse import urlsplit
from pathlib import Path

from playwright.async_api import async_playwright, expect

AKAR = Path(__file__).resolve().parent.parent
BASE = os.environ.get("BASE", "http://localhost:3011")
REST = os.environ.get("REST", "http://127.0.0.1:54321/rest/v1")
OUT = Path(os.environ["OUT_DIR"]) if os.environ.get("OUT_DIR") else AKAR / "docs" / "tangkapan" / "v3-ulang"
OUT.mkdir(parents=True, exist_ok=True)
ANON = next(l.split("=", 1)[1].strip() for l in (AKAR / ".env.local").read_text().splitlines() if l.startswith("NEXT_PUBLIC_SUPABASE_ANON_KEY="))

HP = dict(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
PC = dict(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
PUSAT = {"binus-kemanggisan": (-6.2019, 106.7818, 2000), "palmerah": (-6.1985, 106.7905, 3000)}
GRIYA = "griya-kemanggisan"
KAMAR_AC = "fa7dec71-28ed-4596-acd7-807895f3590e"  # AC + kamar mandi dalam, Rp2.430.000; the default room is Standar, Rp2.000.000

hasil: list[dict] = []


def catat(no, nama, lulus, catatan="", mesin="chromium"):
    hasil.append({"no": no, "skenario": nama, "mesin": mesin, "lulus": bool(lulus), "catatan": catatan})
    print(f"{'LULUS' if lulus else 'GAGAL'} {no:>2} [{mesin}] {nama}: {catatan}", flush=True)


def rest(path, body=None):
    req = urllib.request.Request(
        f"{REST}/{path}",
        data=json.dumps(body).encode() if body is not None else None,
        headers={"apikey": ANON, "Authorization": f"Bearer {ANON}", "Content-Type": "application/json"},
        method="POST" if body is not None else "GET",
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


def cari(area, limit=500, **f):
    lat, lng, radius = PUSAT[area]
    args = {"p_lat": lat, "p_lng": lng, "p_radius_m": radius, "p_limit": limit, "p_aturan": {}}
    args.update({f"p_{k}": v for k, v in f.items()})
    return rest("rpc/cari_kos_v4", args)


def rupiah(n: int) -> str:
    return "Rp" + f"{n:,}".replace(",", ".")


async def buka(pg, url):
    await pg.goto(url, wait_until="load", timeout=60000)
    try:
        await pg.wait_for_load_state("networkidle", timeout=6000)
        # The opening screen plays on every full load; checks start after it.
        await pg.wait_for_function("() => !document.documentElement.dataset.intro", timeout=5000)
    except Exception:  # noqa: BLE001
        pass


async def ke_tengah(loc):
    """Scroll without the site's smooth scrolling (Playwright's own scroll loops on it in WebKit)."""
    await loc.evaluate("e => e.scrollIntoView({ block: 'center', behavior: 'instant' })")
    await loc.page.wait_for_timeout(150)


async def klik(loc):
    await ke_tengah(loc)
    await loc.click()


def kartu_utama(pg):
    return pg.locator("ul.grid[aria-busy=false] > li > article")


KOTAK = """(sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height }; }"""


async def suite(p, jenis):
    b = await getattr(p, jenis).launch()

    async def baru(opsi=HP, **extra):
        c = await b.new_context(**opsi, **extra)
        pg = await c.new_page()
        return c, pg

    async def jalankan(no, nama, f):
        try:
            await f()
        except Exception as e:  # noqa: BLE001
            catat(no, nama, False, f"{type(e).__name__}: {str(e)[:300]}", jenis)

    # 27: a shared saved list keeps the room type --------------------------------
    async def s27():
        c, pg = await baru()
        await buka(pg, f"{BASE}/kos/{GRIYA}?kamar={KAMAR_AC}")
        await klik(pg.get_by_role("button", name=re.compile("^Simpan Griya")).first)
        await buka(pg, BASE + "/disimpan")
        await pg.evaluate("navigator.share = undefined; window.__salin = null; navigator.clipboard.writeText = async (t) => { window.__salin = t; }")
        await klik(pg.get_by_role("button", name="Bagikan daftar"))
        await pg.wait_for_timeout(300)
        tautan = await pg.evaluate("window.__salin")
        pengirim = await pg.locator("main").inner_text()
        await c.close()
        c, pg = await baru()
        await buka(pg, tautan)
        await expect(pg.locator("main article").first).to_be_visible(timeout=15000)
        penerima = await pg.locator("main").inner_text()
        await klik(pg.get_by_role("button", name=re.compile("^Simpan 1 kos")))
        await pg.wait_for_url(re.compile(r"/disimpan$"))
        disk = json.loads(await pg.evaluate("localStorage.getItem('kb:simpan')"))
        await buka(pg, f"{BASE}/disimpan?kos={GRIYA}")
        await expect(pg.locator("main article").first).to_be_visible(timeout=15000)
        lama = await pg.locator("main").inner_text()
        await buka(pg, f"{BASE}/disimpan?kos={GRIYA}:00000000-0000-4000-8000-000000000000")
        await expect(pg.locator("main article").first).to_be_visible(timeout=15000)
        hilang = await pg.locator("main").inner_text()
        await c.close()
        ok = (
            f"{GRIYA}:{KAMAR_AC}" in tautan and "2.430.000" in pengirim
            and "2.430.000" in penerima and "AC + kamar mandi dalam" in penerima and "2.000.000" not in penerima
            and disk[0]["kamarId"] == KAMAR_AC
            and "2.000.000" in lama
            and "Tipe kamar yang dibagikan sudah tidak ada" in hilang
        )
        catat(27, "Bagikan daftar simpanan dengan tipe kamar", ok, f"tautan {tautan.split('?')[1]}; pengirim dan penerima sama-sama Rp2.430.000 kamar AC; 'Simpan 1 kos' menyimpan kamarId AC; tautan lama tanpa kamar tetap terbuka (Rp2.000.000, kamar default); kamar yang sudah dihapus diberi keterangan", jenis)

    # 28: a failed fetch is not "no longer listed" ---------------------------------
    async def s28():
        c, pg = await baru()
        await buka(pg, f"{BASE}/kos/{GRIYA}?kamar={KAMAR_AC}")
        await klik(pg.get_by_role("button", name=re.compile("^Simpan Griya")).first)
        rusak = re.compile(r"/rest/v1/(kos_kartu|tipe_kamar)")
        await pg.route(rusak, lambda r: r.fulfill(status=503, body="{}"))
        await buka(pg, BASE + "/disimpan")
        alert = pg.get_by_role("alert").filter(has_text="belum bisa dimuat")
        await expect(alert).to_be_visible(timeout=15000)
        teks = await pg.locator("main").inner_text()
        tautan_detail = await pg.get_by_role("link", name="Griya Kemanggisan").count()
        await pg.screenshot(path=str(OUT / f"28-simpanan-gagal-hp-{jenis}.png"))
        await pg.unroute(rusak)
        await klik(pg.get_by_role("button", name="Coba lagi"))
        await expect(kartu_utama(pg).first).to_be_visible(timeout=15000)
        pulih = await pg.locator("main").inner_text()
        await pg.route(rusak, lambda r: r.fulfill(status=503, body="{}"))
        await buka(pg, f"{BASE}/disimpan?kos={GRIYA}:{KAMAR_AC}")
        await expect(pg.get_by_role("alert").filter(has_text="belum bisa dimuat")).to_be_visible(timeout=15000)
        dari_tautan = await pg.locator("main").inner_text()
        await c.close()
        ok = "tidak tayang" not in teks and "Hapus dari simpanan" not in teks and tautan_detail == 1 and "2.430.000" in pulih and "tidak tayang" not in dari_tautan
        catat(28, "Simpanan saat jaringan gagal (503)", ok, "panel 'belum bisa dimuat' + Coba lagi; tidak ada 'tidak tayang' atau ajakan hapus; nama kos tetap bisa dibuka; Coba lagi memulihkan kartu kamar AC; tautan bagikan yang gagal dimuat juga tidak menyebut 'tidak tayang'", jenis)

    # 29: a browser that refuses storage --------------------------------------------
    async def s29():
        c, pg = await baru()
        await c.add_init_script("Storage.prototype.setItem = function () { throw new DOMException('penuh', 'QuotaExceededError'); };")
        await buka(pg, BASE + "/cari?area=binus-kemanggisan")
        k = kartu_utama(pg).first
        nama = (await k.locator("h3").inner_text()).strip()
        await klik(k.get_by_role("button", name=f"Simpan {nama}"))
        tombol = (await k.get_by_role("button", name=re.compile(f"^Tersimpan: {re.escape(nama)}")).inner_text()).strip()
        toast = await pg.locator("div.fixed[aria-live=polite]").inner_text()
        await pg.get_by_role("button", name="Menu").first.click()
        await pg.get_by_role("dialog", name="Menu").get_by_role("link", name=re.compile("^Simpanan")).click()
        await pg.wait_for_url(re.compile("/disimpan"))
        await expect(pg.locator("article h3", has_text=nama)).to_be_visible(timeout=15000)
        catatan = await pg.locator("main").inner_text()
        await c.close()
        ok = tombol == "Tersimpan" and "sementara" in toast and "tersimpan di perangkat ini" not in toast and "sementara di tab ini" in catatan
        catat(29, "Browser menolak penyimpanan", ok, f"tombol '{tombol}', toast '{toast.splitlines()[0][:70]}…'; /disimpan (navigasi di tab yang sama) menampilkan kos dan menyebut 'sementara di tab ini'", jenis)

    # 30: one toast; toast, tray and chat bar never cover each other ---------------
    async def s30():
        c, pg = await baru()
        await buka(pg, BASE + "/cari?area=binus-kemanggisan")
        k = kartu_utama(pg).first
        nama = (await k.locator("h3").inner_text()).strip()
        await klik(k.get_by_role("button", name=f"Simpan {nama}"))
        await k.get_by_role("button", name=re.compile(f"^Bandingkan {re.escape(nama)}")).click()
        await pg.wait_for_timeout(400)
        n_toast = await pg.locator("div.fixed[aria-live=polite] > div").count()
        await buka(pg, f"{BASE}/kos/{GRIYA}?kamar={KAMAR_AC}")
        await klik(pg.get_by_role("button", name=re.compile("^Simpan Griya")).first)
        await pg.get_by_role("button", name=re.compile("^Bandingkan Griya")).first.click()
        await pg.wait_for_timeout(500)
        await pg.evaluate("window.scrollTo(0, 1600)")
        await pg.wait_for_timeout(300)
        bar = await pg.evaluate(KOTAK, "div.fixed.bottom-0.z-40")
        tray = await pg.evaluate(KOTAK, "[role=region][aria-label=Perbandingan] > div")
        toast = await pg.evaluate(KOTAK, "div.fixed[aria-live=polite] > div")
        tutup = await pg.locator("div.fixed[aria-live=polite] button[aria-label=Tutup]").evaluate("e => [getComputedStyle(e, '::after').width, getComputedStyle(e, '::after').height]")
        await pg.screenshot(path=str(OUT / f"30-lapisan-bawah-detail-hp-{jenis}.png"))
        await pg.get_by_role("button", name="Sembunyikan panel perbandingan").click()
        tray_hilang = await pg.locator("[role=region][aria-label=Perbandingan]").count() == 0
        await c.close()
        c, pg = await baru(PC)
        await pg.add_init_script(f"localStorage.setItem('kb:banding', JSON.stringify([{{ id: 'x', slug: '{GRIYA}', nama: 'Griya Kemanggisan', kamarId: '{KAMAR_AC}', kamarNama: 'AC + kamar mandi dalam' }}]))")
        await buka(pg, f"{BASE}/kos/{GRIYA}")
        tray_pc = await pg.evaluate(KOTAK, "[role=region][aria-label=Perbandingan] > div")
        await c.close()
        tidak_tumpang = toast["bottom"] <= tray["top"] + 0.5 and tray["bottom"] <= bar["top"] + 0.5
        ok = n_toast == 1 and tidak_tumpang and tutup == ["44px", "44px"] and tray_hilang and tray_pc and tray_pc["bottom"] <= 900 - 8
        catat(30, "Satu toast; toast, tray, bar chat tidak saling menutupi", ok, f"dua aksi cepat → {n_toast} toast; detail HP: toast {toast['top']:.0f}–{toast['bottom']:.0f}, tray {tray['top']:.0f}–{tray['bottom']:.0f}, bar chat dari {bar['top']:.0f} px; area tombol tutup toast {tutup[0]}; tray tetap bisa ditutup; PC tray {900 - tray_pc['bottom']:.0f} px dari bawah", jenis)

    # 31: results first on a phone; promotion is one compact row --------------------
    async def s31():
        ukur = """() => { const promo = document.querySelector('#promosi-judul')?.closest('section'); const kartu = document.querySelector('ul.grid[aria-busy=false] > li > article');
          const isi = promo?.querySelector('ul'); const satu = promo?.querySelector('ul > li article');
          return { promo: promo ? Math.round(promo.getBoundingClientRect().height) : null, organik: kartu ? Math.round(kartu.getBoundingClientRect().top + scrollY) : null,
                   lebarPromo: satu && isi ? Math.round(satu.getBoundingClientRect().width / isi.getBoundingClientRect().width * 100) : null } }"""
        c, pg = await baru()
        await buka(pg, BASE + "/cari?area=binus-kemanggisan")
        await expect(kartu_utama(pg).first).to_be_visible(timeout=15000)
        hp = await pg.evaluate(ukur)
        await pg.screenshot(path=str(OUT / f"31-cari-layar-awal-hp-{jenis}.png"))
        await buka(pg, BASE + "/cari?area=binus-kemanggisan&fasilitas=kamar-mandi-dalam")
        await expect(kartu_utama(pg).first).to_be_visible(timeout=15000)
        satu_filter = await pg.get_by_role("region", name="Filter aktif").get_by_role("button", name="Hapus semua").count()
        await buka(pg, BASE + "/cari?area=binus-kemanggisan&fasilitas=kamar-mandi-dalam&harga_max=1500000")
        await expect(pg.get_by_role("region", name="Filter aktif")).to_be_visible(timeout=15000)
        dua_filter = await pg.get_by_role("region", name="Filter aktif").get_by_role("button", name="Hapus semua").count()
        await c.close()
        c, pg = await baru(PC)
        await buka(pg, BASE + "/cari?area=binus-kemanggisan")
        await expect(kartu_utama(pg).first).to_be_visible(timeout=15000)
        pc = await pg.evaluate(ukur)
        await pg.screenshot(path=str(OUT / f"31-cari-pc-{jenis}.png"))
        await c.close()
        ok = hp["organik"] < 844 and hp["promo"] < 420 and pc["organik"] < 900 and pc["lebarPromo"] >= 95 and satu_filter == 0 and dua_filter == 1
        catat(31, "Hasil utama di layar awal, promosi ringkas", ok, f"HP: promosi {hp['promo']} px, hasil biasa pertama mulai {hp['organik']} px (layar 844); PC: promosi {pc['promo']} px, satu kartu promosi {pc['lebarPromo']}% lebar blok, hasil biasa mulai {pc['organik']} px (layar 900); 'Hapus semua' {satu_filter} saat satu filter, {dua_filter} saat dua", jenis)

    # 32: the phone map fits the screen and ends above the tray ---------------------
    async def s32():
        peta = """() => { const c = document.querySelector('.maplibregl-canvas'); const a = document.querySelector('.maplibregl-ctrl-attrib'); const t = document.querySelector('[role=region][aria-label=Perbandingan] > div');
          return { peta: c ? Math.round(c.getBoundingClientRect().bottom) : null, atribusi: a ? Math.round(a.getBoundingClientRect().bottom) : null, tray: t ? Math.round(t.getBoundingClientRect().top) : null, vh: innerHeight } }"""
        c, pg = await baru()
        await buka(pg, BASE + "/cari?area=binus-kemanggisan&tampil=peta")
        await pg.wait_for_selector(".maplibregl-canvas", timeout=20000)
        await pg.wait_for_timeout(1500)
        tanpa = await pg.evaluate(peta)
        await c.close()
        c, pg = await baru()
        await pg.add_init_script(f"localStorage.setItem('kb:banding', JSON.stringify([{{ id: 'x', slug: '{GRIYA}', nama: 'Griya Kemanggisan', kamarId: null, kamarNama: null }}]))")
        await buka(pg, BASE + "/cari?area=binus-kemanggisan&tampil=peta")
        await pg.wait_for_selector(".maplibregl-canvas", timeout=20000)
        await pg.wait_for_timeout(1500)
        dengan = await pg.evaluate(peta)
        await pg.screenshot(path=str(OUT / f"32-peta-hp-dengan-tray-{jenis}.png"))
        await c.close()
        ok = tanpa["peta"] <= tanpa["vh"] and tanpa["atribusi"] <= tanpa["vh"] and dengan["peta"] <= dengan["tray"] + 1
        catat(32, "Peta HP muat di layar dan berakhir di atas tray", ok, f"tanpa tray: peta sampai {tanpa['peta']} px, atribusi {tanpa['atribusi']} px (layar {tanpa['vh']}); dengan tray: peta sampai {dengan['peta']} px, tray mulai {dengan['tray']} px", jenis)

    # 33: compact cards keep the safety count (mocked promotion row) ----------------
    async def s33():
        c, pg = await baru()

        async def tambah_catatan(route):
            r = await route.fetch()
            data = await r.json()
            if data:
                data[0]["jumlah_red_flags"] = 2
            await route.fulfill(response=r, json=data)

        await pg.route(re.compile(r"/rpc/kos_promosi_v2"), tambah_catatan)
        # The first page is rendered on the server; a filter change fetches promotions in the browser.
        await buka(pg, BASE + "/cari?area=binus-kemanggisan&kebersihan=4")
        await pg.locator('ul[aria-label="Filter cepat"]').get_by_role("button", name="Semua").click()
        promo = pg.locator("#promosi-judul").locator("xpath=ancestor::section")
        await expect(promo).to_be_visible(timeout=15000)
        teks = await promo.inner_text()
        await c.close()
        ok = "2 catatan keselamatan" in teks
        catat(33, "Kartu ringkas tetap menampilkan catatan keselamatan", ok, "respons promosi dimodifikasi (mock transport) menjadi 2 catatan keselamatan; kartu ringkas promosi menampilkannya (komponen yang sama dipakai kartu mini peta)", jenis)

    # 34: area facts use the search's definitions ------------------------------------
    async def s34():
        baris = cari("palmerah")
        kamar = [r["kamar"] for r in baris if r.get("kamar")]
        lengkap = sorted(k["total_bulanan"] for k in kamar if k.get("total_lengkap"))
        median = statistics.median(lengkap)
        median = int(round(median)) if isinstance(median, float) else median
        belum = sum(1 for k in kamar if not k.get("total_lengkap"))
        km = cari("palmerah", limit=1, fasilitas=["kamar-mandi-dalam"])
        n_km = int(km[0]["total_count"]) if km else 0
        c, pg = await baru()
        await buka(pg, BASE + "/area/palmerah")
        fakta = await pg.locator("#fakta-area").locator("xpath=..").inner_text()
        faq = await pg.locator("#faq-area").locator("xpath=..").inner_text()
        await pg.get_by_role("link", name=re.compile(r"^Lihat \d+ kos$")).first.click()
        await pg.wait_for_url(re.compile(r"/cari\?.*kamar-mandi-dalam"))
        loc = pg.locator("p[aria-live=polite]").first
        await expect(loc).to_have_text(re.compile(r"^\d+ kos$"), timeout=15000)
        n_cari = int((await loc.inner_text()).split()[0])
        await c.close()
        ok = (
            rupiah(median) in fakta and f"{n_km} dari {len(baris)} kos" in fakta and n_cari == n_km
            and (belum == 0 or f"{belum} kos biayanya belum lengkap" in fakta)
            and "sudah termasuk listrik" not in fakta + faq and "3–5 kamar" not in faq
        )
        catat(34, "Angka area memakai definisi pencarian", ok, f"median {rupiah(median)} dari {len(lengkap)} total lengkap/estimasi (DB), {belum} belum lengkap tidak dihitung; kamar mandi dalam {n_km} dari {len(baris)} = jumlah /cari dengan filter itu ({n_cari}); tidak ada klaim 'sudah termasuk listrik' atau '3–5 kamar'", jenis)

    # 35: the noise score says which room it was measured in ----------------------
    async def s35():
        c, pg = await baru()
        await buka(pg, f"{BASE}/kos/{GRIYA}?kamar={KAMAR_AC}")
        kartu_ac = await pg.locator("#kebersihan section[aria-label='Kedap suara']").inner_text()
        ringkas_ac = await pg.locator("#ringkasan").inner_text()
        await buka(pg, f"{BASE}/kos/{GRIYA}")
        kartu_std = await pg.locator("#kebersihan section[aria-label='Kedap suara']").inner_text()
        ringkas_std = await pg.locator("#ringkasan").inner_text()
        await c.close()
        ok = "bukan di kamar AC + kamar mandi dalam" in kartu_ac and "di tipe kamar lain" in ringkas_ac and "Diukur di" not in kartu_std and "tipe kamar lain" not in ringkas_std
        catat(35, "Skor kedap suara menyebut kamar yang diukur", ok, "kamar AC: 'Diukur di Tipe Standar (kipas), lantai 2, bukan di kamar AC…' dan ringkasan 'saat tes suara di tipe kamar lain'; kamar Standar: tanpa catatan", jenis)

    # 36: title and share preview say what the price is ---------------------------
    async def s36():
        c, pg = await baru(PC)
        await buka(pg, f"{BASE}/kos/{GRIYA}?kamar={KAMAR_AC}")
        judul_multi = await pg.title()
        await buka(pg, f"{BASE}/kos/dkost-syahdan")
        judul_satu = await pg.title()
        # Next.js adds a generated suffix to the image route; take it from the page's own meta tag.
        await buka(pg, f"{BASE}/kos/{GRIYA}")
        og_url = await pg.locator('meta[property="og:image"]').get_attribute("content")
        bagian = urlsplit(og_url)
        og = await pg.request.get(BASE + bagian.path + (f"?{bagian.query}" if bagian.query else ""))
        (OUT / f"36-og-{GRIYA}.png").write_bytes(await og.body())
        og_ok = og.ok and og.headers["content-type"] == "image/png"
        await c.close()
        ok = "dari Rp2.000.000/bulan" in judul_multi and "dari" not in judul_satu.split("—")[1] and og_ok
        catat(36, "Judul dan pratinjau berbagi", ok, f"kos dua tipe: '{judul_multi}'; kos satu tipe: '{judul_satu}'; gambar OG dirender ({og.status}), isinya diperiksa manual: label dari lib/biaya.ts + kamar + 'Data contoh'", jenis)

    # 37: the selected room's price from the first frame of a client navigation --
    async def s37():
        jejak = """() => { window.__j = []; const t0 = performance.now(); const tick = () => { const bar = document.querySelector('div.fixed.bottom-0.z-40');
          if (bar) window.__j.push(bar.innerText.split('\\n')[0]); if (performance.now() - t0 < 2000) requestAnimationFrame(tick); }; tick(); }"""
        c, pg = await baru(reduced_motion="reduce")
        await buka(pg, BASE + "/cari?area=binus-kemanggisan&fasilitas=kamar-mandi-dalam")
        k = pg.locator("article", has=pg.locator("h3", has_text="Kost Anggrek Cakra")).first
        await ke_tengah(k)
        await pg.evaluate(jejak)
        await k.locator("h3 a").click()
        await pg.wait_for_timeout(2100)
        harga_ac = await pg.evaluate("window.__j")
        # Back, then a card without ?kamar=: the earlier link target must not linger.
        await pg.go_back()
        await pg.wait_for_url(re.compile(r"/cari"))
        await buka(pg, BASE + "/cari?area=binus-kemanggisan")
        k2 = kartu_utama(pg).filter(has_text="Kost Anggrek Cakra").first
        await ke_tengah(k2)
        href = await k2.locator("h3 a").get_attribute("href")
        await pg.evaluate(jejak)
        await k2.locator("h3 a").click()
        await pg.wait_for_timeout(2100)
        harga_lain = await pg.evaluate("window.__j")
        await c.close()
        beda = sorted(set(harga_ac))
        ok = beda == ["Rp2.195.000/bln"] and len(set(harga_lain)) == 1
        catat(37, "Harga kamar pilihan sejak frame pertama navigasi", ok, f"reduced motion (tanpa fade yang menutupi): bar chat per frame {beda} untuk kamar AC; navigasi berikutnya ke {href.split('/')[-1][:40]} stabil {sorted(set(harga_lain))}", jenis)

    daftar = [(27, "Bagikan", s27), (28, "Gagal muat", s28), (29, "Storage", s29), (30, "Lapisan bawah", s30), (31, "Kepadatan", s31), (32, "Peta HP", s32), (33, "Kartu ringkas", s33), (34, "Area", s34), (35, "Kamar diukur", s35), (36, "Judul/OG", s36), (37, "Harga saat navigasi", s37)]
    hanya = [x for x in os.environ.get("HANYA", "").split(",") if x]
    for no, nama, f in daftar:
        if not hanya or str(no) in hanya:
            await jalankan(no, nama, f)
    await b.close()


async def main():
    async with async_playwright() as p:
        for jenis in [j for j in os.environ.get("MESIN", "chromium,webkit").split(",") if j]:
            await suite(p, jenis)
    (OUT / "hasil-uji.json").write_text(json.dumps({"base": BASE, "waktu": time.strftime("%Y-%m-%d %H:%M"), "hasil": hasil}, ensure_ascii=False, indent=2))
    gagal = [h for h in hasil if not h["lulus"]]
    print(f"\n{len(hasil) - len(gagal)}/{len(hasil)} lulus")


asyncio.run(main())
