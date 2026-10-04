# Olah data kuesioner uji prototipe → grafik di docs/laporan/grafik/.
#   python3 docs/laporan/olah-data.py "<ekspor Google Form>.csv"
# CSV berisi nama responden: jangan di-commit ke repo publik.
import csv, collections, statistics as st, sys, os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "grafik")
rows = list(csv.reader(open(sys.argv[1], encoding="utf-8"))); h, d = rows[0], rows[1:]; n = len(d)
BIRU, BIRU2, JINGGA, ARANG, ABU = "#1D6FE0", "#DCEAFD", "#FF7A1A", "#16202E", "#5A6B80"
SKALA = ["#B91C1C", "#F4A3A3", "#C9D3DF", "#8DB7F0", "#1256B8"]
plt.rcParams.update({"font.size": 11, "axes.spines.top": False, "axes.spines.right": False, "axes.edgecolor": ABU, "axes.labelcolor": ARANG, "xtick.color": ARANG, "ytick.color": ARANG})
LABEL = ["Mudah digunakan (wajib 1)", "Membantu kebutuhan (wajib 3)", "Tampilan menarik dan rapi", "Informasi detail jelas", "Bisa dipakai tanpa bantuan"]

# 1. Likert distribution (stacked, percent)
fig, ax = plt.subplots(figsize=(10, 4.2))
for i, j in enumerate(range(5, 10)):
    c = collections.Counter(int(r[j]) for r in d); kiri = 0
    for k in range(1, 6):
        w = 100 * c[k] / n
        ax.barh(i, w, left=kiri, color=SKALA[k-1], edgecolor="white")
        if w >= 6: ax.text(kiri + w/2, i, f"{w:.0f}%", ha="center", va="center", fontsize=9, color="white" if k in (1, 5) else ARANG)
        kiri += w
ax.set_yticks(range(5)); ax.set_yticklabels(LABEL); ax.invert_yaxis(); ax.set_xlim(0, 100); ax.set_xlabel("% responden (n = 63)")
from matplotlib.patches import Patch
ax.legend([Patch(color=c) for c in SKALA], ["1 Sangat tidak setuju", "2", "3", "4", "5 Sangat setuju"], ncol=5, loc="upper center", bbox_to_anchor=(0.45, -0.18), frameon=False, fontsize=9)
ax.set_title("Sebaran jawaban skala 1–5", loc="left", fontweight="bold", color=ARANG)
fig.tight_layout(); fig.savefig(f"{OUT}/01-sebaran-likert.png", dpi=160); plt.close(fig)

# 2. Means
mean = [st.mean(int(r[j]) for r in d) for j in range(5, 10)]
setuju = [100 * sum(int(r[j]) >= 4 for r in d) / n for j in range(5, 10)]
fig, ax = plt.subplots(figsize=(9, 3.8))
b = ax.barh(range(5), mean, color=BIRU)
for i, (m, s) in enumerate(zip(mean, setuju)): ax.text(m + 0.05, i, f"{m:.2f}  ({s:.0f}% setuju)", va="center", fontsize=10, color=ARANG)
ax.axvline(3, color=ABU, ls="--", lw=1); ax.text(3.02, 4.45, "netral", color=ABU, fontsize=9)
ax.set_yticks(range(5)); ax.set_yticklabels(LABEL); ax.invert_yaxis(); ax.set_xlim(1, 5.6); ax.set_xlabel("Rata-rata (1–5)")
ax.set_title("Rata-rata skor per pernyataan", loc="left", fontweight="bold", color=ARANG)
fig.tight_layout(); fig.savefig(f"{OUT}/02-rata-rata.png", dpi=160); plt.close(fig)

# 3. Demographics
def hitung(j, urut=None):
    c = collections.Counter()
    for r in d:
        for x in r[j].split(";"): c[x.strip()] += 1
    return [(k, c[k]) for k in (urut or [k for k, _ in c.most_common()])]
