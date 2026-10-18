"""Browser checks for the section tutorials (docs/hasil-tutorial-singkat-per-bagian.md).

  npm run build && npm run start -- --port 3011      # in another terminal, local Supabase running
  python3 scripts/uji-tutorial.py                    # pip install playwright; python3 -m playwright install chromium webkit
  MESIN=chromium HANYA=1,2 python3 scripts/uji-tutorial.py

Numbers follow the checklist in docs/prompt-tutorial-singkat-per-bagian.md §10.
The owner surface signs in with the local test numbers from supabase/config.toml
([auth.sms.test_otp]); they never reach an SMS or WhatsApp provider. Nothing is
submitted on the owner pages. Writes docs/tangkapan/tutorial/hasil-uji.json and
screenshots there.
"""

import asyncio
import json
import os
import re
import time
from pathlib import Path

from playwright.async_api import async_playwright, expect

AKAR = Path(__file__).resolve().parent.parent
BASE = os.environ.get("BASE", "http://localhost:3011")
OUT = Path(os.environ["OUT_DIR"]) if os.environ.get("OUT_DIR") else AKAR / "docs" / "tangkapan" / "tutorial"
OUT.mkdir(parents=True, exist_ok=True)

HP = dict(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
PC = dict(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
KUNCI = "kb:tutorial-bagian:v1"
GRIYA_AC = "/kos/griya-kemanggisan?kamar=fa7dec71-28ed-4596-acd7-807895f3590e"
NOMOR_DENGAN_KOS = "6281111111111"  # seed: owns Kost Anggrek Cakra and Kos Putri Melati
NOMOR_TANPA_KOS = "6282222222222"

hasil: list[dict] = []


def catat(no, nama, lulus, catatan="", mesin="chromium"):
    hasil.append({"no": no, "skenario": nama, "mesin": mesin, "lulus": bool(lulus), "catatan": catatan})
    print(f"{'LULUS' if lulus else 'GAGAL'} {no:>2} [{mesin}] {nama}: {catatan}", flush=True)


STATUS = f"() => JSON.parse(localStorage.getItem('{KUNCI}') || '{{}}')"
TAMPAK = "(sel) => [...document.querySelectorAll(sel)].some((e) => e.getClientRects().length > 0 && getComputedStyle(e).display !== 'none')"


def panel(pg):
    return pg.locator("[data-panel-tutorial]")


async def buka(pg, url, tunggu=1200):
    await pg.goto(url, wait_until="load", timeout=60000)
    await pg.wait_for_timeout(tunggu)
    # The opening screen plays on every full load; checks start after it (owner pages have none).
    try:
        await pg.wait_for_function("() => !document.documentElement.dataset.intro", timeout=5000)
    except Exception:  # noqa: BLE001
        pass


async def tunggu_diam(pg):
    """Until a smooth scroll has finished (scrollY unchanged over 3 checks)."""
    await pg.evaluate("""() => new Promise((res) => { let y = scrollY, sama = 0; const id = setInterval(() => { if (scrollY === y) sama++; else { sama = 0; y = scrollY; } if (sama >= 3) { clearInterval(id); res(); } }, 100); })""")


async def ke_tengah(loc):
    await loc.evaluate("e => e.scrollIntoView({ block: 'center', behavior: 'instant' })")
    await loc.page.wait_for_timeout(150)


async def klik(loc):
    await ke_tengah(loc)
    await loc.click()


async def tampak(pg, sel) -> bool:
    return await pg.evaluate(TAMPAK, sel)


async def masuk_mitra(pg, nomor):
    await buka(pg, f"{BASE}/mitra/masuk?next=/mitra/dashboard", 600)
    await pg.locator("input[type=tel]").fill(nomor)
    await pg.locator("form button[type=submit]").click()
    kode = pg.locator("input[autocomplete=one-time-code]")
    await expect(kode).to_be_visible(timeout=15000)
    await kode.fill("123456")
    await pg.locator("form button[type=submit]").click()
    await pg.wait_for_url(re.compile(r"/mitra/dashboard"), timeout=20000)
    await pg.wait_for_timeout(1200)


async def suite(p, jenis):
    b = await getattr(p, jenis).launch()

    async def baru(opsi=HP, isi=None, **extra):
        """A fresh browser; `isi` seeds localStorage once (not on every navigation)."""
        c = await b.new_context(**opsi, **extra)
        if isi:
            await c.add_init_script(
                "if (!sessionStorage.getItem('__isi')) { sessionStorage.setItem('__isi', '1'); "
                + " ".join(f"localStorage.setItem({json.dumps(k)}, {json.dumps(v)});" for k, v in isi.items())
                + " }"
            )
        pg = await c.new_page()
        pg.galat = []
        pg.on("pageerror", lambda e: pg.galat.append(str(e)[:200]))
        pg.on("console", lambda m: pg.galat.append(m.text[:200]) if m.type == "error" and "favicon" not in m.text else None)
        return c, pg

    async def jalankan(no, nama, f):
        try:
            await f()
        except Exception as e:  # noqa: BLE001
            catat(no, nama, False, f"{type(e).__name__}: {str(e)[:300]}", jenis)

    # 1: a new user sees one small offer; nothing opens, moves focus or scrolls --
    async def s1():
        catatan = []
        ok = True
        for label, opsi, url, k in (("HP /cari", HP, "/cari?area=binus-kemanggisan", "pencarian"), ("PC /kos", PC, "/kos/kost-anggrek-cakra", "detail"), ("HP beranda", HP, "/", "beranda")):
            c, pg = await baru(opsi)
            await buka(pg, BASE + url, 1800)
            if label == "HP /cari":
                await pg.screenshot(path=str(OUT / f"01-tawaran-cari-hp-{jenis}.png"))
            keadaan = await pg.evaluate(
                f"""() => ({{ tawaran: [...document.querySelectorAll('[data-tawaran]')].filter((e) => e.getClientRects().length).map((e) => e.dataset.tawaran),
                    panel: document.querySelectorAll('[data-panel-tutorial]').length > 0,
                    dialog: document.querySelectorAll('[role=dialog]').length, fokus: document.activeElement === document.body, y: Math.round(scrollY), status: ({STATUS})() }})"""
            )
            await c.close()
            # The homepage line only counts once it has been on screen; above the fold it is.
            baik = keadaan["tawaran"] == [k] and not keadaan["panel"] and keadaan["dialog"] == 0 and keadaan["fokus"] and keadaan["y"] == 0
            ok = ok and baik
            catatan.append(f"{label}: tawaran {keadaan['tawaran']}, panel {bool(keadaan['panel'])}, dialog {keadaan['dialog']}, fokus di body {keadaan['fokus']}, scroll {keadaan['y']}, status {keadaan['status']}")
        catat(1, "Pengguna baru: satu tawaran kecil, tanpa tur/fokus/scroll otomatis", ok, "; ".join(catatan), jenis)

    # 2 + 4: 1–2 short steps; close/skip vs finish; the manual button keeps working --
    async def s2_4():
        c, pg = await baru()
        await buka(pg, BASE + "/cari?area=binus-kemanggisan")
        await klik(pg.locator('[data-tawaran="pencarian"]').get_by_role("button", name="Lihat panduan singkat"))
        p1 = await panel(pg).inner_text()
        kata1 = len((await panel(pg).locator("p.text-small").inner_text()).split())
        await pg.screenshot(path=str(OUT / f"02-cari-langkah-1-hp-{jenis}.png"))
        sorot1 = await pg.evaluate("document.querySelector('[data-tutorial-sorot]')?.dataset.tutorial ?? null")
        await panel(pg).get_by_role("button", name="Berikutnya").click()
        await pg.wait_for_timeout(700)
        p2 = await panel(pg).inner_text()
        kata2 = len((await panel(pg).locator("p.text-small").inner_text()).split())
        sorot2 = await pg.evaluate("document.querySelector('[data-tutorial-sorot]')?.dataset.tutorial ?? null")
        await pg.screenshot(path=str(OUT / f"03-cari-langkah-2-hp-{jenis}.png"))
        await panel(pg).get_by_role("button", name="Selesai").click()
        await pg.wait_for_timeout(300)
        st = await pg.evaluate(STATUS)
        sisa_panel = await panel(pg).count()
        # The detail tutorial does not follow on its own.
        await buka(pg, BASE + "/kos/kost-anggrek-cakra")
        panel_detail = await panel(pg).count()
        await klik(pg.locator('[data-tawaran="detail"]').get_by_role("button", name="Lihat panduan singkat"))
        d1 = await panel(pg).inner_text()
        await panel(pg).get_by_role("button", name="Lewati").click()
        await pg.wait_for_timeout(300)
        st2 = await pg.evaluate(STATUS)
        tombol = pg.locator('[data-pemicu-ringkas="detail"]')
        terlihat_tombol = await tombol.is_visible()
        await klik(tombol)
        manual = await panel(pg).inner_text()
        await panel(pg).get_by_role("button", name="Berikutnya").click()
        await pg.wait_for_timeout(700)
        d2 = await panel(pg).inner_text()
        await pg.screenshot(path=str(OUT / f"04-detail-langkah-2-hp-{jenis}.png"))
        await panel(pg).get_by_role("button", name="Tutup petunjuk").click()
        st3 = await pg.evaluate(STATUS)
        await c.close()
        ok2 = "langkah 1 dari 2" in p1 and "langkah 2 dari 2" in p2 and "langkah 1 dari 2" in d1 and "langkah 2 dari 2" in d2 and sorot1 == "cari-kontrol" and sorot2 == "cari-kartu" and sisa_panel == 0 and panel_detail == 0 and kata1 <= 35 and kata2 <= 35
        catat(2, "1–2 langkah per kelompok, tidak berantai", ok2, f"Pencarian: 2 langkah (sorot {sorot1} lalu {sorot2}); Detail: 2 langkah; setelah Selesai tidak ada panel dan detail tidak membuka tutorial sendiri; isi langkah {kata1} dan {kata2} kata", jenis)
        ok4 = st.get("pencarian") == "selesai" and st2.get("detail") == "ditutup" and terlihat_tombol and "langkah 1 dari 2" in manual and st3.get("detail") == "ditutup"
        catat(4, "Tutup/Lewati vs Selesai; pemicu manual tetap jalan", ok4, f"Selesai → {st.get('pencarian')}; Lewati → {st2.get('detail')}; 'Petunjuk bagian ini' membuka lagi dari langkah 1, ditutup lagi → {st3.get('detail')}", jenis)

    # 3: once offered, never again on refresh, back/forward, filters, other kos --
    async def s3():
        c, pg = await baru()
        await buka(pg, BASE + "/cari?area=binus-kemanggisan", 1800)
        awal = await tampak(pg, '[data-tawaran="pencarian"]')
        st = await pg.evaluate(STATUS)
        await pg.locator('ul[aria-label="Filter cepat"]').get_by_role("button", name="Bersih").click()
        await pg.wait_for_timeout(1000)
        setelah_filter = await tampak(pg, '[data-tawaran="pencarian"]')
        await pg.reload(wait_until="load")
        await pg.wait_for_timeout(1500)
        setelah_reload = await tampak(pg, '[data-tawaran="pencarian"]')
        tombol = await tampak(pg, '[data-pemicu-ringkas="pencarian"]')
        await buka(pg, BASE + "/kos/kost-anggrek-cakra", 1800)
        detail_a = await tampak(pg, '[data-tawaran="detail"]')
        await buka(pg, BASE + "/kos/kos-putri-melati", 1500)
        detail_b = await tampak(pg, '[data-tawaran="detail"]')
        await pg.go_back(wait_until="load")
        await pg.wait_for_timeout(1000)
        kembali = await tampak(pg, '[data-tawaran="detail"]')
        await pg.go_forward(wait_until="load")
        await pg.wait_for_timeout(1000)
        maju = await tampak(pg, '[data-tawaran="detail"]')
        await c.close()
        # Client navigation between two kos (same tab, no reload).
        c, pg = await baru()
        await buka(pg, BASE + "/cari?area=binus-kemanggisan", 1500)
        await klik(pg.locator("ul.grid[aria-busy=false] article h3 a").first)
        await pg.wait_for_url(re.compile("/kos/"))
        await pg.wait_for_timeout(1500)
        pertama = await tampak(pg, '[data-tawaran="detail"]')
        await pg.go_back()
        await pg.wait_for_url(re.compile("/cari"))
        await pg.wait_for_timeout(800)
        await klik(pg.locator("ul.grid[aria-busy=false] article h3 a").nth(1))
        await pg.wait_for_url(re.compile("/kos/"))
        await pg.wait_for_timeout(1200)
        kedua = await tampak(pg, '[data-tawaran="detail"]')
        await c.close()
        # Still on screen after a filter change in the same visit is the same offer, not a new one.
        ok = awal and st.get("pencarian") == "ditawarkan" and setelah_filter and not setelah_reload and tombol and detail_a and not detail_b and not kembali and not maju and pertama and not kedua
        catat(3, "Tawaran tidak berulang", ok, f"/cari: tawaran tampil lalu tercatat '{st.get('pencarian')}'; ganti filter (masih kunjungan yang sama) {setelah_filter}; reload {setelah_reload}, tombol tenang {tombol}; detail kos A {detail_a}, kos B {detail_b}, back {kembali}, forward {maju}; navigasi klien kos pertama {pertama}, kos kedua {kedua}", jenis)

    # 5: whoever closed the v1 guide gets no automatic offers; owners are separate --
    async def s5():
        c, pg = await baru(isi={"kb:panduan": "v1"})
        catatan = []
        ok = True
        for url, k in (("/", "beranda"), ("/cari?area=binus-kemanggisan", "pencarian"), ("/kos/kost-anggrek-cakra", "detail")):
            await buka(pg, BASE + url, 1500)
            t = await tampak(pg, f'[data-tawaran="{k}"]')
            m = await tampak(pg, f'[data-pemicu-ringkas="{k}"]') if k != "beranda" else None
            ok = ok and not t and (m is None or m)
            catatan.append(f"{url}: tawaran {t}, tombol {m}")
        lama = await pg.evaluate("[localStorage.getItem('kb:panduan'), document.querySelectorAll('[data-panduan-baru]').length]")
        await c.close()
        ok = ok and lama == ["v1", 0]
        catat(5, "Penanda kb:panduan lama dihormati", ok, "; ".join(catatan) + f"; kb:panduan tetap {lama[0]}, kartu panduan lama tidak ada lagi di halaman", jenis)

    # 6: saved kos, compare list, room, price, URL and scroll survive the tutorial --
    async def s6():
        simpan = json.dumps([{"id": "x", "slug": "kost-anggrek-cakra", "nama": "Kost Anggrek Cakra", "kamarId": None, "kamarNama": None, "total_bulanan": None, "kamar_tersedia": None, "disimpan_pada": ""}])
        banding = json.dumps([{"id": "y", "slug": "kos-putri-melati", "nama": "Kos Putri Melati", "kamarId": None, "kamarNama": None}])
        c, pg = await baru(isi={"kb:simpan": simpan, "kb:banding": banding})
        await buka(pg, BASE + GRIYA_AC, 1500)
        sebelum = await pg.evaluate("[location.href, localStorage.getItem('kb:simpan'), localStorage.getItem('kb:banding'), document.querySelector('div.fixed.bottom-0.z-40')?.innerText.split('\\n')[0], history.length]")
        await klik(pg.locator('[data-tawaran="detail"]').get_by_role("button", name="Lihat panduan singkat"))
        await panel(pg).get_by_role("button", name="Berikutnya").click()
        await tunggu_diam(pg)
        y_buka = await pg.evaluate("[scrollY, document.querySelector('[data-tutorial=detail-kondisi]').getBoundingClientRect().top]")
        # Count every scroll call our code could make while closing.
        await pg.evaluate("""() => { window.__gulir = 0; for (const [o, k] of [[window, 'scrollTo'], [window, 'scrollBy'], [Element.prototype, 'scrollIntoView'], [Element.prototype, 'scrollTo'], [Element.prototype, 'scrollBy']]) { const asli = o[k]; o[k] = function (...a) { window.__gulir++; return asli.apply(this, a); }; } }""")
        await panel(pg).get_by_role("button", name="Selesai").click()
        await tunggu_diam(pg)
        gulir = await pg.evaluate("window.__gulir")
        sesudah = await pg.evaluate("[location.href, localStorage.getItem('kb:simpan'), localStorage.getItem('kb:banding'), document.querySelector('div.fixed.bottom-0.z-40')?.innerText.split('\\n')[0], history.length]")
        y_tutup = await pg.evaluate("[scrollY, document.querySelector('[data-tutorial=detail-kondisi]').getBoundingClientRect().top]")
        await c.close()
        # Closing never scrolls by itself (no scroll call). What moves is layout: the
        # panel leaves and the quiet button appears above; Chromium's scroll anchoring
        # may then adjust scrollY a little, WebKit has no anchoring.
        ok = sebelum == sesudah and gulir == 0 and abs(y_buka[0] - y_tutup[0]) <= 60
        catat(6, "Simpanan, banding, kamar, harga, URL tetap", ok, f"URL ?kamar=, kb:simpan, kb:banding, harga bar ({sesudah[3]}) dan panjang history sama sebelum/sesudah tutorial; saat ditutup {gulir} panggilan gulir; panel hilang sehingga kartu kondisi naik {y_buka[1]:.0f} → {y_tutup[1]:.0f} px (scrollY {y_buka[0]:.0f} → {y_tutup[0]:.0f}, penyesuaian scroll anchoring browser)", jenis)

    # 7: empty and edge states use no fake targets -------------------------------
    async def s7():
        c, pg = await baru()
        await buka(pg, BASE + "/cari?area=binus-kemanggisan&harga_max=1", 2000)
        await klik(pg.locator('[data-tawaran="pencarian"]').get_by_role("button", name="Lihat panduan singkat"))
        await panel(pg).get_by_role("button", name="Berikutnya").click()
        await pg.wait_for_timeout(700)
        kosong = await panel(pg).locator("h2, h3").inner_text()
        sorot_kosong = await pg.evaluate("document.querySelector('[data-tutorial-sorot]')?.dataset.tutorial ?? null")
        await pg.screenshot(path=str(OUT / f"05-hasil-kosong-hp-{jenis}.png"))
        await panel(pg).get_by_role("button", name="Tutup petunjuk").click()
        await buka(pg, BASE + "/kos/rumah-kos-bu-endang", 1500)
        await klik(pg.locator('[data-tawaran="detail"]').get_by_role("button", name="Lihat panduan singkat"))
        await panel(pg).get_by_role("button", name="Berikutnya").click()
        await pg.wait_for_timeout(700)
        belum = await panel(pg).locator("p.text-small").inner_text()
        sorot_belum = await pg.evaluate("document.querySelector('[data-tutorial-sorot]')?.dataset.tutorial ?? null")
        await panel(pg).get_by_role("button", name="Tutup petunjuk").click()
        await buka(pg, BASE + "/disimpan", 1200)
        simpanan_kosong = await tampak(pg, "[data-tawaran='simpanan'], [data-pemicu-ringkas='simpanan']")
        await buka(pg, BASE + "/banding?kos=kost-anggrek-cakra", 1500)
        satu_banding = await tampak(pg, "[data-tawaran='banding'], [data-pemicu-ringkas='banding']")
        await buka(pg, BASE + "/cari?area=binus-kemanggisan&tampil=peta", 2000)
        peta = await tampak(pg, "[data-tawaran='pencarian'], [data-pemicu-ringkas='pencarian']")
        await c.close()
        ok = "Belum ada yang cocok" in kosong and sorot_kosong == "cari-kosong" and "belum punya hasil penilaian" in belum and sorot_belum is None and not simpanan_kosong and not satu_banding and not peta and not pg.galat
        catat(7, "Keadaan kosong, belum dinilai, peta", ok, f"hasil nol: langkah 2 '{kosong}' menyorot kotak saran, bukan kartu; kos belum dinilai: langkah 2 tanpa sorotan; simpanan kosong dan banding satu kandidat tanpa tutorial ({simpanan_kosong}, {satu_banding}); mode peta HP tanpa tawaran/tombol ({peta}); error konsol {pg.galat[:1]}", jenis)

    # 8: quick clicks, navigation, resize and other layers leave nothing behind --
    async def s8():
        c, pg = await baru()
        await buka(pg, BASE + "/cari?area=binus-kemanggisan")
        tombol = pg.locator('[data-tawaran="pencarian"]').get_by_role("button", name="Lihat panduan singkat")
        await ke_tengah(tombol)
        await tombol.click(click_count=3, delay=20)
        n_panel = await panel(pg).count()
        # Opening Filter closes the tutorial; only the filter dialog remains.
        await pg.get_by_role("button", name=re.compile("^Filter")).first.click()
        await pg.wait_for_timeout(600)
        dengan_filter = [await panel(pg).count(), await pg.locator("[role=dialog]").count(), await pg.evaluate("document.querySelectorAll('[data-tutorial-sorot]').length")]
        await pg.keyboard.press("Escape")
        await pg.wait_for_timeout(600)
        # Resize while open, then navigate away while open.
        await klik(pg.locator('[data-pemicu-ringkas="pencarian"]'))
        await pg.set_viewport_size({"width": 700, "height": 900})
        await pg.wait_for_timeout(300)
        sesudah_resize = await panel(pg).count()
        lebar = await pg.evaluate("document.documentElement.scrollWidth")
        await klik(pg.locator("ul.grid[aria-busy=false] article h3 a").first)
        await pg.wait_for_url(re.compile("/kos/"))
        await pg.wait_for_timeout(1200)
        setelah_pindah = [await panel(pg).count(), await pg.evaluate("document.querySelectorAll('[data-tutorial-sorot]').length")]
        # Menu (another sheet) closes an open detail tutorial too.
        await klik(pg.locator('[data-tawaran="detail"]').get_by_role("button", name="Lihat panduan singkat"))
        await pg.get_by_role("button", name="Menu").first.click()
        await pg.wait_for_timeout(600)
        dengan_menu = [await panel(pg).count(), await pg.locator("[role=dialog]").count()]
        await pg.keyboard.press("Escape")
        await pg.wait_for_timeout(500)
        await c.close()
        ok = n_panel == 1 and dengan_filter == [0, 1, 0] and sesudah_resize == 1 and lebar <= 700 and setelah_pindah == [0, 0] and dengan_menu == [0, 1] and not pg.galat
        catat(8, "Klik cepat, navigasi, resize, lapisan lain", ok, f"tiga klik cepat → {n_panel} panel; buka Filter → panel/dialog/sorotan {dengan_filter}; resize 700 px: panel tetap ({sesudah_resize}), lebar halaman {lebar}; pindah ke detail saat terbuka → panel/sorotan {setelah_pindah}; buka Menu → panel/dialog {dengan_menu}; error {pg.galat[:1]}", jenis)

    # 9: keyboard, Escape, focus return, no history entry -------------------------
    async def s9():
        c, pg = await baru(PC)
        await buka(pg, BASE + "/kos/kost-anggrek-cakra")
        h0 = await pg.evaluate("history.length")
        tombol = pg.locator('[data-tawaran="detail"]').get_by_role("button", name="Lihat panduan singkat")
        await ke_tengah(tombol)
        await tombol.focus()
        await pg.keyboard.press("Enter")
        await pg.wait_for_timeout(400)
        fokus_buka = await pg.evaluate("document.activeElement?.tagName + ' ' + document.activeElement?.textContent.trim()")
        tab = "Alt+Tab" if jenis == "webkit" else "Tab"
        await pg.keyboard.press(tab)
        fokus_tab = await pg.evaluate("document.activeElement?.getAttribute('aria-label') || document.activeElement?.textContent.trim()")
        await pg.keyboard.press("Escape")
        await pg.wait_for_timeout(400)
        fokus_tutup = await pg.evaluate("document.activeElement?.dataset.pemicuRingkas ?? (document.activeElement?.tagName + ' ' + document.activeElement?.textContent.trim().slice(0, 30))")
        h1 = await pg.evaluate("history.length")
        # Escape inside the filter-less page with nothing open changes nothing.
        await pg.keyboard.press("Escape")
        st = await pg.evaluate(STATUS)
        # Semantics: a labelled region with a heading, buttons with names; no tooltip role, no modal.
        await klik(pg.locator('[data-pemicu-ringkas="detail"]'))
        struktur = await panel(pg).evaluate("(s) => ({ label: s.getAttribute('aria-labelledby') && document.getElementById(s.getAttribute('aria-labelledby'))?.tagName, tooltip: !!s.closest('[role=tooltip]'), modal: s.getAttribute('aria-modal'), tombol: [...s.querySelectorAll('button')].map((b) => b.getAttribute('aria-label') || b.textContent.trim()) })")
        ukuran = await panel(pg).locator("button[aria-label='Tutup petunjuk']").evaluate("(b) => { const r = b.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }")
        await pg.screenshot(path=str(OUT / f"06-detail-langkah-1-pc-{jenis}.png"))
        await c.close()
        ok = fokus_buka.startswith("H3 Cek kamar") and fokus_tab == "Tutup petunjuk" and fokus_tutup == "detail" and h1 == h0 and st.get("detail") == "ditutup" and struktur["label"] == "H3" and not struktur["tooltip"] and struktur["modal"] is None and ukuran[0] >= 44 and ukuran[1] >= 44
        catat(9, "Keyboard, Escape, fokus kembali, tanpa history", ok, f"Enter membuka, fokus ke judul '{fokus_buka[3:30]}'; {tab} ke '{fokus_tab}'; Escape menutup dan fokus kembali ke tombol '{fokus_tutup}'; history {h0} → {h1}; panel = region berjudul {struktur['label']}, bukan tooltip/modal, tombol {struktur['tombol']}; tombol tutup {ukuran[0]}×{ukuran[1]} px", jenis)

    # 10: reduced motion; the reload intro and the offer do not overlap ----------
    async def s10():
        c, pg = await baru(reduced_motion="reduce")
        await buka(pg, BASE + "/cari?area=binus-kemanggisan")
        await klik(pg.locator('[data-tawaran="pencarian"]').get_by_role("button", name="Lihat panduan singkat"))
        anim = await panel(pg).evaluate("(s) => [getComputedStyle(s).animationName, getComputedStyle(s).animationDuration]")
        await c.close()
        c, pg = await baru()
        await buka(pg, BASE + "/cari?area=binus-kemanggisan", 300)
        await pg.evaluate(f"localStorage.removeItem('{KUNCI}')")
        await pg.reload(wait_until="commit")
        jejak = await pg.evaluate(f"""() => new Promise((res) => {{ const out = []; const t0 = performance.now();
          const tick = () => {{ out.push([Math.round(performance.now() - t0), document.documentElement.dataset.intro || '-', (JSON.parse(localStorage.getItem('{KUNCI}') || '{{}}')).pencarian || '-']);
            if (performance.now() - t0 < 2200) requestAnimationFrame(tick); else res(out); }}; tick(); }})""")
        await c.close()
        saat_intro = [x for x in jejak if x[1] != "-"]
        dicatat = [x for x in jejak if x[2] != "-"]
        ok = anim[0] == "none" and saat_intro and not any(x[2] != "-" for x in saat_intro) and dicatat and dicatat[0][0] >= saat_intro[-1][0]
        catat(10, "Reduced motion; intro tidak bertumpuk", ok, f"reduced motion: animasi panel {anim}; reload normal: intro {saat_intro[0][0] if saat_intro else '-'}–{saat_intro[-1][0] if saat_intro else '-'} ms, tawaran baru dicatat 'ditawarkan' pada {dicatat[0][0] if dicatat else '-'} ms (setelah intro selesai)", jenis)

    # 11: small, landscape, tablet, desktop, 200 % text: no overflow --------------
    async def s11():
        luap = []
        for nama, opsi, teks2x in (
            ("360", dict(viewport={"width": 360, "height": 780}, is_mobile=True, has_touch=True), False),
            ("390", dict(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True), False),
            ("768", dict(viewport={"width": 768, "height": 1024}), False),
            ("1440", dict(viewport={"width": 1440, "height": 900}), False),
            ("landscape 844×390", dict(viewport={"width": 844, "height": 390}, is_mobile=True, has_touch=True), False),
            ("390 teks 200%", dict(viewport={"width": 390, "height": 844}), True),
        ):
            c, pg = await baru(opsi)
            for url, k in (("/cari?area=binus-kemanggisan", "pencarian"), ("/kos/kost-anggrek-cakra", "detail")):
                await buka(pg, BASE + url)
                if teks2x:
                    await pg.evaluate("document.documentElement.style.fontSize = '200%'")
                    await pg.wait_for_timeout(200)
                w = opsi["viewport"]["width"]
                sw_tawaran = await pg.evaluate("document.documentElement.scrollWidth")
                await klik(pg.locator(f'[data-tawaran="{k}"]').get_by_role("button", name="Lihat panduan singkat"))
                await pg.wait_for_timeout(300)
                sw_panel = await pg.evaluate("document.documentElement.scrollWidth")
                kotak = await panel(pg).evaluate("(s) => { const r = s.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.right)]; }")
                if max(sw_tawaran, sw_panel) > w or kotak[0] < 0 or kotak[1] > w:
                    luap.append(f"{nama} {url}: {max(sw_tawaran, sw_panel)} / panel {kotak}")
                if nama == "360" and k == "detail":
                    await pg.screenshot(path=str(OUT / f"07-detail-langkah-1-360-{jenis}.png"))
                await pg.evaluate(f"localStorage.removeItem('{KUNCI}')")
            await c.close()
        catat(11, "360/390/768/1440, landscape, teks 200%", not luap, f"overflow/panel keluar layar: {luap or 'tidak ada'}", jenis)

    # 12: blocked or corrupt storage --------------------------------------------
    async def s12():
        c, pg = await baru()
        await c.add_init_script("Storage.prototype.getItem = function () { throw new DOMException('diblokir', 'SecurityError'); }; Storage.prototype.setItem = function () { throw new DOMException('diblokir', 'SecurityError'); };")
        await buka(pg, BASE + "/cari?area=binus-kemanggisan", 1500)
        ada = await tampak(pg, '[data-tawaran="pencarian"]')
        await klik(pg.locator('[data-tawaran="pencarian"]').get_by_role("button", name="Tutup tawaran petunjuk"))
        tutup_ok = not await tampak(pg, '[data-tawaran="pencarian"]') and await tampak(pg, '[data-pemicu-ringkas="pencarian"]')
        galat_blokir = list(pg.galat)
        await c.close()
        c, pg = await baru(isi={KUNCI: "{rusak", "kb:panduan": "x"})
        await buka(pg, BASE + "/cari?area=binus-kemanggisan", 1500)
        rusak_ada = await tampak(pg, '[data-tawaran="pencarian"]')
        render = await pg.evaluate("new Promise((res) => { let n = 0; const mo = new MutationObserver(() => n++); mo.observe(document.body, { subtree: true, childList: true, attributes: true }); setTimeout(() => { mo.disconnect(); res(n); }, 1500); })")
        await c.close()
        ok = ada and tutup_ok and not galat_blokir and rusak_ada and not pg.galat and render < 50
        catat(12, "Storage diblokir/rusak", ok, f"diblokir: tawaran tampil {ada}, ditutup (memori) {tutup_ok}, error {galat_blokir[:1]}; JSON rusak: tawaran tampil {rusak_ada}, perubahan DOM 1,5 s setelah tenang {render} (tidak berulang), error {pg.galat[:1]}", jenis)

    # 13: no maps, 360°, media or owner code because of the tutorial ------------
    async def s13():
        catatan = []
        berat_semua = []
        for url, k in (("/cari?area=binus-kemanggisan", "pencarian"), ("/kos/kost-anggrek-cakra", "detail")):
            c, pg = await baru()
            minta: list[str] = []
            await buka(pg, BASE + url, 2500)
            pg.on("request", lambda r: minta.append(r.url))
            # Offered (already on screen, recorded), then opened at step 1; the user scrolls nothing.
            await pg.wait_for_timeout(1000)
            await pg.locator(f'[data-tawaran="{k}"]').get_by_role("button", name="Lihat panduan singkat").click()
            await pg.wait_for_timeout(1200)
            await panel(pg).get_by_role("button", name="Tutup petunjuk").click()
            await pg.wait_for_timeout(500)
            await c.close()
            berat = [u for u in minta if re.search(r"maplibre|tiles|360|\.jpe?g|\.webp|/mitra|panorama", u)]
            berat_semua += berat
            catatan.append(f"{url}: {len(minta)} permintaan, berat {berat or 'tidak ada'}")
        catat(13, "Tutorial tidak memuat peta, 360°, media, kode mitra", not berat_semua, "; ".join(catatan), jenis)

    # 14: owner surface only, never submits; renters never see it ---------------
    async def s14():
        c, pg = await baru(PC)
        posting: list[str] = []
        await masuk_mitra(pg, NOMOR_DENGAN_KOS)
        pg.on("request", lambda r: posting.append(f"{r.method} {r.url}") if r.method not in ("GET", "HEAD", "OPTIONS") else None)
        url0 = pg.url
        tawaran = await tampak(pg, '[data-tawaran="mitra-ringkasan"]')
        await pg.screenshot(path=str(OUT / f"08-mitra-tawaran-pc-{jenis}.png"))
        await klik(pg.locator('[data-tawaran="mitra-ringkasan"]').get_by_role("button", name="Lihat panduan singkat"))
        l1 = await panel(pg).inner_text()
        sorot1 = await pg.evaluate("document.querySelector('[data-tutorial-sorot]')?.querySelector('h2')?.textContent ?? null")
        await panel(pg).get_by_role("button", name="Berikutnya").click()
        await pg.wait_for_timeout(700)
        l2 = await panel(pg).inner_text()
        sorot2 = await pg.evaluate("document.querySelector('[data-tutorial-sorot]')?.innerText.replace(/\\n/g, ' / ') ?? null")
        await pg.screenshot(path=str(OUT / f"09-mitra-langkah-2-pc-{jenis}.png"))
        await panel(pg).get_by_role("button", name="Selesai").click()
        await pg.wait_for_timeout(400)
        url1 = pg.url
        st = await pg.evaluate(STATUS)
        await c.close()
        c, pg = await baru(PC)
        await masuk_mitra(pg, NOMOR_TANPA_KOS)
        tanpa = await tampak(pg, "[data-tawaran='mitra-ringkasan'], [data-pemicu-ringkas='mitra-ringkasan']")
        cta = await pg.get_by_role("link", name="Daftarkan kos").count()
        await c.close()
        c, pg = await baru(HP)
        bocor = []
        for url in ("/", "/cari?area=binus-kemanggisan", "/kos/kost-anggrek-cakra", "/disimpan", "/cara-menggunakan"):
            await buka(pg, BASE + url, 600)
            if await pg.locator("[data-tawaran='mitra-ringkasan'], [data-pemicu-ringkas='mitra-ringkasan']").count():
                bocor.append(url)
        await c.close()
        ok = tawaran and "langkah 1 dari 2" in l1 and sorot1 == "Kos Putri Melati" and "langkah 2 dari 2" in l2 and sorot2 and "Perbarui ketersediaan" in sorot2 and url0 == url1 and not posting and st.get("mitra-ringkasan") == "selesai" and not tanpa and cta == 1 and not bocor
        catat(14, "Mitra: hanya di surface mitra, tanpa submit", ok, f"login nomor uji lokal; tawaran {tawaran}; langkah 1 menyorot kos pertama '{sorot1}', langkah 2 menyorot '{(sorot2 or '')[:45]}'; URL tetap, permintaan non-GET selama tutorial {posting[:2] or 'tidak ada'}; status {st.get('mitra-ringkasan')}; akun tanpa kos: tanpa tutorial ({tanpa}), tombol 'Daftarkan kos' tetap; halaman pencari tanpa materi mitra ({bocor or 'ya'})", jenis)

    # Evidence: legacy user, saved list, compare --------------------------------
    async def bukti():
        c, pg = await baru()
        await buka(pg, BASE + "/kos/kost-anggrek-cakra", 1200)
        await klik(pg.get_by_role("button", name=re.compile("^Simpan Kost")).first)
        await buka(pg, BASE + "/disimpan", 2000)
        await klik(pg.locator('[data-tawaran="simpanan"]').get_by_role("button", name="Lihat panduan singkat"))
        await pg.screenshot(path=str(OUT / f"10-simpanan-hp-{jenis}.png"))
        await c.close()
        c, pg = await baru(PC)
        await buka(pg, BASE + "/banding?kos=kost-anggrek-cakra,kos-putri-melati", 1500)
        await klik(pg.locator('[data-tawaran="banding"]').get_by_role("button", name="Lihat panduan singkat"))
        await pg.screenshot(path=str(OUT / f"11-banding-pc-{jenis}.png"))
        await c.close()
        c, pg = await baru(isi={"kb:panduan": "v1"})
        await buka(pg, BASE + "/cari?area=binus-kemanggisan", 1500)
        await pg.screenshot(path=str(OUT / f"12-pengguna-lama-cari-hp-{jenis}.png"))
        await buka(pg, BASE + "/", 1500)
        await c.close()
        c, pg = await baru()
        await buka(pg, BASE + "/", 1800)
        await pg.locator('[data-tawaran="beranda"]').scroll_into_view_if_needed()
        await pg.screenshot(path=str(OUT / f"13-beranda-satu-baris-hp-{jenis}.png"))
        await c.close()

    daftar = [(1, s1), (2, s2_4), (3, s3), (5, s5), (6, s6), (7, s7), (8, s8), (9, s9), (10, s10), (11, s11), (12, s12), (13, s13), (14, s14)]
    hanya = [x for x in os.environ.get("HANYA", "").split(",") if x]
    for no, f in daftar:
        if not hanya or str(no) in hanya:
            await jalankan(no, f.__name__, f)
    if not hanya:
        await jalankan("bukti", "screenshot", bukti)
    await b.close()


async def main():
    async with async_playwright() as p:
        for jenis in [j for j in os.environ.get("MESIN", "chromium,webkit").split(",") if j]:
            await suite(p, jenis)
    (OUT / "hasil-uji.json").write_text(json.dumps({"base": BASE, "waktu": time.strftime("%Y-%m-%d %H:%M"), "hasil": hasil}, ensure_ascii=False, indent=2))
    gagal = [h for h in hasil if not h["lulus"]]
    print(f"\n{len(hasil) - len(gagal)}/{len(hasil)} lulus")


asyncio.run(main())
