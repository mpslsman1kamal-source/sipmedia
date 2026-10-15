# Panduan Deploy — SIPMEDIA

Ada dua bagian: **A. Backend** di Google Apps Script, lalu **B. Frontend** di GitHub Pages. Kerjakan berurutan, karena frontend butuh alamat backend.

## Isi paket
| Berkas | Untuk apa |
|---|---|
| `Kode.gs`, `Config.gs`, `Router.gs`, `Utils.gs`, `Auth.gs`, `Setup.gs`, `ModAset.gs`, `ModPengguna.gs`, `ModConfig.gs`, `ModPeminjaman.gs`, `ModJadwal.gs`, `ModDashboard.gs`, `ModLaporan.gs` | Backend, disalin ke Apps Script |
| `appsscript.json` | Pengaturan proyek Apps Script (zona waktu, akses) |
| `sipmedia.zip` | Frontend, ke GitHub |

## A. Backend (Google Apps Script)

> ⚠️ Data Anda sudah ada di Google Sheets. **Jangan** menjalankan `setupAppEnvironment`: itu membuat spreadsheet kosong baru. Struktur sheet Anda tidak diubah sama sekali.

1. Buka https://script.google.com → **Proyek baru**. Beri nama `SIPMEDIA API`.
2. Untuk **setiap berkas `.gs`**: klik **+** di samping "Berkas" → **Skrip** → beri nama sama persis (tanpa `.gs`) → hapus isi bawaan → tempel isinya. Berkas `Code.gs` bawaan: ganti namanya menjadi `Kode` dan isi dengan `Kode.gs`.
3. Pengaturan proyek (ikon roda gigi) → centang **Tampilkan berkas manifes "appsscript.json"** → buka berkas itu di editor → ganti isinya dengan `appsscript.json` dari paket.
4. Buka berkas `Setup`. Cari baris `const ID_SPREADSHEET_LAMA = 'GANTI_DENGAN_ID_SPREADSHEET';` dan ganti dengan ID spreadsheet SIPMEDIA Anda (bagian antara `/d/` dan `/edit` pada URL spreadsheet). Simpan.
5. Pilih fungsi `pasangSpreadsheet` di dropdown → **Jalankan** → **Tinjau izin** → izinkan. Log eksekusi harus menampilkan ✅. Fungsi ini juga membuat kunci rahasia untuk tanda masuk.
6. Jalankan fungsi `cekStruktur`. Log harus menampilkan "✅ Struktur sesuai". Bila ada ❌, nama sheet atau kolom berbeda dari yang diharapkan; kirim log-nya kepada saya.
7. Jalankan fungsi `cekAkunDemo`. Bila ada akun contoh lama (misalnya `budi.santoso@sekolah.sch.id` dengan sandi `admin123`) yang masih aktif, log akan memperingatkan. **Ganti sandi atau nonaktifkan akun itu** lewat Master Data setelah login.

### Deploy
- Deploy → **Deployment baru** → jenis **Aplikasi web** → Jalankan sebagai **Saya** → Siapa yang punya akses **Siapa saja** → **Deploy**.
- **Salin URL yang berakhiran `/exec`.** Simpan di Notepad.
- Uji: tempel `URL/exec?action=ping` di browser. Harus muncul `{"success":true,...}`.

> Setiap kali kode `.gs` diubah: Deploy → **Kelola deployment** → ikon pensil → Versi **Versi baru** → Deploy. URL tidak berubah.

## B. Frontend (GitHub Pages)

Folder kerja Anda adalah **folder hasil ekstraksi `sipmedia.zip`** (yang di dalamnya langsung terlihat `index.html`, `css`, `js`, `vendor`). Di folder inilah perintah `git init` dijalankan, bukan di folder di atasnya.