fig, axs = plt.subplots(1, 3, figsize=(14, 3.6))
for ax, (judul, data) in zip(axs, [
    ("Usia", hitung(2, ["< 18 Tahun", "18 - 24 Tahun", "25 - 30 Tahun", "> 30 Tahun"])),
    ("Kesibukan (boleh lebih dari satu)", hitung(3)),
    ("Pengalaman mencari kos", hitung(4, ["Sedang aktif mencari kos dalam waktu dekat", "Pernah mencari kos di masa lalu", "Belum pernah mencari kos sama sekali"])),
]):
    lab = [k.replace(" Tahun", "").replace("Sedang aktif mencari kos dalam waktu dekat", "Sedang aktif mencari").replace("Pernah mencari kos di masa lalu", "Pernah mencari").replace("Belum pernah mencari kos sama sekali", "Belum pernah") for k, _ in data]
    v = [x for _, x in data]
    ax.barh(range(len(v)), v, color=BIRU); ax.set_yticks(range(len(v))); ax.set_yticklabels(lab); ax.invert_yaxis()
    for i, x in enumerate(v): ax.text(x + 0.5, i, str(x), va="center", fontsize=10)
    ax.set_title(judul, loc="left", fontweight="bold", color=ARANG, fontsize=11); ax.set_xlim(0, max(v) * 1.2)
fig.tight_layout(); fig.savefig(f"{OUT}/03-profil-responden.png", dpi=160); plt.close(fig)

# 4. Group comparison (composite mean of 5 items)
def komp(f): ix = [r for r in d if f(r)]; return st.mean(st.mean(int(r[j]) for j in range(5, 10)) for r in ix), len(ix)
grup = [
    ("Mahasiswa saja", komp(lambda r: r[3].strip() == "Mahasiswa")),
    ("Bekerja / wirausaha\n(termasuk sambil kuliah)", komp(lambda r: "Karyawan" in r[3] or "Wirausaha" in r[3])),
    ("Sedang aktif mencari", komp(lambda r: r[4].startswith("Sedang"))),
    ("Pernah mencari", komp(lambda r: r[4].startswith("Pernah"))),
    ("Belum pernah mencari", komp(lambda r: r[4].startswith("Belum"))),
]
fig, ax = plt.subplots(figsize=(9, 3.6))
ax.barh(range(len(grup)), [g[1][0] for g in grup], color=[BIRU, BIRU, JINGGA, JINGGA, JINGGA])
for i, (_, (m, k)) in enumerate(grup): ax.text(m + 0.05, i, f"{m:.2f}  (n = {k})", va="center", fontsize=10)
ax.set_yticks(range(len(grup))); ax.set_yticklabels([g[0] for g in grup]); ax.invert_yaxis(); ax.set_xlim(1, 5.3)
ax.axvline(3, color=ABU, ls="--", lw=1); ax.set_xlabel("Rata-rata gabungan 5 pernyataan (1–5)")
ax.set_title("Skor rata-rata per kelompok responden", loc="left", fontweight="bold", color=ARANG)
fig.tight_layout(); fig.savefig(f"{OUT}/04-per-kelompok.png", dpi=160); plt.close(fig)

