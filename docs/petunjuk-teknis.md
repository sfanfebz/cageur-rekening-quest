# Petunjuk Teknis — Pengelolaan Cageur Rekening Quest

Panduan operasional harian untuk mengelola campaign, quest, dan data peserta.
Sebagian operasi paling umum (reset progres pemain, ganti campaign aktif,
lihat klasemen lengkap) sekarang bisa dilakukan lewat **panel admin di
aplikasi** (`/admin`, digerbangi passcode `ADMIN_PASSCODE` — lihat §6).
Untuk operasi yang belum ada tombolnya (tambah campaign/quest baru, ubah
`config_json`, dsb), tetap lewat **Supabase SQL Editor** (script siap pakai
di `supabase/scripts/`) atau **Table Editor** untuk pengecekan cepat.

Dokumen terkait: `docs/full-documentation.md` (arsitektur & cara kerja
sistem), `docs/deployment.md` (setup awal Vercel + Supabase),
`docs/quest-config-templates.md` (referensi lengkap `config_json` per tipe
quest).

---

## 0. Prasyarat

- Akses **Supabase Dashboard** project ini (role minimal yang bisa membuka
  SQL Editor).
- Akses **Vercel Dashboard** kalau perlu mengubah environment variable
  (`LEADERBOARD_PASSCODE`, dll — lihat `docs/deployment.md` §2).
- Semua script ada di `supabase/scripts/`, diberi nomor urutan logis
  (bukan urutan wajib eksekusi — buka file sesuai kebutuhan, bukan run semua
  berurutan).
- **Setiap script punya baris bertanda `👉`** yang wajib diisi/disesuaikan
  manual sebelum dijalankan. Baca komentar di bagian atas tiap script
  sebelum run.
- ⚠️ **Sebelum menjalankan script yang menghapus/mengubah data** (`05`, `04`
  Skenario B, `08` Opsi B), jalankan dulu script query terkait (`01`, `07`,
  `06`) untuk melihat data yang akan terdampak. Supabase SQL Editor tidak
  punya undo — kalau ragu, screenshot/salin hasil query dulu sebagai catatan.

## 1. Mengelola Campaign

| Kebutuhan | Script |
|---|---|
| Tambah campaign baru | `02-add-campaign.sql` |
| Ubah status biasa (mis. arsipkan) | `04-update-campaign-status.sql` Skenario A |
| Aktifkan campaign baru (ganti campaign aktif) | `04-update-campaign-status.sql` Skenario B |

**Aturan penting:** hanya boleh ada **satu** campaign berstatus `active`
pada satu waktu (dijaga *unique index* di `schema.sql`). Pola kerja yang
disarankan untuk merilis campaign baru:

1. Insert campaign baru dengan status `draft` (`02-add-campaign.sql`).
2. Tambahkan semua quest-nya (§2) sambil masih `draft` — aman, belum
   terlihat pemain sama sekali.
3. Cek urutan & konfigurasi lewat `07-list-campaign-quests.sql`.
4. Kalau sudah siap tayang, jalankan `04-update-campaign-status.sql`
   Skenario B — ini otomatis mengarsipkan campaign aktif lama **dan**
   mengaktifkan yang baru dalam satu transaksi (jadi tidak akan ada momen
   "tidak ada campaign aktif" atau error *duplicate key*).

Begitu campaign lama diarsipkan, quest-nya otomatis tidak bisa dimainkan
lagi (statusnya sendiri tidak berubah), tapi klasemennya tetap tersimpan
dan bisa diakses lewat riwayat/Klasemen Lengkap kapan pun.

## 2. Mengelola Quest

| Kebutuhan | Script |
|---|---|
| Tambah quest baru (10 tipe tersedia) + hubungkan ke campaign | `03-add-quest.sql` |
| Lihat daftar & urutan quest dalam 1 campaign | `07-list-campaign-quests.sql` |
| Lepas quest dari rotasi tanpa menghapusnya | `08-remove-quest-from-campaign.sql` |

