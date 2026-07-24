# Template `config_json` per Tipe Quest

Dokumen ini berisi contoh `config_json` lengkap dan valid untuk setiap
`quest_type` yang terdaftar di registry (`components/quest/registry.tsx`).
Salin template yang sesuai, ganti isinya, lalu tempelkan ke kolom
`config_json` pada tabel `quests` di Supabase Table Editor.

Validasi runtime ada di `lib/quest-config-schemas.ts` (skema Zod per tipe).
Jika `config_json` tidak sesuai skema, quest otomatis **disembunyikan** dari
pemain dan error dicatat di log server — aplikasi tidak akan crash (bagian
11.3 & 26B pada spesifikasi).

Field `badge` bersifat opsional di semua tipe. Kalau diisi, badge itu akan
muncul di kartu hasil, Game Hub, dan riwayat misi setelah quest selesai.

Field `emoji` juga opsional pada tiap kartu/item (kecuali `scenario_choice`
dan `simulation`). Kalau diisi, emoji tampil besar di kartu supaya nuansa
game lebih kental; kalau kosong, kartu tetap tampil normal tanpa emoji.

---

## `tap_select`

Pemain tap semua kartu yang termasuk kebiasaan/kondisi "sehat". Skor
dihitung dari jumlah kartu sehat yang benar dikenali dikurangi kartu tidak
sehat yang salah ditap.

```json
{
  "instruction": "Tap semua kebiasaan yang bikin rekening makin sehat.",
  "cards": [
    { "id": "c1", "label": "Punya dana darurat", "healthy": true, "emoji": "🛡️" },
    { "id": "c2", "label": "Sering belanja impulsif", "healthy": false, "emoji": "🛍️" }
  ],
  "badge": { "code": "dompet-cageur", "title": "Dompet Cageur" }
}
```

## `hidden_object`

Pemain tap semua `targets` dalam batas waktu, sambil menghindari `decoys`.

```json
{
  "instruction": "Dalam 30 detik, tap pengeluaran kecil yang bisa jadi bocor halus.",
  "timeLimitSeconds": 30,
  "targets": [
    { "id": "t1", "label": "Kopi harian", "emoji": "☕" },
    { "id": "t2", "label": "Flash sale", "emoji": "⚡" }
  ],
  "decoys": [
    { "id": "d1", "label": "Dana darurat", "emoji": "🛡️" },
    { "id": "d2", "label": "Cicilan", "emoji": "🏦" }
  ],
  "badge": { "code": "detektif-bocor-halus", "title": "Detektif Bocor Halus" }
}
```

## `budget_slider`

Pemain membagi `totalCoins` ke beberapa `categories`. Tiap kategori punya
zona ideal (hijau), zona waspada (kuning), dan di luar itu dianggap merah.
Penilaian tetap fleksibel/edukatif, bukan satu formula kaku.

```json
{
  "instruction": "Kamu punya 100 koin gaji. Bagi ke pos yang tepat.",
  "totalCoins": 100,
  "categories": [
    { "id": "kebutuhan", "label": "Kebutuhan utama", "emoji": "🧾", "idealMin": 40, "idealMax": 60, "warningMin": 30, "warningMax": 70 },
    { "id": "tabungan", "label": "Tabungan/dana darurat", "emoji": "🐷", "idealMin": 15, "idealMax": 35, "warningMin": 10, "warningMax": 45 }
  ],
  "badge": { "code": "jago-atur-budget", "title": "Jago Atur Budget" }
}
```

## `swipe_cards`

Pemain mengarahkan tiap `items` ke salah satu dari tiga keputusan
(`directions.right` / `up` / `left`). Field `best` pada tiap item harus
sama persis dengan salah satu nilai di `directions`.

```json
{
  "instruction": "Swipe setiap barang ke keputusan yang paling bijak.",
  "directions": { "right": "Checkout", "up": "Tunda 24 Jam", "left": "Keluarkan" },
  "items": [
    { "id": "i1", "label": "Obat", "best": "Checkout", "emoji": "💊" },
    { "id": "i2", "label": "Barang viral", "best": "Keluarkan", "emoji": "🔥" }
  ],
  "badge": { "code": "anti-lapar-mata", "title": "Anti Lapar Mata" }
}
```

## `match_pairs`

Pemain menjodohkan item kolom kiri dengan pasangannya di kolom kanan.

