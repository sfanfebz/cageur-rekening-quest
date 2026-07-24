# Deploy produksi: Vercel + Supabase

## 1. Supabase

1. Buat project Supabase baru dan simpan database password.
2. Di **SQL Editor**, jalankan `supabase/schema.sql`, kemudian `supabase/seed.sql`.
3. Di **Project Settings → API**, salin Project URL dan **service_role** key. Key ini hanya untuk server dan tidak boleh ditaruh di browser.

## 2. Local

```bash
cp .env.example .env.local
# Isi SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, dan LEADERBOARD_PASSCODE.
npm install
npm run dev
```

Buka `http://localhost:3000`, masuk dengan nama/NIP, lalu selesaikan quest pertama. Periksa tabel `participants`, `participant_campaign_progress`, dan `participant_quest_progress` di Supabase Table Editor.

## 3. Vercel

1. Push branch ini ke GitHub dan impor repository melalui **Add New → Project** di Vercel.
2. Pilih framework **Next.js**. Jangan mengatur Output Directory; Vercel memakai hasil `next build` secara otomatis.
3. Tambahkan tiga environment variable di **Settings → Environment Variables** untuk Production, Preview, dan Development:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `LEADERBOARD_PASSCODE`
4. Deploy. Setelah environment variable ditambahkan atau diubah, pilih **Redeploy** pada deployment terbaru.

## 4. Checklist keamanan

- Pastikan `.env.local` tidak di-commit.
- Jangan pernah memakai prefix `NEXT_PUBLIC_` untuk service role key.
- Jangan membuat policy insert/update publik pada tabel progress; Route Handler memakai key server.
- Uji endpoint publik leaderboard dan pastikan response tidak mengandung `nip`, `unique_key`, atau `answer_data_json`.
