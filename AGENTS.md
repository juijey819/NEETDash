# Panduan pengembangan — Indonesia’s NEET Youth

Paket ini adalah ekspor versi dashboard yang sudah direvisi. README dan implementasi sekarang menjadi acuan. Brief di `docs/original-brief/` serta gambar di `reference/` adalah arsip dan tidak menggantikan keputusan tampilan terbaru.

## Struktur dan aturan utama

- Pertahankan React, TypeScript, Vite, ECharts, dan Lucide yang sudah digunakan.
- Aplikasi statis tanpa backend, database, API key, atau fetch data pihak ketiga saat runtime.
- Gunakan CSV lokal di `public/data/` dan GeoJSON lokal di `public/geo/`. Pertahankan file data mentah dan stable province keys.
- Header: Indonesia’s NEET Youth, subtitle Indonesia’s NEET Conditions. Kedua halaman memakai Year dan Province saja.
- National Overview tetap nasional kecuali highlight peta dan konteks provinsi pada insight. Regional Intelligence memakai geografi/tahun yang dipilih.
- Ada empat KPI di masing-masing halaman. KPI menyebut wilayah/tahun, sedangkan info KPI berisi definisi. KPI regional menampilkan delta vs tahun sebelumnya yang batas wilayahnya sebanding; tanpa pembanding tampilkan status netral. NEET yang turun dan employment yang naik berwarna hijau, arah sebaliknya merah; perubahan inactive share tetap netral karena merupakan komposisi.
- Catatan sumber, status sintetis/ilustratif, asumsi bersama, serta keterbatasan model/simulator hanya ditampilkan dalam info di dekat Key Insights.
- Model exclusion hanya referensi nasional 2025. Jangan merekayasa model provinsi atau menyiratkan model ikut diestimasi ulang oleh filter.
- Kedua sidebar berjudul Key Insights. Tampilkan konteks dan satu paragraf rata kanan-kiri saja; angka besar, label/delta highlight dan kotak tindak lanjut sudah dihapus sesuai anotasi. Jangan tampilkan kembali field highlight/next_step walau kontrak JSON internal tetap tujuh field. Paragraf 1–2 kalimat, 30–45 kata, maksimal tiga angka; setiap kalimat harus mengandung fakta dari wilayah/tahun aktif. Sebut angka perubahan termasuk yang di bawah 0,5 poin, tanpa little changed atau saran generik. Prioritaskan posisi provinsi terhadap nasional, lalu satu fakta alasan inactive/gap gender >10 poin, model valid dalam cakupannya, informalitas, sektor atau skenario. Tanpa diagnostik lokal, gunakan satu kalimat dan jangan mengganti dengan referensi nasional. Hanya satu info di judul. Sumber/placeholder tetap di info. Gunakan buildInsightPanelInput dan generateInsightPanel; detail di docs/INSIGHT_PANEL.md.
- Label line chart hanya untuk tahun terpilih. Hindari overlap dengan sumbu, terutama tahun 2021 dan 2025.
- Pertahankan palet hijau–merah muda. Perubahan NEET yang membaik hijau, yang memburuk merah. Perubahan populasi tetap konteks netral. Semua line chart memakai garis solid dan penanda lingkaran. Male abu-abu, Female merah muda, Urban hijau tua, Rural hijau muda. Label langsung menyebut nama dan angka; hapus legend bawah.
- Header chart polos dengan ikon kecil, tanpa kotak mint atau penomoran. Trend/Decomposition dan Risk Factors/Reasons masing-masing kartu terpisah dengan tinggi yang sama. KPI nasional keempat adalah Gender NEET Gap.
- Panel labour dan simulator sama besar pada desktop, dengan footer hasil sama tinggi dan sejajar. Coverage memakai semua NEET sebagai denominator, success memakai orang yang dijangkau. Tampilkan jumlah orang yang dijangkau dan hasil simulasi yang saling terhubung.
- Loading hanya berisi Loading dashboard dan spinner. Tidak ada footer.

## Kejujuran data

Rate BPS berbeda dari diagnostik sintetis. Count nasional resmi hanya tersedia 2023–2025. Seluruh count provinsi serta diagnostik regional bukan observasi BPS. AOR tidak fitted dari microdata, skenario bukan forecast atau causal estimate. Baca bagian status data di README sebelum menambah interpretasi.

Jangan menyambung Papua historis dengan Papua setelah pemekaran. Jangan menambahkan atau merata-ratakan subgroup rates tanpa denominator yang tepat.

## Validasi sebelum menyelesaikan perubahan

Jalankan lint, typecheck, unit tests, data audit, dan build. Untuk perubahan tampilan, cek layar 1212×678, 1920×1080, dan lebar ponsel. `qa.html` dan `qa-loading.html` tersedia untuk development. Jangan menambahkan waktu tunggu buatan hanya untuk memperlihatkan loading.

Paket ekspor ini portabel dan tidak menyertakan binding akun hosting maupun folder .git. Repo tujuan pengguna adalah https://github.com/juijey819/NEETDash. Untuk update repo yang sudah ada, pertahankan riwayat Git pada clone tujuan dan ikuti PUSH_TO_GITHUB.md. Jangan membuat ulang repo atau melakukan force push. Status data dan catatan sumber harus tetap dijaga.
