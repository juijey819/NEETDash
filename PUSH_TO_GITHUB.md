# Memperbarui repo juijey819/NEETDash

Paket ini berisi source terbaru dari dashboard yang terakhir direvisi. Gunakan repo yang sudah ada: https://github.com/juijey819/NEETDash. Source aplikasi, data, font, ikon, peta, tes, dan dokumentasi sudah disertakan.

## 1. Siapkan folder repo

**Jika folder repo lama masih ada:** buka folder tersebut di VS Code, lalu Terminal → New Terminal. Folder yang benar berisi `package.json` dan folder `.git` milik repo GitHub kamu.

```powershell
git status --short
git remote -v
git branch --show-current
```

Remote `origin` harus menunjuk ke `https://github.com/juijey819/NEETDash.git` atau bentuk SSH `git@github.com:juijey819/NEETDash.git`. Jika menunjuk repo lain, gunakan clone baru sesuai cara di bawah.

Jika `git status --short` menampilkan perubahan lama, simpan perubahan itu terlebih dahulu atau gunakan clone baru agar tidak tertimpa. Ketika folder bersih, ambil versi remote sebelum menyalin source baru:

```powershell
git pull --ff-only
```

**Jika folder lama tidak ada atau kamu ingin memakai folder baru:** buka terminal di folder kerja yang kamu pilih, lalu:

```powershell
git clone https://github.com/juijey819/NEETDash.git NEETDash-update
cd NEETDash-update
```

Clone otomatis memakai branch default repo. Panduan ini memakai `git push` sehingga tidak mengasumsikan bahwa nama branch adalah `main`.

## 2. Ganti source dengan isi ZIP

1. Ekstrak ZIP. Di dalamnya terdapat satu folder `NEETDash`.
2. Buka folder hasil ekstrak tersebut. `package.json`, `src`, dan `public` harus terlihat langsung di dalamnya.
3. Buat salinan cadangan folder repo lama **di luar folder repo** bila kamu memakai folder lama.
4. Ganti folder aplikasi yang namanya sama dengan versi di ZIP: `src`, `public`, `scripts`, `docs`, `map_assets`, dan `reference` bila ada. Untuk folder ini gunakan penggantian penuh agar file source lama yang sudah tidak dipakai tidak tertinggal.
5. Salin file root dari ZIP ke root repo, termasuk `package.json`, `package-lock.json`, konfigurasi TypeScript/Vite/ESLint, `index.html`, README dan `.gitignore`; pilih Replace saat diminta.
6. Pertahankan folder `.git` dari clone GitHub. Pertahankan `.github` serta konfigurasi hosting sendiri seperti `vercel.json`, `netlify.toml`, atau `CNAME` jika ada. Tinjau konfigurasi hosting jika sebelumnya disesuaikan.

Hasilnya harus seperti ini: `NEETDash-update/package.json`, bukan `NEETDash-update/NEETDash/package.json`. Paket ZIP tidak membawa folder `.git` maupun binding hosting akun asal.

## 3. Jalankan pemeriksaan

Gunakan Node.js 22 atau lebih baru. Jalankan dari root repo:

```powershell
npm ci
npm run lint
npm run typecheck
npm test
npm run check:data
npm run build
```

Lalu coba dashboard:

```powershell
npm run dev
```

Buka alamat yang tampil di terminal. Tekan Ctrl+C setelah selesai mengecek agar kembali ke terminal.

## 4. Commit dan push

```powershell
git status --short
git diff --stat
git add -A
git diff --cached --stat
git commit -m "Update dashboard and data-driven Key Insights"
git push
```

Periksa daftar perubahan sebelum commit. `git add -A` mencakup file baru, perubahan dan penghapusan source lama. `.gitignore` mengecualikan dependency, build, environment privat dan metadata hosting asal.

Ini menambah commit ke riwayat repo lama. Tidak perlu `git init`, `git remote add origin`, atau force push.

## Jika muncul pesan error

### No upstream branch

Gunakan nama branch yang tampil dari `git branch --show-current`:

```powershell
git push -u origin NAMA_BRANCH
```

Ganti `NAMA_BRANCH` dengan nama sebenarnya, tanpa tanda kurung. Jika repo menerapkan proteksi branch, push ke branch kerja lalu buat pull request sesuai pengaturan repo.

### Rejected / non-fast-forward

Setelah perubahan baru sudah di-commit, ambil commit remote dan terapkan commit lokal di atasnya:

```powershell
git pull --rebase
git push
```

Jika ada konflik, selesaikan file yang ditandai, jalankan `git add NAMA_FILE`, lalu `git rebase --continue` dan `git push`. Untuk membatalkan rebase yang belum selesai, gunakan `git rebase --abort`. Jangan mengganti langkah ini dengan force push.

### Author identity unknown

Atur identitas Git milikmu, lalu ulangi commit:

```powershell
git config user.name "Nama kamu"
git config user.email "Email GitHub kamu"
```

### Diminta login

Gunakan alur login GitHub yang disediakan Git Credential Manager atau editor. Jangan memasukkan token ke source, README, atau remote URL.

## Hosting

Push memperbarui source di GitHub. Jika repo sudah dihubungkan dengan Vercel/Netlify atau layanan lain, deployment mengikuti pengaturan layanan itu. Pengaturan build proyek ini: install `npm ci`, build `npm run build`, output `dist`.

Untuk GitHub Pages di path `/NEETDash/`, path aset root proyek saat ini perlu penyesuaian. Panduan ini tidak mengubah pengaturan hosting yang sudah kamu miliki.

Referensi resmi: https://docs.github.com/en/get-started/using-git/pushing-commits-to-a-remote-repository
