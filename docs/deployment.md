# Deploy produksi: Vercel + Supabase

## 1. Supabase

1. Buat project Supabase baru dan simpan database password.
2. Di **SQL Editor**, jalankan `supabase/schema.sql`, kemudian `supabase/seed.sql`.
   Keduanya aman dijalankan ulang (idempotent) kalau perlu diperbarui nanti.
3. Di **Project Settings → API**, salin Project URL dan **service_role** key.
   Key ini hanya untuk server dan tidak boleh ditaruh di browser.

## 2. Environment variable

Salin `.env.example` menjadi `.env.local` untuk pengembangan lokal, atau isi
langsung di Vercel untuk production/preview:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `LEADERBOARD_PASSCODE` — passcode untuk membuka Klasemen Lengkap (bagian 20B). Default contoh: `MantappuJiwa`.
- `SESSION_SECRET` — string acak panjang untuk menandatangani cookie sesi pemain. Ganti dengan nilai unik per environment.
- `ADMIN_PASSCODE` — passcode untuk membuka panel admin di `/admin` (lihat `docs/petunjuk-teknis.md` §6). Beda dari `LEADERBOARD_PASSCODE` — pastikan diisi nilai unik yang hanya diketahui admin, jangan pakai nilai contoh di produksi.

## 3. Local

```bash
cp .env.example .env.local
# Isi SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, LEADERBOARD_PASSCODE, SESSION_SECRET, ADMIN_PASSCODE.
npm install
npm run dev
```

Buka `http://localhost:3000`, masuk dengan nama/NIP, lalu selesaikan quest
pertama. Periksa tabel `participants`, `participant_campaign_progress`, dan
`participant_quest_progress` di Supabase Table Editor untuk memastikan
progres tersimpan.

## 4. Vercel

1. Push branch ini ke GitHub dan impor repository melalui **Add New → Project** di Vercel.
2. Pilih framework **Next.js**. Jangan mengatur Output Directory; Vercel memakai hasil `next build` secara otomatis.
3. Tambahkan lima environment variable di **Settings → Environment Variables** untuk Production, Preview, dan Development (lihat bagian 2 di atas).
4. Deploy. Setelah environment variable ditambahkan atau diubah, pilih **Redeploy** pada deployment terbaru.

## 5. Mengelola campaign & quest

Operasi paling umum (reset progres pemain, ganti campaign aktif, lihat
klasemen lengkap) punya tombolnya sendiri di panel admin (`/admin`,
digerbangi `ADMIN_PASSCODE` — lihat `docs/petunjuk-teknis.md` §6). Untuk
operasi lain (tambah campaign/quest baru, ubah `config_json`, dsb), tetap
lewat **Supabase Table Editor** (bagian 26 pada spesifikasi):

- Tambah campaign baru: insert baris di tabel `campaigns`. Hanya boleh ada
  satu campaign berstatus `active` pada satu waktu (dijaga oleh unique index
  di `schema.sql`).
- Tambah quest: insert baris di tabel `quests`, isi `config_json` sesuai
  template di `docs/quest-config-templates.md`.
- Hubungkan quest ke campaign: insert baris di `campaign_quests`, atur
  `order_index`, `is_required`, dan `unlock_rule`.
- Mengarsipkan campaign lama: ubah `status` campaign lama menjadi
  `archived`, lalu ubah campaign baru menjadi `active`. Leaderboard lama
  otomatis "beku" karena quest-nya tidak lagi dapat dimainkan.

## 6. Checklist keamanan

- Pastikan `.env.local` tidak di-commit.
- Jangan pernah memakai prefix `NEXT_PUBLIC_` untuk `SUPABASE_SERVICE_ROLE_KEY`, `LEADERBOARD_PASSCODE`, `SESSION_SECRET`, atau `ADMIN_PASSCODE`.
- Row Level Security aktif dengan default deny di semua tabel; tidak ada policy publik. Semua baca/tulis lewat service key di server (Route Handler & Server Component).
- Skor selalu dihitung ulang di server dari `config_json` quest (lihat `lib/scoring.ts`), bukan dipercaya dari payload client.
- Uji endpoint publik leaderboard (`/api/leaderboard/full`, halaman `/campaign/[code]/leaderboard`) dan pastikan responsnya tidak mengandung `nip`, `unique_key`, atau `answer_data_json`.