1. Ekstrak ZIP. Buka folder hasil ekstraksi dan pastikan `index.html` terlihat langsung.
2. Buka `js/config.js` dengan Notepad. Ganti `GANTI_DENGAN_URL_EXEC_ANDA` pada `GAS_URL` dengan URL `/exec` dari langkah A. Simpan.
3. Pasang Git (Windows: https://git-scm.com/download/win, pilih pengaturan bawaan), buat akun di https://github.com, lalu di terminal jalankan `git config --global user.name "Nama Anda"` dan `git config --global user.email "email@akun-github.com"`.
4. Di github.com: **+** → **New repository** → nama `sipmedia` → **Public** → jangan centang README → **Create**.
5. Buka terminal di folder kerja (Windows: ketik `powershell` di address bar File Explorer lalu Enter). Jalankan `dir` dan pastikan `index.html` muncul di daftar. Jika yang terlihat folder lain, Anda berada di tempat yang salah.
6. Jalankan satu per satu:
   ```
   git init
   git add .
   git commit -m "Upload pertama"
   git branch -M main
   git remote add origin https://github.com/USERNAME/sipmedia.git
   git push -u origin main
   ```
7. Saat diminta password, tempel **Personal Access Token** (bukan password akun). Layar tampak kosong saat paste, itu normal. Cara membuat token: github.com/settings/tokens → Generate new token (classic) → centang **repo** → salin token yang tampil sekali.
8. Repo → **Settings** → **Pages** → Source **Deploy from a branch** → Branch **main** / **(root)** → **Save** → tunggu 1–2 menit.
9. Buka `https://USERNAME.github.io/sipmedia/`.

## C. Daftar uji (lakukan di browser, sekali saja)
1. Login dengan akun Admin lama Anda. **Semua pengguna harus login ulang sekali**, karena sistem tanda masuk berubah.
2. Dashboard tampil dan angkanya masuk akal dibanding sheet.
3. Master Data: buka satu aset dan satu pengguna, simpan tanpa mengubah apa pun, lalu cek barisnya di Sheets tidak rusak.
4. Login sebagai Guru: ajukan peminjaman pada waktu yang sudah terpakai → harus muncul peringatan "Jadwal Bentrok".
5. Ajukan di waktu kosong → baris baru muncul di sheet Peminjaman berstatus `Menunggu`.
6. Login Admin → Approval → Setujui satu dan Tolak satu (dengan alasan) → cek kolom Status, Disetujui_Oleh, Tanggal_Approval di sheet.
7. Login Kepala Sekolah: hanya melihat Approval tanpa tombol aksi, dan bisa membuka Analytics.
8. Mode gelap menyala dan bertahan setelah muat ulang. Tombol Keluar mengembalikan ke halaman masuk.
9. Buka di HP: menu samping muncul lewat tombol ☰.

## D. Perubahan perilaku dari aplikasi lama (disengaja)
- Daftar aset, pengecekan bentrok, dan konfigurasi kini **wajib login** (konfigurasi hanya Admin).
- Pengajuan hanya bisa dibuat Admin, Guru, dan OSIS. Status, ID, dan identitas peminjam diisi server, bukan dikirim browser.
- Tanda masuk berlaku 8 jam. Keluar menghapus sesi di browser; akun yang dinonaktifkan baru tertolak saat tanda masuknya kedaluwarsa.
- Sandi lama tetap berlaku (cara hash sama).

## E. Update di kemudian hari
- Ubah frontend: edit berkas → `git add .` → `git commit -m "catatan"` → `git push` → tekan Ctrl+Shift+R di situs.
- Ubah backend: ubah di editor Apps Script → Deploy versi baru (lihat A).

## F. Masalah umum
| Gejala | Penyebab | Solusi |
|---|---|---|
| Halaman 404 | `index.html` tidak di root repo | Cek repo di browser; push ulang dari folder yang benar |
| Tampil tanpa gaya | Folder `css/` dan `js/` tidak ikut | Jangan upload lewat web GitHub; pakai terminal |
| "Gagal memuat data" | `GAS_URL` salah / belum deploy versi baru | Cek `js/config.js`; deploy ulang backend |
| Galat CORS di Console | URL bukan `/exec` | Pastikan URL berakhir `/exec` |
| `Password authentication is not supported` | Memakai password akun | Buat Personal Access Token |
| Data lama tampil setelah update | Cache browser | Ctrl+Shift+R atau jendela Incognito |
| "Sesi berakhir" sering muncul | Tanda masuk 8 jam habis | Login ulang |