`03-add-quest.sql` berisi template `config_json` siap-salin untuk ke-10
`quest_type` (tap_select, hidden_object, budget_slider, swipe_cards,
match_pairs, timeline_sort, scenario_choice, memory_cards, quick_reaction,
simulation). Referensi lengkap tiap field: `docs/quest-config-templates.md`.

**Selalu tes quest baru sebelum diumumkan ke peserta luas** — buka sendiri
sebagai pemain (pakai NIP uji coba) untuk memastikan `config_json` tampil
& tervalidasi dengan benar. Kalau skema tidak valid (typo field, tipe data
salah, dsb), aplikasi **tidak akan crash** — quest itu otomatis
disembunyikan dari daftar pemain, dan errornya cuma muncul di log server
Vercel (`[quest-config] <kode> disembunyikan: ...`). Ini aman untuk
produksi, tapi berarti kesalahan konfigurasi bisa "diam-diam tidak
kelihatan" kalau tidak dicek manual.

Untuk melepas quest dari rotasi, `08-remove-quest-from-campaign.sql`
punya 2 opsi — **Opsi A (arsipkan)** adalah mekanisme resmi yang dipakai
aplikasi: peserta yang sudah menyelesaikannya tetap melihat riwayat &
skornya, peserta yang belum akan melihatnya hilang total. Opsi B (putus
link campaign_quests) lebih keras dan sebaiknya jarang dipakai — lihat
komentar di scriptnya untuk detail dampaknya.

## 3. Mengelola Peserta & Progres

| Kebutuhan | Script |
|---|---|
| Lihat semua peserta + progres + jumlah badge | `01-list-participants-progress.sql` |
| Reset progres 1 peserta untuk 1 campaign | `05-reset-user-progress.sql` |
| Reset progres 1 peserta untuk SEMUA campaign | `09-reset-participant-all-progress.sql` (setara tombol "Reset Progress Pemain Tertentu" di panel admin) |
| Reset progres SEMUA peserta | `10-reset-all-participants-progress.sql` (setara tombol "Reset Progress Semua Pemain" di panel admin) |

Reset progres **menghapus** baris `participant_quest_progress` &
`participant_campaign_progress` peserta (atau semua peserta) yang dipilih —
aplikasi otomatis membuat baris baru begitu peserta itu membuka Game Hub
lagi, jadi tidak perlu insert manual susulan. Data identitas (nama/NIP)
tidak pernah ikut terhapus oleh operasi ini.

## 4. Klasemen

`06-leaderboard.sql` menampilkan ranking lengkap 1 campaign, meniru persis
logika yang dipakai fitur "Klasemen Lengkap" di aplikasi — **hanya peserta
berstatus `completed`** yang masuk hitungan, diurut skor tertinggi lalu
waktu selesai lebih awal.

Untuk membuka Klasemen Lengkap di aplikasi (bukan lewat SQL), peserta perlu
memasukkan `LEADERBOARD_PASSCODE`. Untuk mengganti passcode: ubah
environment variable itu di Vercel (Settings → Environment Variables) lalu
**Redeploy** — lihat `docs/deployment.md` §2 & §4.

## 5. Hal Lain yang Perlu Dipertimbangkan

### Menambah konten ke campaign yang sudah berjalan

Skor & progres campaign yang tersimpan (`participant_campaign_progress`)
hanya di-*refresh* di server **setiap kali peserta menyelesaikan sebuah
quest**. Kalau kamu menambahkan quest baru ke campaign yang sebagian
pesertanya **sudah** berstatus `completed`, baris tersimpan mereka
(termasuk yang dipakai klasemen) **tidak otomatis ikut ter-update** sampai
mereka melakukan aksi baru di campaign itu. Praktik paling aman:

- Tambahkan quest baru **sebelum** campaign ramai diselesaikan orang, atau
- Kalau terpaksa menambah di tengah jalan, sadari klasemen untuk peserta
  yang sudah selesai duluan bisa terlihat "ketinggalan" sampai mereka
  membuka kembali quest-quest di campaign itu.

