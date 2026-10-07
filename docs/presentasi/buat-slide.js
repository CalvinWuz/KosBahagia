const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const lu = require("react-icons/lu");
const path = require("path");
const { applyTheme } = require(process.env.SKILL + "/scripts/apply_theme.js");

const DOCS = "/Users/calvinn/KosBahagia/docs";
const OUT = path.join(DOCS, "presentasi", "Kos-Bahagia-Prototype-Testing.pptx");
const img = (p) => path.join(DOCS, p);

const HEX = { biru: "1D6FE0", biruTua: "1256B8", biruMuda: "DCEAFD", jingga: "FF7A1A", daun: "0E9F6E", merah: "B91C1C", arang: "16202E", abu: "5A6B80", kertas: "F2F6FC", putih: "FFFFFF", garis: "D5DEEA" };
const THEME = {
  name: "Kos Bahagia",
  headFontFace: "Arial",
  bodyFontFace: "Calibri",
  colors: { dk1: HEX.arang, lt1: HEX.putih, dk2: HEX.biruTua, lt2: HEX.kertas, accent1: HEX.biru, accent2: HEX.jingga, accent3: HEX.daun, accent4: HEX.merah, accent5: "8DB7F0", accent6: HEX.abu, hlink: HEX.biru, folHlink: HEX.biruTua },
};

