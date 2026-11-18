# Indonesia’s NEET Youth

**Indonesia’s NEET Conditions** adalah dashboard interaktif dua halaman untuk pemuda usia 15–24 tahun, menggunakan CSV lokal 2021–2025. Dibangun dengan React, TypeScript, Vite, ECharts, dan Lucide. Tidak membutuhkan API key, database, backend, atau file `.env`.

## Memperbarui repo GitHub yang sudah ada

Repo tujuan: https://github.com/juijey819/NEETDash. Panduan lengkap ada di [PUSH_TO_GITHUB.md](PUSH_TO_GITHUB.md). Buka clone repo lama, tarik commit remote, ganti source aplikasi dengan isi ZIP, jalankan pemeriksaan, kemudian commit dan `git push`. Pertahankan `.git` dari clone agar riwayat commit tetap tersambung.

## Menjalankan

Gunakan Node.js 22 atau lebih baru dan npm. Versi dependensi dikunci dalam `package-lock.json`.

```bash
npm ci
npm run dev
```

Buka alamat Vite yang muncul di terminal. Instalasi pertama membutuhkan internet; semua data dan aset runtime disimpan di proyek.

```bash
npm run build
npm run preview
```

Build produksi berada di `dist/`. Navigasi memakai `#national` dan `#regional`.

## Isi dashboard

**National Overview:** NEET rate, jumlah NEET, populasi pemuda, serta Gender NEET Gap menggantikan jumlah provinsi di atas angka nasional. Grafik mencakup tren, peta provinsi, perbandingan gender dan tempat tinggal, serta NEET by Last Completed Education. Filter provinsi menyorot peta dan menambahkan temuan wilayah ke kandidat insight; KPI dan grafik lainnya tetap nasional.

**Regional Intelligence:** KPI wilayah dengan perubahan terhadap tahun sebelumnya yang sebanding, kartu Trend dan Decomposition yang terpisah, kartu Risk Factors dan Reasons yang terpisah, sektor pekerjaan beserta Employment Quality, serta simulator. Empat kartu diagnosis mempunyai ukuran yang sama pada setiap ukuran layar. Input simulator memenuhi area atas kartu; Scenario Outcome sejajar dengan footer Employment Quality. Ponsel menumpuk kartu secara vertikal.

**Key Insights** pada kedua halaman menampilkan konteks wilayah/tahun dan satu paragraf rata kanan-kiri. Angka besar beserta label/delta dan kotak tindak lanjut telah dihapus sesuai anotasi terbaru. Hanya satu info tetap berada pada judul bagian.

- Paragraf 1–2 kalimat, 30–45 kata dan maksimal tiga angka. Setiap kalimat membawa fakta konkret; kalimat kedua bukan saran.
- Perubahan tahunan ditulis dengan angka, termasuk perubahan kecil. Provinsi selalu dibandingkan dengan nasional bila gap tersedia.
- Fakta kedua mengikuti prioritas: alasan inactive atau gap gender yang besar, model valid dalam cakupannya, informalitas, sektor, lalu what-if. Tidak ada fallback nasional yang menyamar sebagai temuan provinsi.
- Uji memastikan seluruh 183 kombinasi wilayah/tahun menghasilkan paragraf berbeda pada setiap halaman, dengan bukti yang cocok dengan CSV.
- Kontrak JSON tujuh field tetap tersedia secara internal. Field highlight dan next_step tidak dirender di panel. Catatan sumber, data sintetis dan batas model tetap berada di info judul.

Lihat [kontrak panel](docs/INSIGHT_PANEL.md), [logika analisis](docs/INSIGHT_LOGIC.md), dan [catatan QA](docs/QA.md).

## Struktur source

| Lokasi | Fungsi |
| --- | --- |
| `src/App.tsx` | Halaman, filter, KPI, sidebar, simulator |
| `src/insight-panel.ts` | Penyusunan fakta per wilayah/tahun dan paragraf Key Insights |
| `src/analysis.ts` | Kandidat insight, baseline, pemeringkatan, rekomendasi, bukti CSV |
| `src/Info.tsx` | Dialog informasi dengan posisi sesuai viewport dan akses keyboard |
| `src/charts.tsx` | Seluruh visualisasi ECharts |
| `src/data.ts` | Parser, loader, selector, perhitungan skenario |
| `src/chart-info.ts`, `src/kpi-info.ts` | Definisi KPI dan panduan grafik |
| `src/styles.css`, `src/revisions.css` | Styling dan revisi anotasi |
| `src/data.test.ts` | 37 pengujian data dan logika insight |
| `scripts/check-data.ts` | Audit rekonsiliasi dan hash data mentah |
| `scripts/raw-data-sha256.json` | SHA-256 dari 20 CSV input sebelum revisi |
| `public/data/` | CSV serta metadata sumber |
| `public/geo/` | Geometri 34 dan 38 provinsi |
| `public/fonts/`, `public/icons/` | Aset lokal |
| `qa.html`, `qa-loading.html` | Harness pemeriksaan development |
| `docs/original-brief/`, `reference/` | Arsip brief dan referensi awal |