# 5–7. Themes (manual coding by row index, see laporan)
BINGUNG = {
 "Tidak ada kendala": [6,7,8,9,10,11,12,17,18,19,20,21,25,26,27,52,62],
 "Kosong / tidak spesifik": [1,13,14,15,16,28],
 "Sulit menilai kecocokan dari info ringkas": [29,41,42,44,50,53,58],
 "Rincian biaya, fasilitas, jarak perlu dibaca ulang": [30,31,43,54,55,59,60],
 "Alur filter dan pencarian": [3,37,38,39,48,49],
 "Informasi terlalu padat / sulit dibaca": [22,23,24,32,46],
 "Alur simpan dan bandingkan": [2,35,51,57],
 "Perlu panduan saat pertama memakai": [0,40,47,56],
 "Label tombol perlu dibaca dulu": [34,36,61],
 "Data contoh vs data asli": [33,45],
 "Tidak ada menu navigasi": [4],
 "Loading terasa lama": [5],
}
PERBAIKI = {
 "Jelaskan skor, estimasi biaya, dan jarak": [29,30,43,44,54,55,58,59,60],
 "Tata letak lebih lega, rapi, sederhana": [2,22,23,24,32,36,61],
 "Simpan dan bandingkan lebih mudah dikenali": [35,40,47,51,56,57,62],
 "Fitur baru (review, kontak, diskon, animasi, dll.)": [0,3,4,7,8,9,21],
 "Info lingkungan sekitar lebih rinci": [25,33,41,45,53],
 "Bantuan saat mencari (saran filter, ulang, loading)": [37,38,39,48,49],
 "Harga, lokasi, info penting lebih menonjol": [27,34,46,52],
 "Status kamar dan waktu pembaruan": [31,42,50],
 "Tidak ada / sudah bagus": [6,10,12,18,19,26],
 "Kosong / tidak spesifik": [1,5,11,13,14,15,16,17,20,28],
}
SUKA = {
 "Simpan dan bandingkan": [27,31,33,37,42,46,53,54,55,61],
 "Kartu kos (foto + ringkasan)": [38,40,41,43,49,50,59,60],
 "Desain simpel, rapi, warna": [3,10,11,15,21,25,28,62],
 "Informasi lengkap dan detail": [4,14,19,22,23,24,26],
 "Total biaya dan rinciannya": [36,44,47,48,56,57],
 "Harga, lokasi, kenyamanan dalam satu tempat": [30,35,39,51,52],
 "Pencarian dan filter": [29,32,45,58],
 "Mudah digunakan": [5,6,9],
 "Skor kebersihan / kedap / kenyamanan": [2,34],
 "Tur 360°": [17],
 "Positif umum": [0,7,8,18,20],
 "Kosong": [1,12,13,16],
}
for tema in (BINGUNG, PERBAIKI, SUKA):
    semua = sorted(i for v in tema.values() for i in v); assert semua == list(range(n)), (len(semua), set(range(n)) - set(semua))
def tema_png(tema, nama, judul, abaikan):
    item = [(k, len(v)) for k, v in tema.items() if k not in abaikan]
    item.sort(key=lambda x: -x[1])
    fig, ax = plt.subplots(figsize=(9, 0.45 * len(item) + 1.2))
    ax.barh(range(len(item)), [v for _, v in item], color=BIRU)
    for i, (_, v) in enumerate(item): ax.text(v + 0.15, i, f"{v} ({100*v/n:.0f}%)", va="center", fontsize=10)
    ax.set_yticks(range(len(item))); ax.set_yticklabels([k for k, _ in item]); ax.invert_yaxis()
    ax.set_xlim(0, max(v for _, v in item) * 1.3); ax.set_xlabel("jumlah responden (n = 63)")
    from matplotlib.ticker import MaxNLocator
    ax.xaxis.set_major_locator(MaxNLocator(integer=True))
    fig.suptitle(judul, x=0.01, ha="left", fontweight="bold", color=ARANG)
    fig.tight_layout(); fig.savefig(f"{OUT}/{nama}", dpi=160); plt.close(fig)
tema_png(BINGUNG, "05-kebingungan.png", "Bagian yang membingungkan (pertanyaan wajib 2)", ["Kosong / tidak spesifik"])
tema_png(PERBAIKI, "06-perbaikan.png", "Yang perlu diperbaiki (pertanyaan wajib 4)", ["Kosong / tidak spesifik"])
tema_png(SUKA, "07-disukai.png", "Yang paling disukai", ["Kosong"])
for nama, tema in (("BINGUNG", BINGUNG), ("PERBAIKI", PERBAIKI), ("SUKA", SUKA)):
    print(nama, [(k, len(v)) for k, v in tema.items()])
