# Turns Calvin's raw shoot of the Jl. Sandang kos (Sony A7C: 51 JPG + ARW,
# 37 vertical 4K clips) into what the site serves, and writes
# public/media/sandang/media.json for supabase/seed/generate.ts.
#
#   FFMPEG=/path/to/ffmpeg python3 scripts/proses-media-sandang.py "/Users/calvinn/Downloads/Kos Bahagia"
#
# Photos: 1600 px long edge, WebP q78 (same as public/dummy), blurhash.
# Room stills come from the 4K clips because the stills shoot has no room.
# Redacted before export: the third-party ad banner on the gate (face and
# phone number) and the two people on the rooftop.
#
# Video: a 20-odd second silent room tour, 720x1280 H.264 (CRF 27,
# faststart), cut only from clips without people, crossfades, a light grade,
# short labels in Plus Jakarta Sans. Font path: env FONT_BOLD (TTF).

import json
import os
import subprocess
import sys
import tempfile
from math import cos, floor, pi

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
KELUAR = os.path.join(ROOT, "public", "media", "sandang")
URL = "/media/sandang"
FFMPEG = os.environ.get("FFMPEG", "ffmpeg")
FONT_BOLD = os.environ.get("FONT_BOLD", "PlusJakartaSans-Bold.ttf")

# (file, name, caption, crop box, blur boxes); boxes are fractions of the
# upright image: (left, top, right, bottom).
FOTO = [
    ("_A7C0005.JPG", "tampak-depan", "Tampak depan, gerbang nomor 6", None, [(0.76, 0.575, 0.925, 0.725)]),
    ("_A7C0026.JPG", "ruang-bersama", "Ruang bersama di lantai atas", None, []),
    ("_A7C0039.JPG", "koridor", "Koridor kamar", None, []),
    ("_A7C0041.JPG", "ruang-duduk", "Ruang duduk di ujung koridor", None, []),
    ("_A7C0017.JPG", "parkir", "Parkir motor beratap di lantai dasar", (0, 0, 1, 0.9), [(0.87, 0.57, 0.97, 0.66)]),
    ("_A7C0051.JPG", "rooftop", "Rooftop dengan meja dan jemuran", None, [(0.57, 0.49, 0.685, 0.63)]),
]
PATOKAN = [
    ("_A7C0003.JPG", "jalan-depan", "Jl. Sandang di depan kos", (0, 0, 1, 0.88), []),
]
# (clip, second, name, caption, crop box)
STILL = [
    ("Neko7C6610.MP4", 1.0, "kamar", "Kamar: kasur, meja belajar, dan gantungan baju", (0, 0.43, 1, 0.8625)),
    ("Neko7C6613.MP4", 0.3, "kamar-pintu", "Kamar: AC di atas pintu dan ruang simpan", (0, 0, 1, 0.75)),
    ("Neko7C6605.MP4", 1.0, "kamar-mandi", "Kamar mandi dalam: kloset duduk dan shower", (0, 0, 1, 1)),
]
# (clip, in, source seconds, speed, label)
KLIP = [
    ("Neko7C6611.MP4", 0.2, 6.8, 1.35, "Kamar"),
    ("Neko7C6597.MP4", 0.3, 3.6, 1.0, "Kasur"),
    ("Neko7C6594.MP4", 0.3, 4.2, 1.1, "Meja belajar"),
    ("Neko7C6605.MP4", 0.0, 3.0, 1.0, "Kamar mandi dalam"),
    ("Neko7C6613.MP4", 0.0, 4.0, 1.0, "AC di atas pintu"),
    ("Neko7C6610.MP4", 0.5, 4.0, 1.0, None),
]
PENUTUP = ("600 m dari BINUS Anggrek", "7 menit jalan kaki")
SILANG = 0.4  # crossfade seconds
LEBAR_V, TINGGI_V = 720, 1280


# ---- blurhash (same encoder as scripts/foto-dummy.mjs)
ABJAD = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%*+,-.:;=?@[]^_{|}~"