```json
{
  "instruction": "Jodohkan istilah dengan artinya.",
  "pairs": [
    { "id": "p1", "left": "Dana darurat", "right": "Simpanan untuk kondisi tak terduga", "emoji": "🛡️" },
    { "id": "p2", "left": "Cicilan", "right": "Kewajiban bayar rutin", "emoji": "🏦" }
  ],
  "badge": { "code": "jago-jodoh-istilah", "title": "Jago Istilah Keuangan" }
}
```

## `timeline_sort`

Pemain mengurutkan `items` sesuai `order` yang benar (1 = paling awal).
Urutan asli tidak ditampilkan ke pemain; komponen mengacak tampilannya.

```json
{
  "instruction": "Urutkan langkah menyusun budget bulanan.",
  "items": [
    { "id": "s1", "label": "Catat penghasilan", "order": 1, "emoji": "📝" },
    { "id": "s2", "label": "Sisihkan tabungan", "order": 2, "emoji": "🐷" },
    { "id": "s3", "label": "Bayar kebutuhan wajib", "order": 3, "emoji": "🧾" },
    { "id": "s4", "label": "Alokasikan hiburan", "order": 4, "emoji": "🎮" }
  ],
  "badge": { "code": "runut-budget", "title": "Runut Budget" }
}
```

## `scenario_choice`

Rangkaian skenario pilihan ganda. Tiap opsi punya `correct` dan `feedback`
opsional yang tampil setelah dipilih.

```json
{
  "instruction": "Pilih respons paling bijak untuk tiap situasi.",
  "scenarios": [
    {
      "id": "sc1",
      "prompt": "Gajian baru masuk, ada notifikasi flash sale. Apa yang kamu lakukan?",
      "options": [
        { "id": "o1", "label": "Cek budget dulu sebelum checkout", "correct": true, "feedback": "Betul, cek budget dulu supaya tidak kebablasan." },
        { "id": "o2", "label": "Checkout langsung sebelum kehabisan", "correct": false, "feedback": "Hati-hati, ini bisa jadi bocor halus." }
      ]
    }
  ],
  "badge": { "code": "bijak-skenario", "title": "Bijak Bersikap" }
}
```

## `memory_cards`

Permainan kartu memori klasik. Tiap `pairs` menghasilkan dua kartu dengan
label yang sama; pemain membuka dua kartu untuk mencari pasangannya.

```json
{
  "instruction": "Buka kartu dan temukan semua pasangannya.",
  "pairs": [
    { "id": "m1", "label": "Kebutuhan", "emoji": "🧾" },
    { "id": "m2", "label": "Keinginan", "emoji": "🛍️" },
    { "id": "m3", "label": "Tabungan", "emoji": "🐷" }
  ],
  "badge": { "code": "ingatan-tajam", "title": "Ingatan Tajam" }
}
```

## `quick_reaction`

Serangkaian ronde cepat. Ronde dengan `isTarget: true` harus ditap dalam
`reactionWindowMs`; ronde `isTarget: false` sebaiknya tidak ditap.

```json
{
  "instruction": "Tap secepatnya saat muncul kesempatan menabung, tahan saat godaan belanja muncul.",
  "reactionWindowMs": 1200,
  "rounds": [
    { "id": "r1", "label": "Ada rezeki lebih!", "isTarget": true, "emoji": "💰" },
    { "id": "r2", "label": "Promo kilat!", "isTarget": false, "emoji": "⚡" }
  ],
  "badge": { "code": "reaksi-cageur", "title": "Reaksi Cageur" }
}
```

## `simulation`

Simulasi keputusan bertahap. Tiap `steps` punya beberapa opsi dengan bobot
`impact` (0–1) yang menentukan proporsi skor langkah tersebut.

```json
{
  "instruction": "Ambil keputusan finansial di tiap tahap simulasi.",
  "steps": [
    {
      "id": "st1",
      "label": "Bonus tahunan cair. Apa langkah pertamamu?",
      "options": [
        { "id": "op1", "label": "Sisihkan sebagian ke dana darurat", "impact": 1 },
        { "id": "op2", "label": "Habiskan untuk liburan mendadak", "impact": 0.2 }
      ]
    }
  ],
  "badge": { "code": "simulator-cageur", "title": "Simulator Cageur" }
}
```
