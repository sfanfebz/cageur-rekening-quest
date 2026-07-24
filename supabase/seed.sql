-- Jalankan setelah supabase/schema.sql. Aman dijalankan ulang karena menggunakan upsert.
insert into campaigns (campaign_code, title, description, status, start_at)
values ('CR-C01', 'Cageur Rekening Quest — Cek dan Atur Keuangan', 'Cek kondisi keuangan, temukan bocor halus, atur budget, dan tahan checkout yang kurang perlu.', 'active', now())
on conflict (campaign_code) do update set title = excluded.title, description = excluded.description, status = excluded.status;

insert into quests (quest_code, title, subtitle, quest_type, status, max_score, version, config_json) values
('Q001','Dompet Cageur Scanner','Tap kebiasaan yang bikin rekening sehat','tap_select','active',25,1,'{"instruction":"Tap semua kebiasaan yang bikin rekening makin sehat.","choices":[{"label":"Pengeluaran lebih kecil dari penghasilan","healthy":true},{"label":"Punya dana darurat","healthy":true},{"label":"Sering belanja impulsif","healthy":false},{"label":"Mencatat pengeluaran harian","healthy":true},{"label":"Tidak tahu total cicilan","healthy":false},{"label":"Punya tujuan keuangan","healthy":true}]}'),
('Q002','Bocor Halus Hunt','Temukan pengeluaran kecil yang kerap lolos','hidden_object','active',25,1,'{"instruction":"Dalam 30 detik, tap pengeluaran kecil yang bisa jadi bocor halus.","targets":["Kopi harian","Jajan promo","Checkout barang lucu","Parkir kecil-kecil","Flash sale","Langganan jarang dipakai"],"decoys":["Makan harian","Transportasi","Listrik & internet","Dana darurat"]}'),
('Q003','Budget Rush','Bagi 100 koin gaji dengan bijak','budget_slider','active',20,1,'{"instruction":"Kamu punya 100 koin gaji. Bagi ke pos yang tepat.","categories":[{"label":"Kebutuhan utama","ideal":45},{"label":"Cicilan & kewajiban","ideal":20},{"label":"Tabungan/dana darurat","ideal":25},{"label":"Hiburan/gaya hidup","ideal":10}]}'),
('Q004','Checkout Battle','Pilih Checkout, Tunda, atau Keluarkan','swipe_cards','active',30,1,'{"instruction":"Swipe setiap barang ke keputusan paling bijak.","items":[{"label":"Obat","best":"Checkout"},{"label":"Dekorasi promo","best":"Keluarkan"},{"label":"Tas flash sale","best":"Tunda 24 Jam"}]}')
on conflict (quest_code) do update set title = excluded.title, subtitle = excluded.subtitle, quest_type = excluded.quest_type, status = excluded.status, max_score = excluded.max_score, config_json = excluded.config_json;

insert into campaign_quests (campaign_id, quest_id, order_index, is_required, unlock_rule)
select c.id, q.id, data.order_index, true, 'sequential'
from campaigns c cross join (values ('Q001',1),('Q002',2),('Q003',3),('Q004',4)) as data(quest_code, order_index) join quests q on q.quest_code = data.quest_code
where c.campaign_code = 'CR-C01'
on conflict (campaign_id, quest_id) do update set order_index = excluded.order_index, is_required = excluded.is_required, unlock_rule = excluded.unlock_rule;