async function ikon(nama, warna, ukuran = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(lu[nama], { color: "#" + warna, size: ukuran }));
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
  pres.title = "Kos Bahagia: Prototype Testing dan Iterasi Desain";
  pres.author = "Tim Kos Bahagia";
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  const C = pres.SchemeColor;

  // ------------------------------------------------------------ layouts
  pres.defineSlideMaster({
    title: "JUDUL",
    background: { color: HEX.biruTua },
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: 0.8, y: 2.35, w: 8.2, h: 1.3, fontSize: 54, bold: true, color: C.background1, fontFace: "Arial", align: "left", valign: "top" }, text: "" } },
      { placeholder: { options: { name: "body", type: "body", x: 0.8, y: 3.7, w: 8.2, h: 1.4, fontSize: 22, color: C.background1, fontFace: "Calibri", align: "left", valign: "top" }, text: "" } },
    ],
  });
  pres.defineSlideMaster({
    title: "SEKSI",
    background: { color: HEX.biruTua },
    objects: [
      { placeholder: { options: { name: "nomor", type: "body", x: 0.8, y: 2.3, w: 3, h: 0.9, fontSize: 28, bold: true, color: C.accent2, fontFace: "Arial", align: "left" }, text: "" } },
      { placeholder: { options: { name: "title", type: "title", x: 0.8, y: 3.1, w: 11.5, h: 1.2, fontSize: 44, bold: true, color: C.background1, fontFace: "Arial", align: "left" }, text: "" } },
      { placeholder: { options: { name: "body", type: "body", x: 0.8, y: 4.3, w: 10, h: 0.9, fontSize: 18, color: C.background1, fontFace: "Calibri", align: "left" }, text: "" } },
    ],
  });
  pres.defineSlideMaster({
    title: "KONTEN",
    background: { color: HEX.putih },
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.35, w: 12.1, h: 0.85, fontSize: 30, bold: true, color: C.text1, fontFace: "Arial", align: "left", valign: "middle", margin: 0 }, text: "" } },
      { text: { text: "Kos Bahagia | Prototype Testing", options: { x: 0.6, y: 7.0, w: 5, h: 0.3, fontSize: 10, color: C.accent6, fontFace: "Calibri", margin: 0 } } },
    ],
    slideNumber: { x: 12.3, y: 7.0, w: 0.5, h: 0.3, fontSize: 10, color: HEX.abu, align: "right" },
  });
  pres.defineSlideMaster({
    title: "PENUTUP",
    background: { color: HEX.arang },
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: 0.8, y: 0.6, w: 11.7, h: 1.0, fontSize: 40, bold: true, color: C.background1, fontFace: "Arial", align: "left" }, text: "" } },
    ],
  });

  // ------------------------------------------------------------ helpers
  const kartu = (s, x, y, w, h, nama, isi = HEX.putih, garis = HEX.garis) =>
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.12, fill: { color: isi }, line: { color: garis, width: 1 }, objectName: nama, shadow: { type: "outer", color: "1256B8", opacity: 0.12, blur: 8, offset: 2, angle: 90 } });
  const bulatIkon = async (s, nama, x, y, d = 0.62, latar = HEX.biruMuda, warna = HEX.biruTua) => {
    s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: latar }, line: { color: latar }, objectName: `ikon-latar-${nama}` });
    s.addImage({ data: await ikon(nama, warna), x: x + d * 0.22, y: y + d * 0.22, w: d * 0.56, h: d * 0.56, objectName: `ikon-${nama}` });
  };
  const teks = (s, t, o) => s.addText(t, { isTextBox: true, fontFace: "Calibri", color: HEX.arang, margin: 0, valign: "top", ...o });
  const stat = (s, angka, label, x, y, w, warna = HEX.biruTua, ukuran = 44) => {
    teks(s, angka, { x, y, w, h: 0.85, fontSize: ukuran, bold: true, color: warna, fontFace: "Arial", valign: "bottom", objectName: `stat-${label.slice(0, 12)}` });
    teks(s, label, { x, y: y + 0.9, w, h: 0.7, fontSize: 13, color: HEX.abu });
  };
  const gayaChart = (o) => ({
    catAxisLabelColor: HEX.arang, valAxisLabelColor: HEX.abu, catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt",
    dataLabelFontFace: "+mn-lt", titleFontFace: "+mj-lt", legendFontFace: "+mn-lt", catAxisLabelFontSize: 12, valAxisLabelFontSize: 10,
    valGridLine: { color: "E5EBF2", size: 0.75 }, catGridLine: { style: "none" }, showTitle: false, ...o,
  });

  // ============================================================ 1. Judul
  pres.addSection({ title: "Pembuka" });
  let s = pres.addSlide({ masterName: "JUDUL", sectionTitle: "Pembuka" });
  s.addText("Kos Bahagia", { placeholder: "title" });
  s.addText("Prototype Testing, Feedback Grid, dan Iterasi Desain", { placeholder: "body" });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.8, y: 1.0, w: 1.1, h: 1.1, rectRadius: 0.22, fill: { color: HEX.putih }, line: { color: HEX.putih }, objectName: "alas-logo" });
  s.addImage({ path: img("logo/kos-bahagia-mark-1024.png"), x: 0.92, y: 1.12, w: 0.86, h: 0.86, objectName: "logo" });
  teks(s, "kos-bahagia-umber.vercel.app   |   Oktober 2026", { x: 0.8, y: 6.4, w: 8, h: 0.4, fontSize: 14, color: HEX.biruMuda });
  s.addImage({ path: img("tangkapan/audit/05-ringkasan-kamar-penuh-mobile.png"), x: 9.4, y: 0.7, w: 2.85, h: 6.17, objectName: "tangkapan-judul", rounding: false, shadow: { type: "outer", color: "000000", opacity: 0.35, blur: 14, offset: 6, angle: 90 } });
  s.addNotes("Perkenalkan produk: Kos Bahagia, website cari kos yang setiap listing-nya disurvei. Presentasi ini berisi hasil uji prototipe, feedback grid, dan iterasi desain.");

  // ============================================================ 2. Masalah
  s = pres.addSlide({ masterName: "KONTEN", sectionTitle: "Pembuka" });
  s.addText("Masalah: harga kos yang diiklankan bukan yang dibayar", { placeholder: "title" });
  kartu(s, 0.6, 1.55, 5.3, 4.9, "kartu-contoh-harga", HEX.kertas, HEX.kertas);
  teks(s, "Contoh hitungan", { x: 1.0, y: 1.85, w: 4.5, h: 0.4, fontSize: 14, bold: true, color: HEX.abu });
  teks(s, "Rp1.200.000", { x: 1.0, y: 2.35, w: 4.5, h: 0.8, fontSize: 40, bold: true, color: HEX.abu, fontFace: "Arial", strike: "sngStrike" });
  teks(s, "sewa yang diiklankan", { x: 1.0, y: 3.15, w: 4.5, h: 0.4, fontSize: 14, color: HEX.abu });
  teks(s, "Rp1.550.000", { x: 1.0, y: 3.8, w: 4.5, h: 0.9, fontSize: 48, bold: true, color: HEX.biruTua, fontFace: "Arial" });
  teks(s, "yang benar-benar dibayar tiap bulan: sewa + listrik + air + sampah + iuran", { x: 1.0, y: 4.7, w: 4.6, h: 0.8, fontSize: 14, color: HEX.arang });
  teks(s, "Tiga hal yang tidak ditampilkan situs kos lain:", { x: 6.5, y: 1.6, w: 6.2, h: 0.4, fontSize: 16, bold: true });
  const tiga = [
    ["LuReceipt", "Total biaya sebenarnya", "Angka besar adalah total per bulan, bukan sewa saja."],
    ["LuSparkles", "Skor kebersihan dan kedap suara", "Diukur di lokasi dengan rubrik tetap dan tes desibel."],
    ["LuNotebookPen", "Catatan surveyor", "Hal bagus, hal yang perlu diketahui, dan peringatan keselamatan."],
  ];
  for (let i = 0; i < 3; i++) {
    const y = 2.25 + i * 1.4;
    await bulatIkon(s, tiga[i][0], 6.5, y, 0.75);
    teks(s, tiga[i][1], { x: 7.5, y: y + 0.02, w: 5.2, h: 0.4, fontSize: 18, bold: true, fontFace: "Arial" });
    teks(s, tiga[i][2], { x: 7.5, y: y + 0.45, w: 5.2, h: 0.6, fontSize: 14, color: HEX.abu });
  }
  s.addNotes("Masalah utama: harga yang diiklankan biasanya sewa saja. Kos Bahagia menampilkan total, skor dari survei, dan catatan surveyor.");

  // ============================================================ 3. Produk
  s = pres.addSlide({ masterName: "KONTEN", sectionTitle: "Pembuka" });
  s.addText("Produk: Kos Bahagia versi 2", { placeholder: "title" });
  s.addImage({ path: img("tangkapan/audit/01-hero-data-asli.png"), x: 5.4, y: 1.45, w: 7.3, h: 4.9, objectName: "tangkapan-beranda", shadow: { type: "outer", color: "1256B8", opacity: 0.18, blur: 10, offset: 3, angle: 90 } });
  const fitur = [
    ["LuSearch", "Cari dekat kampus", "Filter harga total, kebersihan, kedap suara, fasilitas, aturan"],
    ["LuLayoutList", "Detail yang jujur", "Ringkasan, rincian biaya, uang masuk, status per tipe kamar"],
    ["LuArrowRightLeft", "Simpan dan bandingkan", "Tanpa login, per tipe kamar, bisa dibagikan"],
    ["LuMessageCircle", "Chat pemilik", "Pesan WhatsApp otomatis berisi kos, tipe kamar, dan total"],
  ];
  for (let i = 0; i < 4; i++) {
    const y = 1.55 + i * 1.2;
    await bulatIkon(s, fitur[i][0], 0.6, y, 0.62);
    teks(s, fitur[i][1], { x: 1.45, y: y - 0.02, w: 3.7, h: 0.4, fontSize: 17, bold: true, fontFace: "Arial" });
    teks(s, fitur[i][2], { x: 1.45, y: y + 0.38, w: 3.7, h: 0.7, fontSize: 13, color: HEX.abu });
  }
  s.addNotes("Fitur utama versi 2. Data di prototipe adalah data contoh, dan situs menandainya dengan jelas.");

  // ============================================================ 4. Demo
  pres.addSection({ title: "Demo produk" });
  s = pres.addSlide({ masterName: "SEKSI", sectionTitle: "Demo produk" });
  s.addText("01", { placeholder: "nomor" });
  s.addText("Demo produk", { placeholder: "title" });
  s.addText("Dari beranda sampai menghubungi pemilik dalam 4 langkah", { placeholder: "body" });

  s = pres.addSlide({ masterName: "KONTEN", sectionTitle: "Demo produk" });
  s.addText("Alur pengguna: 4 langkah", { placeholder: "title" });
  const langkah = [
    ["Cari", "Pilih kampus atau area, atur filter, urutkan Termurah", "tangkapan/audit/02-termurah-promosi-terpisah.png"],
    ["Pahami", "Ringkasan, pilih tipe kamar, cek biaya dan status", "tangkapan/audit/05-ringkasan-kamar-penuh-mobile.png"],
    ["Bandingkan", "Sampai 3 pilihan, per tipe kamar", "tangkapan/audit/07-banding-ringkas-mobile.png"],
    ["Hubungi", "Chat pemilik dengan pesan siap kirim", "tangkapan/audit/09-kontak-mode-demo-mobile.png"],
  ];
  for (let i = 0; i < 4; i++) {
    const x = 0.6 + i * 3.08;
    kartu(s, x, 1.45, 2.85, 5.35, `langkah-${i + 1}`, HEX.putih);
    s.addShape(pres.shapes.OVAL, { x: x + 0.2, y: 1.65, w: 0.5, h: 0.5, fill: { color: HEX.jingga }, line: { color: HEX.jingga }, objectName: `nomor-${i + 1}` });
    teks(s, String(i + 1), { x: x + 0.2, y: 1.65, w: 0.5, h: 0.5, fontSize: 18, bold: true, align: "center", valign: "middle", color: HEX.arang, fontFace: "Arial" });
    teks(s, langkah[i][0], { x: x + 0.85, y: 1.7, w: 1.85, h: 0.45, fontSize: 18, bold: true, fontFace: "Arial", valign: "middle" });
    teks(s, langkah[i][1], { x: x + 0.2, y: 2.3, w: 2.45, h: 0.75, fontSize: 12, color: HEX.abu });
    s.addImage({ path: img(langkah[i][2]), x: x + 0.2, y: 3.1, w: 2.45, h: 3.5, sizing: { type: "cover", w: 2.45, h: 3.5 }, objectName: `tangkapan-langkah-${i + 1}` });
  }
  s.addNotes("Naskah lengkap demo ada di docs/presentasi-demo.md. Tunjukkan tombol Chat pemilik: di prototipe yang muncul adalah contoh pesan.");

  // ============================================================ Testing
  pres.addSection({ title: "Prototype testing" });
  s = pres.addSlide({ masterName: "SEKSI", sectionTitle: "Prototype testing" });
  s.addText("02", { placeholder: "nomor" });
  s.addText("Prototype testing", { placeholder: "title" });
  s.addText("Kuesioner Google Form, 63 responden, 4–5 Oktober 2026", { placeholder: "body" });

  // Metode
  s = pres.addSlide({ masterName: "KONTEN", sectionTitle: "Prototype testing" });
  s.addText("Metode pengujian", { placeholder: "title" });
  const metode = [["63", "responden"], ["5", "pernyataan Likert 1–5"], ["3", "pertanyaan terbuka"], ["2 hari", "4–5 Oktober 2026"]];
  for (let i = 0; i < 4; i++) {
    const x = 0.6 + (i % 2) * 2.75, y = 1.55 + Math.floor(i / 2) * 2.45;
    kartu(s, x, y, 2.5, 2.2, `metode-${i}`, HEX.kertas, HEX.kertas);
    stat(s, metode[i][0], metode[i][1], x + 0.3, y + 0.3, 2.0, HEX.biruTua, 40);
  }
  teks(s, "Empat pertanyaan wajib dari dosen", { x: 6.4, y: 1.55, w: 6.3, h: 0.4, fontSize: 16, bold: true, fontFace: "Arial" });
  s.addTable([
    [{ text: "Aspek", options: { bold: true, color: HEX.putih, fill: { color: HEX.biruTua } } }, { text: "Di kuesioner", options: { bold: true, color: HEX.putih, fill: { color: HEX.biruTua } } }, { text: "Bentuk", options: { bold: true, color: HEX.putih, fill: { color: HEX.biruTua } } }],
    ["Pengalaman pengguna", "Website ini mudah digunakan", "Likert 1–5"],
    ["Tindakan pengguna", "Ada bagian yang bikin bingung?", "Isian"],
    ["Kegunaan", "Website ini membantu kebutuhan saya", "Likert 1–5"],
    ["Saran", "Apa yang perlu diperbaiki?", "Isian"],
  ], { x: 6.4, y: 2.05, w: 6.3, colW: [1.9, 3.1, 1.3], fontFace: "Calibri", fontSize: 13, color: HEX.arang, border: { type: "solid", pt: 0.75, color: HEX.garis }, rowH: 0.55, valign: "middle", objectName: "tabel-wajib" });
  teks(s, "Analisis: rata-rata, median, persentase setuju (4–5) dan tidak setuju (1–2); jawaban terbuka dikelompokkan per tema.", { x: 6.4, y: 5.25, w: 6.3, h: 0.8, fontSize: 13, color: HEX.abu });
  s.addNotes("Jelaskan instrumen dan bagaimana empat pertanyaan wajib dipetakan ke kuesioner.");

  // Profil
  s = pres.addSlide({ masterName: "KONTEN", sectionTitle: "Prototype testing" });
  s.addText("Siapa respondennya?", { placeholder: "title" });
  stat(s, "70%", "berusia 18–24 tahun", 0.6, 1.5, 3.2);
  stat(s, "43", "mahasiswa (24 pekerja, 4 wirausaha; boleh pilih lebih dari satu)", 0.6, 3.2, 3.2);
  stat(s, "89%", "pernah atau sedang mencari kos", 0.6, 4.9, 3.2, HEX.daun);
  s.addChart(pres.charts.BAR, [{ name: "Responden", labels: ["< 18", "18–24", "25–30", "> 30"], values: [4, 44, 11, 4] }], gayaChart({
    x: 4.1, y: 1.45, w: 4.3, h: 4.9, barDir: "col", chartColors: [HEX.biru], showValue: true, dataLabelPosition: "outEnd", dataLabelColor: HEX.arang, dataLabelFontSize: 12, showLegend: false,
    showTitle: true, title: "Usia (tahun)", titleColor: HEX.arang, titleFontSize: 14, valAxisHidden: true, valGridLine: { style: "none" }, objectName: "chart-usia",
  }));
  s.addChart(pres.charts.DOUGHNUT, [{ name: "Pengalaman", labels: ["Sedang aktif mencari", "Pernah mencari", "Belum pernah"], values: [19, 37, 7] }], gayaChart({
    x: 8.6, y: 1.45, w: 4.1, h: 4.9, chartColors: [HEX.jingga, HEX.biru, "C9D3DF"], holeSize: 55, showPercent: true, showValue: false, dataLabelColor: HEX.putih, dataLabelFontSize: 12,
    showLegend: true, legendPos: "b", legendFontSize: 11, legendColor: HEX.arang, showTitle: true, title: "Pengalaman mencari kos", titleColor: HEX.arang, titleFontSize: 14, objectName: "chart-pengalaman",
  }));
  s.addNotes("Responden didominasi mahasiswa 18–24 tahun yang pernah atau sedang mencari kos, sesuai target pengguna.");

  // Kuantitatif
  s = pres.addSlide({ masterName: "KONTEN", sectionTitle: "Prototype testing" });
  s.addText("Hasil kuantitatif: separuh responden setuju", { placeholder: "title" });
  const item = ["Mudah digunakan (wajib 1)", "Membantu kebutuhan (wajib 3)", "Tampilan menarik dan rapi", "Informasi detail jelas", "Bisa dipakai tanpa bantuan"];
  const dist = [[7, 9, 13, 19, 15], [7, 8, 15, 13, 20], [4, 10, 17, 16, 16], [7, 7, 16, 17, 16], [4, 8, 20, 16, 15]];
  const pct = (k) => dist.map((d) => Math.round((1000 * d[k]) / 63) / 10).reverse();
  const nama = ["1 Sangat tidak setuju", "2", "3", "4", "5 Sangat setuju"];
  s.addChart(pres.charts.BAR, nama.map((n, k) => ({ name: n, labels: [...item].reverse(), values: pct(k) })), gayaChart({
    x: 0.5, y: 1.4, w: 8.4, h: 5.3, barDir: "bar", barGrouping: "stacked", chartColors: ["E57373", "F8C4C4", "D5DEEA", "A9C8F3", "5B9BEA"],
    showValue: true, dataLabelPosition: "ctr", dataLabelFormatCode: '0"%"', dataLabelFontSize: 10, dataLabelColor: HEX.arang,
    showLegend: true, legendPos: "b", legendFontSize: 11, legendColor: HEX.arang, valAxisMaxVal: 100, valAxisHidden: true, valGridLine: { style: "none" }, barGapWidthPct: 45, objectName: "chart-likert",
  }));
  kartu(s, 9.25, 1.5, 3.45, 1.6, "kartu-wajib1", HEX.kertas, HEX.kertas);
  stat(s, "3,41", "Mudah digunakan: 54% setuju, 25% tidak", 9.5, 1.5, 3.0, HEX.biruTua, 36);
  kartu(s, 9.25, 3.3, 3.45, 1.6, "kartu-wajib3", HEX.kertas, HEX.kertas);
  stat(s, "3,49", "Membantu kebutuhan: 52% setuju, 24% tidak", 9.5, 3.3, 3.0, HEX.biruTua, 36);
  kartu(s, 9.25, 5.1, 3.45, 1.6, "kartu-gabungan", HEX.kertas, HEX.kertas);
  stat(s, "3,46", "Rata-rata gabungan 5 pernyataan (skala 1–5)", 9.5, 5.1, 3.0, HEX.jingga, 36);
  s.addNotes("Semua pernyataan sedikit di atas netral. Nilai tertinggi: membantu kebutuhan (32% sangat setuju). 'Tanpa bantuan' punya porsi netral terbesar.");

  // Kelompok
  s = pres.addSlide({ masterName: "KONTEN", sectionTitle: "Prototype testing" });
  s.addText("Mahasiswa menilai lebih tinggi daripada pekerja", { placeholder: "title" });
  s.addChart(pres.charts.BAR, [{ name: "Rata-rata", labels: ["Mahasiswa saja (n=35)", "Bekerja / wirausaha (n=28)", "Sedang aktif mencari (n=19)", "Pernah mencari (n=37)", "Belum pernah mencari (n=7)"].reverse(), values: [3.90, 2.91, 3.56, 3.54, 2.77].reverse() }], gayaChart({
    x: 0.5, y: 1.45, w: 7.6, h: 5.2, barDir: "bar", chartColors: [HEX.biru], showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0.00", dataLabelFontSize: 12, dataLabelColor: HEX.arang,
    valAxisMinVal: 1, valAxisMaxVal: 5, valAxisMajorUnit: 1, showLegend: false, barGapWidthPct: 50, objectName: "chart-kelompok",
  }));
  kartu(s, 8.5, 1.5, 4.2, 5.1, "kartu-temuan-kelompok", HEX.kertas, HEX.kertas);
  stat(s, "3,90 vs 2,91", "rata-rata mahasiswa vs responden yang bekerja", 8.8, 1.65, 3.7, HEX.biruTua, 34);
  teks(s, [
    { text: "Kelompok bekerja paling banyak menanyakan dasar perhitungan skor dan biaya.", options: { bullet: true, breakLine: true } },
    { text: "Mereka butuh alasan di balik angka sebelum percaya.", options: { bullet: true, breakLine: true } },
    { text: "Yang belum pernah cari kos (n=7) juga lebih rendah: belum punya pembanding.", options: { bullet: true } },
  ], { x: 8.8, y: 3.45, w: 3.7, h: 3.0, fontSize: 14, paraSpaceAfter: 8 });
  s.addNotes("Temuan menarik untuk diskusi: perbedaan penilaian mahasiswa dan pekerja.");

  // Wajib 2
  s = pres.addSlide({ masterName: "KONTEN", sectionTitle: "Prototype testing" });
  s.addText("Bagian yang membingungkan (pertanyaan wajib 2)", { placeholder: "title" });
  stat(s, "63%", "menyebut setidaknya satu hal yang bikin ragu atau bingung", 0.6, 1.5, 3.3, HEX.jingga, 54);
  stat(s, "27%", "tidak menemui kendala", 0.6, 3.35, 3.3, HEX.daun, 40);
  kartu(s, 0.6, 4.85, 3.3, 1.8, "kartu-kutipan-bingung", HEX.kertas, HEX.kertas);
  teks(s, "“Ngga tau mana yang harus diklik buat masukin ke list buat dibandingin, ternyata pake button yang semacam panah.”", { x: 0.8, y: 5.0, w: 2.95, h: 1.55, fontSize: 12, italic: true, color: HEX.arang });
  const bingung = [["Sulit menilai kecocokan dari info ringkas", 7], ["Rincian biaya, fasilitas, jarak dibaca ulang", 7], ["Alur filter dan pencarian", 6], ["Informasi terlalu padat", 5], ["Alur simpan dan bandingkan", 4], ["Perlu panduan saat pertama", 4], ["Label tombol perlu dibaca dulu", 3], ["Data contoh vs data asli", 2], ["Menu navigasi / loading", 2]];
  s.addChart(pres.charts.BAR, [{ name: "Responden", labels: bingung.map((b) => b[0]).reverse(), values: bingung.map((b) => b[1]).reverse() }], gayaChart({
    x: 4.2, y: 1.4, w: 8.6, h: 5.35, barDir: "bar", chartColors: [HEX.biru], showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 12, dataLabelColor: HEX.arang,
    valAxisHidden: true, valGridLine: { style: "none" }, showLegend: false, barGapWidthPct: 40, catAxisLabelFontSize: 12, objectName: "chart-bingung",
  }));
  s.addNotes("40 dari 63 responden menyebut kebingungan. Tema teratas: menilai kecocokan dari info ringkas dan rincian biaya/fasilitas.");

  // Wajib 4 + disukai
  s = pres.addSlide({ masterName: "KONTEN", sectionTitle: "Prototype testing" });
  s.addText("Yang perlu diperbaiki vs yang paling disukai", { placeholder: "title" });
  const baiki = [["Jelaskan skor, estimasi biaya, jarak", 9], ["Tata letak lebih lega dan rapi", 7], ["Simpan/banding lebih mudah dikenali", 7], ["Fitur baru (review, kontak, dll.)", 7], ["Info lingkungan sekitar", 5], ["Bantuan saat mencari", 5], ["Harga dan lokasi lebih menonjol", 4], ["Status kamar dan pembaruan", 3]];
  const suka = [["Simpan dan bandingkan", 10], ["Kartu kos (foto + ringkasan)", 8], ["Desain simpel dan rapi", 8], ["Informasi lengkap", 7], ["Total biaya dan rinciannya", 6], ["Semua info dalam satu tempat", 5], ["Pencarian dan filter", 4], ["Mudah digunakan", 3]];
  teks(s, "Perlu diperbaiki (wajib 4)", { x: 0.6, y: 1.45, w: 6, h: 0.4, fontSize: 16, bold: true, fontFace: "Arial", color: HEX.jingga });
  s.addChart(pres.charts.BAR, [{ name: "Responden", labels: baiki.map((b) => b[0]).reverse(), values: baiki.map((b) => b[1]).reverse() }], gayaChart({
    x: 0.4, y: 1.9, w: 6.2, h: 4.9, barDir: "bar", chartColors: [HEX.jingga], showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 11, dataLabelColor: HEX.arang,
    valAxisHidden: true, valGridLine: { style: "none" }, showLegend: false, barGapWidthPct: 40, catAxisLabelFontSize: 11, objectName: "chart-perbaiki",
  }));
  teks(s, "Paling disukai", { x: 6.9, y: 1.45, w: 6, h: 0.4, fontSize: 16, bold: true, fontFace: "Arial", color: HEX.daun });
  s.addChart(pres.charts.BAR, [{ name: "Responden", labels: suka.map((b) => b[0]).reverse(), values: suka.map((b) => b[1]).reverse() }], gayaChart({
    x: 6.7, y: 1.9, w: 6.2, h: 4.9, barDir: "bar", chartColors: [HEX.daun], showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 11, dataLabelColor: HEX.arang,
    valAxisHidden: true, valGridLine: { style: "none" }, showLegend: false, barGapWidthPct: 40, catAxisLabelFontSize: 11, objectName: "chart-suka",
  }));
  s.addNotes("Catatan penting: sebagian permintaan (saran filter, penjelasan skor, status kamar) sebenarnya sudah ada. Masalahnya visibilitas.");

  // ============================================================ Grid
  pres.addSection({ title: "Feedback Capture Grid" });
  s = pres.addSlide({ masterName: "SEKSI", sectionTitle: "Feedback Capture Grid" });
  s.addText("03", { placeholder: "nomor" });
  s.addText("Feedback Capture Grid", { placeholder: "title" });
  s.addText("Disukai, kritik, pertanyaan, dan ide dari pengguna", { placeholder: "body" });

  const grid = async (judul, sumber, isi, namaGrid) => {
    const g = pres.addSlide({ masterName: "KONTEN", sectionTitle: "Feedback Capture Grid" });
    g.addText(judul, { placeholder: "title" });
    teks(g, sumber, { x: 0.6, y: 1.15, w: 12, h: 0.35, fontSize: 12, color: HEX.abu });
    const kotak = [
      ["LuThumbsUp", "Yang disukai", HEX.daun, "E3F5EC"],
      ["LuThumbsDown", "Kritik", HEX.merah, "FCE6E6"],
      ["LuCircleHelp", "Pertanyaan", HEX.biruTua, HEX.biruMuda],
      ["LuLightbulb", "Ide", "B45309", "FFF0E0"],
    ];
    for (let i = 0; i < 4; i++) {
      const x = 0.6 + (i % 2) * 6.15, y = 1.6 + Math.floor(i / 2) * 2.7;
      kartu(g, x, y, 5.95, 2.5, `${namaGrid}-${i}`, kotak[i][3], kotak[i][3]);
      await bulatIkon(g, kotak[i][0], x + 0.25, y + 0.22, 0.55, HEX.putih, kotak[i][2]);
      teks(g, kotak[i][1], { x: x + 0.95, y: y + 0.27, w: 4.8, h: 0.45, fontSize: 17, bold: true, color: kotak[i][2], fontFace: "Arial", valign: "middle" });
      teks(g, isi[i].map((t, k) => ({ text: t, options: { bullet: true, breakLine: k < isi[i].length - 1 } })), { x: x + 0.3, y: y + 0.85, w: 5.4, h: 1.55, fontSize: 12.5, paraSpaceAfter: 3 });
    }
    return g;
  };
  s = await grid("Grid versi 1: hasil uji prototipe awal (audit)", "Sumber: pengujian versi 1 dengan skenario tugas (cari, detail, pilih kamar, banding, filter, keyboard)", [
    ["Total biaya per bulan sebagai angka utama", "Skor kebersihan dan kedap suara", "Catatan surveyor", "Saran saat hasil kosong; simpan dan banding tanpa login"],
    ["Hero beranda tidak sama dengan halaman kos (8,1 vs 6,9)", "Kamar AC penuh tampak tersedia", "\"Termurah\" didahului kos berbayar", "Banding kembali ke kamar standar"],
    ["Kartu di beranda itu kos sungguhan?", "Label \"Mitra\" artinya berbayar?", "Berapa uang yang disiapkan saat masuk?", "Kos campur berarti boleh bawa pasangan?"],
    ["Ringkasan keputusan di atas halaman kos", "Hitungan uang masuk (bayar di muka + deposit)", "Promosi berbayar dipisah", "Tombol \"Tanya kapan tersedia\" saat penuh"],
  ], "grid1");
  s.addNotes("Grid versi 1 dari audit. Masalah terbesar: kepercayaan pada data.");
  s = await grid("Grid versi 2: hasil kuesioner (63 responden)", "Sumber: Google Form setelah responden mencoba versi 2; angka dalam kurung = jumlah responden", [
    ["Simpan dan bandingkan (10)", "Kartu kos foto + ringkasan (8)", "Desain simpel dan rapi (8)", "Informasi lengkap (7); total biaya (6)"],
    ["Sulit menilai kecocokan dari info ringkas (7)", "Rincian biaya dan fasilitas dibaca ulang (7)", "Alur filter; bug chip kamar mandi dalam (6)", "Terlalu banyak tulisan di HP (5)"],
    ["Skor kebersihan dinilai dengan cara apa?", "Estimasi total bulanan dari mana?", "Fasilitas kamar vs fasilitas bersama?", "Kos sudah tersimpan atau belum?"],
    ["Penjelasan skor, biaya, jarak di tempatnya (9)", "Tata letak lebih lega (7)", "Label teks \"Simpan\" / \"Bandingkan\" (7)", "Info sekitar lebih rinci (5)"],
  ], "grid2");
  s.addNotes("Masalah konsistensi data dari versi 1 tidak muncul lagi. Yang muncul sekarang: kejelasan dan kepadatan tampilan.");

  // ============================================================ Iterasi
  pres.addSection({ title: "Iterasi desain" });
  s = pres.addSlide({ masterName: "SEKSI", sectionTitle: "Iterasi desain" });
  s.addText("04", { placeholder: "nomor" });
  s.addText("Iterasi desain", { placeholder: "title" });
  s.addText("Dari feedback ke perubahan nyata: versi 1 → versi 2 → rencana versi 3", { placeholder: "body" });

  s = pres.addSlide({ masterName: "KONTEN", sectionTitle: "Iterasi desain" });
  s.addText("Prioritas perbaikan versi 1 → versi 2", { placeholder: "title" });
  const hdr = (t) => ({ text: t, options: { bold: true, color: HEX.putih, fill: { color: HEX.biruTua } } });
  s.addTable([
    [hdr("#"), hdr("Masalah di versi 1"), hdr("Perubahan di versi 2"), hdr("Alasan")],
    ["1", "Data tidak konsisten antar halaman", "Semua halaman memakai satu sumber data; hero dari kos sungguhan", "Merusak kepercayaan"],
    ["2", "Kamar penuh tampak tersedia", "Status per tipe kamar + tombol \"Tanya kapan tersedia\"", "Salah hubungi pemilik"],
    ["3", "Banding kehilangan tipe kamar", "Banding per kos + tipe kamar, bertahan saat reload dan dibagikan", "Perbandingan jadi salah"],
    ["4", "\"Termurah\" didahului kos berbayar", "Urutan murni; promosi di blok terpisah berlabel", "Terkesan menipu"],
    ["5", "Pengguna menghitung biaya sendiri", "Jenis tiap biaya + \"uang yang perlu disiapkan untuk masuk\"", "Biaya jadi jelas"],
    ["6", "Rentang harga terbalik = \"0 kos\"", "Pesan error di bawah kolom, angka tetap", "Membingungkan"],
  ], { x: 0.6, y: 1.5, w: 12.1, colW: [0.5, 3.4, 5.5, 2.7], fontFace: "Calibri", fontSize: 13, color: HEX.arang, border: { type: "solid", pt: 0.75, color: HEX.garis }, rowH: 0.62, valign: "middle", objectName: "tabel-prioritas" });
  s.addNotes("Prioritas berdasarkan dampak ke keputusan pengguna dan seberapa sering terjadi.");

  s = pres.addSlide({ masterName: "KONTEN", sectionTitle: "Iterasi desain" });
  s.addText("Sebelum dan sesudah: beranda", { placeholder: "title" });
  const pasang = [["Versi 1", "Kartu contoh dengan angka statis yang tidak cocok dengan listing", "tangkapan/beranda.png", HEX.merah], ["Versi 2", "Kartu diambil dari kos sungguhan, berlabel \"Contoh tampilan dari data demo\"", "tangkapan/audit/01-hero-data-asli.png", HEX.daun]];
  for (let i = 0; i < 2; i++) {
    const x = 0.6 + i * 6.15;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.45, w: 1.35, h: 0.42, rectRadius: 0.2, fill: { color: pasang[i][3] }, line: { color: pasang[i][3] }, objectName: `label-versi-${i + 1}` });
    teks(s, pasang[i][0], { x, y: 1.45, w: 1.35, h: 0.42, fontSize: 14, bold: true, color: HEX.putih, align: "center", valign: "middle" });
    teks(s, pasang[i][1], { x: x + 1.5, y: 1.45, w: 4.45, h: 0.6, fontSize: 13, color: HEX.abu, valign: "middle" });
    s.addImage({ path: img(pasang[i][2]), x, y: 2.25, w: 5.95, h: 4.0, sizing: { type: "cover", w: 5.95, h: 4.0 }, objectName: `tangkapan-versi-${i + 1}`, shadow: { type: "outer", color: "1256B8", opacity: 0.15, blur: 8, offset: 2, angle: 90 } });
  }
  s.addNotes("Contoh paling jelas dari iterasi: hero sekarang konsisten dengan data listing.");

  s = pres.addSlide({ masterName: "KONTEN", sectionTitle: "Iterasi desain" });
  s.addText("Versi 2: fitur baru dari feedback", { placeholder: "title" });
  const tiga2 = [
    ["tangkapan/audit/05-ringkasan-kamar-penuh-mobile.png", "Ringkasan + status per tipe kamar", "Kamar AC penuh tertulis Penuh; tombol jadi \"Tanya kapan tersedia\""],
    ["tangkapan/audit/06-uang-masuk-mobile.png", "Uang yang perlu disiapkan", "Bayar di muka + deposit, masing-masing dihitung sekali"],
    ["tangkapan/audit/08-validasi-harga-mobile.png", "Validasi filter harga", "Minimal > maksimal dijelaskan, bukan \"0 kos\""],
  ];
  for (let i = 0; i < 3; i++) {
    const x = 0.6 + i * 4.1;
    s.addImage({ path: img(tiga2[i][0]), x, y: 1.45, w: 1.95, h: 4.2, sizing: { type: "cover", w: 1.95, h: 4.2 }, objectName: `tangkapan-fitur-${i + 1}`, shadow: { type: "outer", color: "1256B8", opacity: 0.18, blur: 8, offset: 2, angle: 90 } });
    teks(s, tiga2[i][1], { x: x + 2.15, y: 1.55, w: 1.7, h: 1.3, fontSize: 16, bold: true, fontFace: "Arial" });
    teks(s, tiga2[i][2], { x: x + 2.15, y: 2.75, w: 1.7, h: 2.6, fontSize: 13, color: HEX.abu });
  }
  teks(s, "Juga: urutan Termurah murni + blok \"Promosi berbayar\", banding per tipe kamar, label ilustrasi dan data contoh, fokus keyboard kembali ke tombol pembuka.", { x: 0.6, y: 5.95, w: 12.1, h: 0.7, fontSize: 13, color: HEX.arang });
  s.addNotes("Tunjukkan tiga perubahan yang paling terasa di HP.");

  s = pres.addSlide({ masterName: "KONTEN", sectionTitle: "Iterasi desain" });
  s.addText("Bukti: versi 2 lebih baik", { placeholder: "title" });
  const bukti = [["18/18", "skenario uji browser lulus di situs live", HEX.daun, "LuListChecks"], ["89 → 95", "skor performa Lighthouse halaman detail", HEX.biruTua, "LuGauge"], ["3,78 → 2,91 s", "waktu tampil gambar utama (LCP) detail", HEX.biruTua, "LuTimer"], ["0", "pelanggaran aksesibilitas (axe)", HEX.daun, "LuAccessibility"]];
  for (let i = 0; i < 4; i++) {
    const x = 0.6 + i * 3.08;
    kartu(s, x, 1.6, 2.85, 3.3, `bukti-${i}`, HEX.kertas, HEX.kertas);
    await bulatIkon(s, bukti[i][3], x + 0.3, 1.85, 0.6, HEX.putih, bukti[i][2]);
    stat(s, bukti[i][0], bukti[i][1], x + 0.3, 2.6, 2.4, bukti[i][2], bukti[i][0].length > 8 ? 26 : 36);
  }
  teks(s, "Pengujian otomatis: 78 unit test, 109 tes database, 18 pemeriksaan browser. Lighthouse diukur di lab (simulasi HP), bukan data pengguna nyata.", { x: 0.6, y: 5.3, w: 12.1, h: 0.8, fontSize: 13, color: HEX.abu });
  s.addNotes("Angka sebelum vs sesudah dan cara pengujiannya.");

  s = pres.addSlide({ masterName: "KONTEN", sectionTitle: "Iterasi desain" });
  s.addText("Rencana versi 3 (dari hasil kuesioner)", { placeholder: "title" });
  const rencana = [
    ["Label teks \"Simpan\" / \"Bandingkan\" + tautan di header", "11 jawaban"],
    ["Penjelasan singkat di samping skor, biaya, dan jarak", "16 jawaban"],
    ["Tampilan lebih lega: harga, lokasi, status dulu", "12 jawaban"],
    ["Perbaiki filter: chip kamar mandi dalam, tipe kos multi-pilih", "bug + 11 jawaban"],
    ["Panduan singkat untuk pengguna baru", "4 jawaban"],
    ["Info sekitar lebih rinci + menu navigasi", "6 jawaban"],
  ];
  for (let i = 0; i < 6; i++) {
    const x = 0.6 + (i % 2) * 6.15, y = 1.5 + Math.floor(i / 2) * 1.75;
    kartu(s, x, y, 5.95, 1.5, `rencana-${i}`, HEX.putih);
    s.addShape(pres.shapes.OVAL, { x: x + 0.25, y: y + 0.4, w: 0.7, h: 0.7, fill: { color: i < 2 ? HEX.jingga : HEX.biruMuda }, line: { color: i < 2 ? HEX.jingga : HEX.biruMuda }, objectName: `rencana-nomor-${i}` });
    teks(s, String(i + 1), { x: x + 0.25, y: y + 0.4, w: 0.7, h: 0.7, fontSize: 20, bold: true, align: "center", valign: "middle", fontFace: "Arial", color: i < 2 ? HEX.arang : HEX.biruTua });
    teks(s, rencana[i][0], { x: x + 1.15, y: y + 0.25, w: 4.6, h: 0.75, fontSize: 15, bold: true, fontFace: "Arial", valign: "middle" });
    teks(s, rencana[i][1], { x: x + 1.15, y: y + 1.0, w: 4.6, h: 0.35, fontSize: 12, color: HEX.abu });
  }
  s.addNotes("Urutan berdasarkan jumlah responden yang menyebut masalahnya.");

  // ============================================================ Penutup
  pres.addSection({ title: "Penutup" });
  s = pres.addSlide({ masterName: "PENUTUP", sectionTitle: "Penutup" });
  s.addText("Kesimpulan", { placeholder: "title" });
  const simpul = [
    ["LuTarget", "Konsep diterima", "Pengguna menyukai total biaya, simpan dan banding, serta informasi yang lengkap."],
    ["LuTriangleAlert", "Kejelasan masih kurang", "Skor, estimasi biaya, dan jarak perlu dijelaskan di tempatnya; tampilan perlu lebih lega."],
    ["LuRocket", "Iterasi berlanjut", "Versi 2 sudah memperbaiki kepercayaan data; versi 3 fokus pada kejelasan."],
  ];
  for (let i = 0; i < 3; i++) {
    const x = 0.8 + i * 4.0;
    await bulatIkon(s, simpul[i][0], x, 2.0, 0.8, HEX.biruTua, HEX.putih);
    teks(s, simpul[i][1], { x, y: 3.0, w: 3.6, h: 0.5, fontSize: 20, bold: true, color: HEX.putih, fontFace: "Arial" });
    teks(s, simpul[i][2], { x, y: 3.55, w: 3.6, h: 1.5, fontSize: 15, color: "C9D3DF" });
  }
  teks(s, "Terima kasih", { x: 0.8, y: 5.6, w: 6, h: 0.7, fontSize: 32, bold: true, color: HEX.jingga, fontFace: "Arial" });
  teks(s, "kos-bahagia-umber.vercel.app", { x: 0.8, y: 6.3, w: 6, h: 0.4, fontSize: 16, color: HEX.biruMuda });
  s.addNotes("Tutup dengan tiga kesimpulan, lalu buka sesi tanya jawab.");

  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("ok", OUT);
})().catch((e) => { console.error(e); process.exit(1); });