def enc83(n, panjang):
    return "".join(ABJAD[(n // 83 ** (panjang - i)) % 83] for i in range(1, panjang + 1))


def ke_linear(v):
    x = v / 255
    return x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4


def ke_srgb(v):
    x = max(0.0, min(1.0, v))
    return round((x * 12.92 if x <= 0.0031308 else 1.055 * x ** (1 / 2.4) - 0.055) * 255)


def blurhash(img, cx, cy):
    w, h = img.size
    px = [tuple(ke_linear(c) for c in p) for p in img.convert("RGB").getdata()]
    faktor = []
    for y in range(cy):
        for x in range(cx):
            norm = 1 if x == 0 and y == 0 else 2
            r = g = b = 0.0
            for j in range(h):
                for i in range(w):
                    basis = norm * cos(pi * x * i / w) * cos(pi * y * j / h)
                    p = px[j * w + i]
                    r += basis * p[0]
                    g += basis * p[1]
                    b += basis * p[2]
            faktor.append((r / (w * h), g / (w * h), b / (w * h)))
    dc, ac = faktor[0], faktor[1:]
    maks = max(abs(v) for f in ac for v in f) if ac else 1
    kuant = max(0, min(82, floor(maks * 166 - 0.5)))
    maks_nyata = (kuant + 1) / 166
    tanda = lambda v: (-1 if v < 0 else 1) * abs(v) ** 0.5
    q = lambda v: max(0, min(18, floor(tanda(v / maks_nyata) * 9 + 9.5)))
    s = enc83((cx - 1) + (cy - 1) * 9, 1) + enc83(kuant, 1)
    s += enc83((ke_srgb(dc[0]) << 16) + (ke_srgb(dc[1]) << 8) + ke_srgb(dc[2]), 4)
    for r, g, b in ac:
        s += enc83(q(r) * 19 * 19 + q(g) * 19 + q(b), 2)
    return s


# ---- photos
def kotak(img, f):
    w, h = img.size
    return (round(f[0] * w), round(f[1] * h), round(f[2] * w), round(f[3] * h))


def samarkan(img, f):
    x0, y0, x1, y1 = kotak(img, f)
    bagian = img.crop((x0, y0, x1, y1))
    radius = max(12, (x1 - x0) // 14)
    bagian = bagian.resize((max(1, (x1 - x0) // 24), max(1, (y1 - y0) // 24))).resize(bagian.size, Image.BILINEAR)
    bagian = bagian.filter(ImageFilter.GaussianBlur(radius))
    # Feathered edge so the patch does not read as a box.
    topeng = Image.new("L", bagian.size, 0)
    tepi = max(8, min(bagian.size) // 8)
    ImageDraw.Draw(topeng).rounded_rectangle((tepi, tepi, bagian.size[0] - tepi, bagian.size[1] - tepi), radius=tepi, fill=255)
    topeng = topeng.filter(ImageFilter.GaussianBlur(tepi / 2))
    img.paste(bagian, (x0, y0), topeng)


def simpan(img, nama, keterangan, jenis):
    img = ImageOps.autocontrast(img.convert("RGB"), cutoff=0.3)
    img = ImageEnhance.Color(img).enhance(1.06)
    img.thumbnail((1200, 1200) if jenis == "patokan" else (1600, 1600), Image.LANCZOS)
    tujuan = os.path.join(KELUAR, f"{nama}.webp")
    img.save(tujuan, "WEBP", quality=78, method=6)
    # Busy scenes (wires, gate ironwork) get a lower quality to stay light.
    if os.path.getsize(tujuan) > 160_000:
        img.save(tujuan, "WEBP", quality=68, method=6)
    kecil = img.resize((32, 24) if img.width >= img.height else (24, 32))
    cx, cy = (4, 3) if img.width >= img.height else (3, 4)
    return {
        "id": nama,
        "jenis": jenis,
        "url": f"{URL}/{nama}.webp",
        "keterangan": keterangan,
        "lebar": img.width,
        "tinggi": img.height,
        "blurhash": blurhash(kecil, cx, cy),
        "bytes": os.path.getsize(tujuan),
    }


def foto(sumber, daftar, jenis):
    hasil = []
    for berkas, nama, keterangan, potong, samar in daftar:
        img = ImageOps.exif_transpose(Image.open(os.path.join(sumber, berkas)))
        for f in samar:
            samarkan(img, f)
        if potong:
            img = img.crop(kotak(img, potong))
        hasil.append(simpan(img, nama, keterangan, jenis))
    return hasil


def still(sumber, kerja):
    hasil = []
    for klip, detik, nama, keterangan, potong in STILL:
        png = os.path.join(kerja, f"{nama}.png")
        subprocess.run([FFMPEG, "-v", "error", "-ss", str(detik), "-i", os.path.join(sumber, klip), "-frames:v", "1", "-y", png], check=True)
        img = Image.open(png)
        hasil.append(simpan(img.crop(kotak(img, potong)), nama, keterangan, "foto"))
    return hasil


# ---- video
def label_png(teks, sub, tujuan):
    """Full-frame transparent PNG with a pill at the lower left (or a centred end card)."""
    img = Image.new("RGBA", (LEBAR_V, TINGGI_V), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    besar = ImageFont.truetype(FONT_BOLD, 34)
    if sub is None:
        l, t, r, b = d.textbbox((0, 0), teks, font=besar)
        x, y, px, py = 40, TINGGI_V - 200, 26, 16
        d.rounded_rectangle((x, y, x + (r - l) + 2 * px, y + (b - t) + 2 * py), radius=40, fill=(22, 32, 46, 190))
        d.text((x + px - l, y + py - t), teks, font=besar, fill=(255, 255, 255, 255))
    else:
        kecil = ImageFont.truetype(FONT_BOLD, 26)
        l, t, r, b = d.textbbox((0, 0), teks, font=besar)
        l2, t2, r2, b2 = d.textbbox((0, 0), sub, font=kecil)
        lebar = max(r - l, r2 - l2) + 64
        tinggi = (b - t) + (b2 - t2) + 52
        x, y = (LEBAR_V - lebar) // 2, TINGGI_V - 300
        d.rounded_rectangle((x, y, x + lebar, y + tinggi), radius=28, fill=(29, 111, 224, 235))
        d.text(((LEBAR_V - (r - l)) // 2 - l, y + 20 - t), teks, font=besar, fill=(255, 255, 255, 255))
        d.text(((LEBAR_V - (r2 - l2)) // 2 - l2, y + 32 + (b - t) - t2), sub, font=kecil, fill=(220, 234, 253, 255))
    img.save(tujuan)


def video(sumber, kerja):
    masukan, rantai, durasi = [], [], []
    for i, (klip, awal, panjang, cepat, label) in enumerate(KLIP):
        d = panjang / cepat
        durasi.append(d)
        masukan += ["-ss", str(awal), "-t", str(panjang), "-i", os.path.join(sumber, klip)]
        png = os.path.join(kerja, f"label{i}.png")
        if label:
            label_png(label, None, png)
        else:
            label_png(*PENUTUP, png)
        masukan += ["-loop", "1", "-t", f"{d:.3f}", "-i", png]
    for i, d in enumerate(durasi):
        v, l = 2 * i, 2 * i + 1
        rantai.append(
            f"[{v}:v]setpts=(PTS-STARTPTS)/{KLIP[i][3]},fps=25,scale={LEBAR_V}:{TINGGI_V}:flags=lanczos,"
            f"eq=contrast=1.05:saturation=1.1:gamma=0.98,unsharp=5:5:0.35,setsar=1,format=yuv420p[v{i}]"
        )
        rantai.append(f"[{l}:v]format=rgba,fade=in:st=0.35:d=0.3:alpha=1,fade=out:st={d - 0.75:.3f}:d=0.3:alpha=1[l{i}]")
        rantai.append(f"[v{i}][l{i}]overlay=0:0:shortest=1,format=yuv420p[k{i}]")
    sebelum, offset = "k0", 0.0
    for i in range(1, len(durasi)):
        offset += durasi[i - 1] - SILANG
        keluar = f"x{i}"
        rantai.append(f"[{sebelum}][k{i}]xfade=transition=fade:duration={SILANG}:offset={offset:.3f}[{keluar}]")
        sebelum = keluar
    total = sum(durasi) - SILANG * (len(durasi) - 1)
    rantai.append(f"[{sebelum}]fade=in:st=0:d=0.3,fade=out:st={total - 0.5:.3f}:d=0.5[akhir]")
    mentah = os.path.join(kerja, "tur-kamar.mp4")
    subprocess.run(
        [FFMPEG, "-v", "error", *masukan, "-filter_complex", ";".join(rantai), "-map", "[akhir]", "-an",
         "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-profile:v", "high", "-pix_fmt", "yuv420p", "-y", mentah],
        check=True,
    )
    # The frames are already upright, but ffmpeg copies the camera's 90°
    # display matrix to the output; reset it, and move the index to the front.
    mp4 = os.path.join(KELUAR, "tur-kamar.mp4")
    subprocess.run([FFMPEG, "-v", "error", "-display_rotation:v:0", "0", "-i", mentah, "-c", "copy", "-movflags", "+faststart", "-y", mp4], check=True)
    poster = os.path.join(kerja, "poster.png")
    subprocess.run([FFMPEG, "-v", "error", "-ss", "0.32", "-i", mp4, "-frames:v", "1", "-y", poster], check=True)
    img = Image.open(poster).convert("RGB")
    img.save(os.path.join(KELUAR, "tur-kamar-poster.webp"), "WEBP", quality=72, method=6)
    return {
        "id": "tur-kamar",
        "jenis": "video",
        "url": f"{URL}/tur-kamar.mp4",
        "keterangan": "Video tur kamar: kasur, meja belajar, kamar mandi dalam, dan AC",
        "lebar": LEBAR_V,
        "tinggi": TINGGI_V,
        "blurhash": blurhash(img.resize((24, 32)), 3, 4),
        "bytes": os.path.getsize(mp4),
        "poster_url": f"{URL}/tur-kamar-poster.webp",
        "durasi_detik": round(total),
    }


def main():
    if len(sys.argv) < 2:
        sys.exit("Pakai: python3 scripts/proses-media-sandang.py <folder sumber>")
    sumber = sys.argv[1]
    os.makedirs(KELUAR, exist_ok=True)
    with tempfile.TemporaryDirectory() as kerja:
        foto_luar = foto(sumber, FOTO, "foto")
        foto_kamar = still(sumber, kerja)
        # Gallery order: front, the room, its bathroom, then shared spaces.
        galeri = [foto_luar[0], *foto_kamar, *foto_luar[1:]]
        hasil = galeri + foto(sumber, PATOKAN, "patokan") + [video(sumber, kerja)]
    with open(os.path.join(KELUAR, "media.json"), "w") as f:
        json.dump(hasil, f, indent=2, ensure_ascii=False)
        f.write("\n")
    for m in hasil:
        print(f"{m['url']:44} {m['lebar']}x{m['tinggi']} {m['bytes'] / 1024:7.1f} KB")
    print(f"Total {sum(m['bytes'] for m in hasil) / 1048576:.2f} MB")


if __name__ == "__main__":
    main()
