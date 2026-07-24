# Template `config_json` Quest

Validasi runtime berada di `lib/quests.ts`. Bila config tidak sesuai skema, quest harus disembunyikan dan dicatat oleh endpoint server.

## `tap_select`
```json
{"instruction":"Tap semua kebiasaan yang bikin rekening makin sehat.","choices":[{"label":"Punya dana darurat","healthy":true},{"label":"Sering belanja impulsif","healthy":false}]}
```

## `hidden_object`
```json
{"instruction":"Tap pengeluaran kecil yang tidak dicatat.","targets":["Kopi harian"],"decoys":["Dana darurat"]}
```

## `budget_slider`
```json
{"instruction":"Bagi 100 koin gaji.","categories":[{"label":"Kebutuhan utama","ideal":45},{"label":"Tabungan/dana darurat","ideal":25}]}
```

## `swipe_cards`
```json
{"instruction":"Pilih keputusan paling bijak.","items":[{"label":"Obat","best":"Checkout"},{"label":"Barang viral","best":"Keluarkan"}]}
```