### Backup sebelum operasi besar

Supabase menyediakan backup otomatis (frekuensi tergantung plan project).
Untuk operasi berisiko (reset massal, mengubah banyak baris sekaligus),
lebih aman melakukan **Point-in-Time Recovery checkpoint** manual dulu
lewat Supabase Dashboard (Database → Backups) kalau plan-nya mendukung, atau
minimal jalankan query `SELECT` terkait dan simpan hasilnya sebagai catatan
sebelum eksekusi.

### Memantau error produksi

Log runtime ada di **Vercel Dashboard → Project → Logs** (atau tab
"Functions" per deployment). Pola error yang perlu diperhatikan:

- `[quest-config] <kode> disembunyikan: ...` — `config_json` quest itu
  tidak valid, quest otomatis tersembunyi dari pemain. Perbaiki
  `config_json`-nya lewat Table Editor atau `03-add-quest.sql`.
- `[api/quest/complete] gagal menyimpan skor` — biasanya masalah koneksi
  Supabase sesaat; kalau berulang, cek status Supabase project.

### Konsistensi kode badge

`badge.code` di `config_json` tidak diberi constraint unique di database —
kalau dua quest kebetulan diberi `code` badge yang sama, keduanya akan
tampil sebagai "badge yang sama" di kartu hasil/hub. Konvensi yang
disarankan: `code` singkat berbasis kebab-case yang jelas menunjuk ke quest
asalnya (lihat contoh-contoh di `seed.sql`, mis. `dompet-cageur`,
`detektif-bocor-halus`).

### Urutan `order_index` tidak wajib berurutan rapat

`campaign_quests.order_index` cukup unik urutannya secara relatif (dipakai
untuk `unlock_rule: 'sequential'`) — boleh ada celah angka (mis. 10, 20, 30)
kalau mau menyisipkan quest baru di tengah tanpa perlu menomori ulang semua
quest yang sudah ada. Cek urutan yang sudah kepakai dulu lewat
`07-list-campaign-quests.sql` sebelum menentukan `order_index` quest baru.

## 6. Panel Admin (`/admin`)

Ikon gembok 🔒 di pojok kanan atas header (semua halaman) membuka `/admin`.
Digerbangi passcode statis dari environment variable `ADMIN_PASSCODE` (lihat
`docs/deployment.md` §2) — beda dari `LEADERBOARD_PASSCODE` yang dipakai
peserta untuk buka Klasemen Lengkap. Sesi admin tersimpan di cookie selama
12 jam (lebih pendek dari sesi pemain) lalu perlu login ulang.

Dashboard ringkas di bagian atas menampilkan: judul campaign aktif, total
peserta tercatat, jumlah peserta yang sudah menyelesaikan campaign aktif,
dan rata-rata skor (dalam persen) peserta yang sudah selesai.

Empat aksi tersedia:

| Tombol | Yang terjadi | Setara script manual |
|---|---|---|
| Reset Progress Semua Pemain | Hapus progres SEMUA peserta di SEMUA campaign (identitas tidak terhapus) | `10-reset-all-participants-progress.sql` |
| Reset Progress Pemain Tertentu | Pilih 1 peserta dari dropdown, lihat ringkasan riwayatnya, lalu reset progresnya di SEMUA campaign | `09-reset-participant-all-progress.sql` |
| Ganti Campaign Aktif | Pilih campaign berstatus "Segera Hadir" untuk diaktifkan; campaign aktif lama otomatis diarsipkan | `04-update-campaign-status.sql` Skenario B |
| Lihat Klasemen Lengkap | Membuka `/klasemen` — mekanisme & passcode-nya sama seperti yang dipakai peserta | — |

Setiap aksi yang mengubah/menghapus data selalu ada langkah konfirmasi
sebelum benar-benar dieksekusi. Sama seperti operasi manual lewat SQL
Editor, tidak ada undo — pertimbangkan Point-in-Time Recovery checkpoint
(lihat §5) sebelum reset massal di produksi.