## Data dan interpretasi

Rate NEET nasional dan provinsi bersumber dari ekstrak BPS yang disertakan. Count nasional resmi tersedia pada 2023–2025; count 2021–2022 pada halaman nasional tidak diimputasi. Count provinsi dan diagnostik regional—status, alasan, sektor, kualitas, serta Risk Factors—merupakan ilustrasi sintetis dari paket sumber. AOR tidak diestimasi dari microdata. Mesin narasi memeriksa konsistensi terhadap CSV, bukan membuktikan bahwa diagnostik sintetis merupakan observasi resmi.

Distribusi inactive 2025 memakai proporsi yang sama antarwilayah. Pemeringkatan headcount menghitung orang dalam kategori hambatan, bukan mengestimasi dampak intervensi. Metadata terperinci tersedia dalam `public/data/meta/source_lineage.csv` dan `data_dictionary.csv`.

Peta memakai 34 provinsi pada 2021–2023 dan 38 provinsi pada 2024–2025. Perbandingan Papua yang batas wilayahnya berubah tidak diperlakukan sebagai seri yang sebanding. Jam kerja 0–34 jam tidak otomatis berarti setengah menganggur; median penghasilan mencakup wage employees.

Simulator menghitung:

```text
orang_dijangkau = jumlah_NEET × coverage / 100
transisi = orang_dijangkau × success_rate / 100
jumlah_setelah = jumlah_NEET − transisi
rate_setelah = rate_NEET_awal × (1 − coverage × success_rate / 10000)
```

Rate awal memakai angka publikasi untuk mempertahankan baseline ketika coverage nol. Count dan rate dapat mempunyai perbedaan pembulatan dalam paket sumber. Simulator merupakan aritmetika, bukan estimasi dampak kausal.

## Validasi

```bash
npm run lint
npm run typecheck
npm test
npm run check:data
npm run build
```

Tiga puluh tujuh tes mencakup seluruh 183 snapshot wilayah–tahun, kesesuaian bukti dengan CSV, konsistensi baseline, ambang 0,5 poin, perubahan urutan rekomendasi ketika headcount diubah, kecocokan tindakan dengan kategori hambatan, progres KPI regional, cakupan empat segmen pada detail, ringkasan skenario interaktif, kontrak JSON panel, batas 30–45 kata, spesifisitas tiap kalimat, bukti CSV, null, ambang tone, benchmark provinsi, cakupan fakta dan skenario yang merespons data/filter, serta batas simulator. Audit memeriksa 178 baris provinsi resmi, 915 aliran Sankey, 183 total sektor, 366 distribusi alasan, serta SHA-256 seluruh 20 CSV. Semua input mentah dipertahankan.

Pemeriksaan browser dilakukan pada 1212×678, 1593 piksel, 1920×1080, dan 390×844. Catatan detail ada dalam `docs/QA.md`.

## Push dan hosting sendiri

Untuk memperbarui repo **NEETDash yang sudah ada**, ikuti [PUSH_TO_GITHUB.md](PUSH_TO_GITHUB.md). Gunakan clone repo tersebut, salin source terbaru ke root repo, kemudian:

```bash
git add -A
git commit -m "Update dashboard and data-driven Key Insights"
git push
```

Paket ini tidak membawa riwayat Git atau binding akun hosting asal. Riwayat Git dipertahankan oleh folder `.git` pada clone repo tujuan. Konfigurasi deployment akun lain perlu tetap menggunakan konfigurasi milikmu.

| Pengaturan hosting statis | Nilai |
| --- | --- |
| Install | `npm ci` |
| Build | `npm run build` |
| Publish directory | `dist` |
| Environment variables | Tidak diperlukan |

Aset memakai path root seperti `/data/`. Hosting pada subfolder memerlukan penyesuaian base path. Jangan masukkan `node_modules/`, `dist/`, kredensial, atau file environment privat ke repository.
