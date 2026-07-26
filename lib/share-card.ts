"use client";

import QRCode from "qrcode";
import { APP_URL } from "@/lib/constants";

export interface ShareCardData {
  campaignTitle: string;
  participantName: string;
  score: number;
  maxScore: number;
  questCount: number;
  badgeTitles: string[];
  rank: number | null;
  categoryLabel: string;
}

/**
 * KONSEP: "Buku Tabungan Kecageuran" -- kartu hasil meniru halaman buku
 * tabungan/rekening koran ala bank Indonesia (letterhead teal, kolom
 * identitas monospace, cap teller berputar, kotak skor+pencapaian ala
 * ringkasan rekening, sobekan berlubang buat kupon ajakan main). Metafora
 * yang pas buat game yang temanya literally "rekening" yang "cageur".
 *
 * Skor dan pencapaian (jumlah quest, jumlah badge, rak pill badge) disatukan
 * jadi SATU kotak. Rak pill badge dibatasi maksimum 2 nama badge ditampilkan
 * penuh, sisanya diringkas jadi satu pill "+N Badge Lainnya" -- prinsip
 * "tinggi section selalu tetap apa pun datanya" ini dipertahankan dari
 * perbaikan bug sebelumnya (badge yang banyak dulu pernah mendorong footer
 * keluar kanvas).
 */

const WIDTH = 1080;
const HEIGHT = 1350;
const MARGIN = 56;

// Rasio asli assets/kang-cageur/07-thumbsup.svg (viewBox 1128x1268).
const KANG_THUMBSUP_ASPECT = 1128 / 1268;

// Font body tetap system-ui (tidak perlu dimuat, tersedia di semua platform).
// Dua font karakter (display slab + data monospace) dimuat lewat Google
// Fonts saat runtime (ensureLedgerFontsLoaded) -- stack fallback di bawah
// tetap dalam genre yang sama (serif slab / monospace) kalau pemuatan gagal.
const FONT_BODY = "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";
const FONT_DISPLAY = '"Roboto Slab", Georgia, "Noto Serif", serif';
const FONT_MONO = '"Space Mono", "Courier New", monospace';

const PAPER = "#EAF2E9";
const TEAL_DEEP = "#0B5C55";
const NAVY = "#1B2A41";
const GOLD = "#C99A3E";
const STAMP_RED = "#B8391F";
const LINE_FAINT = "#B9CDBB";
const GRAY = "#6E7C74";

const LEDGER_ICON_TONES = ["#EC6FA0", "#3B82C9", "#2E9E5B", "#8B5CF6"];

function badgeEmoji(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("dompet")) return "👛";
  if (t.includes("detektif") || t.includes("bocor")) return "🕵️";
  if (t.includes("budget") || t.includes("anggaran")) return "📊";
  if (t.includes("lapar") || t.includes("checkout")) return "🛍️";
  return "🏅";
}

function motivationalText(percent: number): string {
  if (percent >= 80) return "Tuntas mantap! Terus dipertahankan, ya! 💪";
  if (percent >= 50) return "Sudah on track! Sedikit lagi makin cageur.";
  return "Langkah awal yang bagus, terus lanjut, ya! 🌱";
}

/**
 * Muat 2 font karakter (Roboto Slab buat display, Space Mono buat data ala
 * cetakan buku tabungan) lewat Google Fonts. Dibatasi timeout 2.5 detik --
 * kalau gagal/lambat, canvas tetap jalan pakai fallback serif/monospace
 * generik di FONT_DISPLAY/FONT_MONO, bukan nge-hang atau gagal total.
 */
async function ensureLedgerFontsLoaded(): Promise<void> {
  if (typeof document === "undefined" || !("fonts" in document)) return;
  const linkId = "crq-share-card-fonts";
  if (!document.getElementById(linkId)) {
    const link = document.createElement("link");
    link.id = linkId;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@700;900&family=Space+Mono:wght@400;700&display=swap";
    document.head.appendChild(link);
  }
  const loadFonts = Promise.all([
    document.fonts.load('900 60px "Roboto Slab"'),
    document.fonts.load('700 32px "Roboto Slab"'),
    document.fonts.load('400 20px "Space Mono"'),
    document.fonts.load('700 20px "Space Mono"'),
  ]).catch(() => {});
  const timeout = new Promise((resolve) => setTimeout(resolve, 2500));
  await Promise.race([loadFonts, timeout]);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Gagal memuat gambar: ${src}`));
    img.src = src;
  });
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function cardShadow(ctx: CanvasRenderingContext2D) {
  ctx.shadowColor = "rgba(11,40,35,0.16)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;
}

function clearShadow(ctx: CanvasRenderingContext2D) {
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
}

function truncateToWidth(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1);
  return `${t}…`;
}

/** Pecah teks jadi larik baris (tanpa menggambar) -- dipakai kalau tinggi blok teksnya perlu diketahui dulu sebelum digambar (mis. buat penengahan vertikal). */
function computeWrappedLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines = 2): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(testLine).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  }
  if (line) lines.push(line);

  const truncated = lines.length > maxLines;
  const shown = lines.slice(0, maxLines);
  if (truncated) {
    let last = shown[shown.length - 1];
    while (ctx.measureText(`${last}…`).width > maxWidth && last.length > 1) last = last.slice(0, -1);
    shown[shown.length - 1] = `${last}…`;
  }
  return shown;
}

/** Bungkus teks rata kiri ke beberapa baris, kembalikan posisi Y setelah baris terakhir. */
function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 2): number {
  const shown = computeWrappedLines(ctx, text, maxWidth, maxLines);
  let cursorY = y;
  for (const l of shown) {
    ctx.fillText(l, x, cursorY);
    cursorY += lineHeight;
  }
  return cursorY;
}

function drawIconCircle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, bg: string, emoji: string, fontSize: number) {
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = `${fontSize}px ${FONT_BODY}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, cx, cy + 1);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

/**
 * Cap teller berputar (bagian 34, elemen ciri khas kartu ini) -- cincin
 * ganda tinta merah-bata, dirotasi seakan distempel tangan dengan sedikit
 * miring. Dijaga sederhana (teks lurus, bukan melengkung) supaya render-nya
 * selalu benar di canvas apa pun ukurannya.
 */
function drawStamp(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, rotationDeg: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((rotationDeg * Math.PI) / 180);
  ctx.globalAlpha = 0.86;
  ctx.strokeStyle = STAMP_RED;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, radius - 14, 0, Math.PI * 2);
  ctx.stroke();

  // Padding dari cincin dalam ke teks dijaga proporsional ke radius supaya
  // tidak mepet -- bintang & "CAGEUR!" & "MISI SELESAI" ditempatkan dengan
  // jarak vertikal yang cukup lega di dalam cincin dalam (radius - 14).
  ctx.fillStyle = STAMP_RED;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 34px ${FONT_MONO}`;
  ctx.fillText("★", 0, -radius * 0.44);
  ctx.font = `900 40px ${FONT_DISPLAY}`;
  ctx.fillText("CAGEUR!", 0, 3);
  ctx.font = `700 22px ${FONT_MONO}`;
  ctx.fillText("MISI SELESAI", 0, radius * 0.4);
  ctx.restore();
  ctx.globalAlpha = 1;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

/** Deretan lubang perforasi (efek "sobek di sini") di sepanjang satu garis Y. */
function drawPerforation(ctx: CanvasRenderingContext2D, y: number, xStart: number, xEnd: number, holeColor: string) {
  const spacing = 26;
  const r = 7;
  ctx.save();
  ctx.fillStyle = holeColor;
  for (let x = xStart + spacing / 2; x < xEnd; x += spacing) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Tekstur "kertas buku besar" -- garis horizontal tipis berulang, sangat samar. */
function drawLedgerPaperTexture(ctx: CanvasRenderingContext2D, top: number, bottom: number) {
  ctx.save();
  ctx.strokeStyle = LINE_FAINT;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1;
  for (let y = top; y < bottom; y += 27) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

/**
 * Membuat kartu hasil 4:5 (potret) bertema "Buku Tabungan Kecageuran" --
 * letterhead teal, medali maskot, panel saldo dengan cap teller, dan
 * "riwayat pencapaian" ala baris transaksi yang berakhir di kupon sobek
 * berisi QR ajakan main. Dijalankan sepenuhnya di browser (Canvas API),
 * tidak ada data yang dikirim ke server.
 */
export async function generateShareCardBlob(data: ShareCardData): Promise<Blob> {
  await ensureLedgerFontsLoaded();

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak didukung di perangkat ini.");

  const percent = data.maxScore > 0 ? Math.round((data.score / data.maxScore) * 100) : 0;
  const fullW = WIDTH - MARGIN * 2;
  const centerX = WIDTH / 2;

  // ---------------------------------------------------------------------
  // Latar: kertas ledger pucat + tekstur garis horizontal samar
  // ---------------------------------------------------------------------
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  drawLedgerPaperTexture(ctx, 172, HEIGHT);

  // ---------------------------------------------------------------------
  // Letterhead -- pita teal penuh lebar kanvas, logo + wordmark + subjudul
  // ---------------------------------------------------------------------
  const headerH = 184;
  ctx.fillStyle = TEAL_DEEP;
  ctx.fillRect(0, 0, WIDTH, headerH);
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, headerH - 4, WIDTH, 4);

  const logoSize = 80;
  try {
    const logoImg = await loadImage("/logo-fesbuker.svg");
    ctx.drawImage(logoImg, MARGIN, (headerH - logoSize) / 2 - 10, logoSize, logoSize);
  } catch {
    // Kalau logo gagal dimuat, lanjutkan tanpa logo alih-alih gagal total.
  }

  const wordmarkX = MARGIN + logoSize + 22;
  ctx.font = `900 38px ${FONT_DISPLAY}`;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText("CAGEUR REKENING", wordmarkX, headerH / 2);
  ctx.fillStyle = GOLD;
  ctx.fillText("QUEST", wordmarkX, headerH / 2 + 40);

  // ---------------------------------------------------------------------
  // Blok identitas -- medali maskot bundar + nama peserta di baris atas,
  // lalu PROGRAM + judul campaign di baris bawah selebar penuh kartu
  // (judul campaign dapat font sebesar nama peserta versi sebelumnya,
  // supaya dua-duanya sama-sama menonjol tapi nama tetap yang terbesar).
  // ---------------------------------------------------------------------
  const identityY = headerH + 40;
  const medalR = 78;
  const medalCx = MARGIN + medalR;
  const medalCy = identityY + medalR;

  ctx.save();
  cardShadow(ctx);
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(medalCx, medalCy, medalR, 0, Math.PI * 2);
  ctx.fill();
  clearShadow(ctx);
  ctx.restore();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(medalCx, medalCy, medalR - 6, 0, Math.PI * 2);
  ctx.stroke();

  try {
    const kangImg = await loadImage("/kang-cageur-thumbsup.svg");
    const innerR = medalR - 16;
    const kh = innerR * 2;
    const kw = kh * KANG_THUMBSUP_ASPECT;
    ctx.save();
    ctx.beginPath();
    ctx.arc(medalCx, medalCy, innerR, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(kangImg, medalCx - kw / 2, medalCy - kh / 2 + 7, kw, kh);
    ctx.restore();
  } catch {
    // Kalau gambar gagal dimuat, medali tetap tampil kosong (bingkai emas).
  }

  const idTextX = medalCx + medalR + 28;
  const idTextW = MARGIN + fullW - idTextX;
  ctx.font = `700 22px ${FONT_MONO}`;
  ctx.fillStyle = TEAL_DEEP;
  ctx.fillText("Mantap pisannn...", idTextX, medalCy - 20);
  ctx.font = `700 44px ${FONT_MONO}`;
  ctx.fillStyle = NAVY;
  ctx.fillText(truncateToWidth(ctx, data.participantName, idTextW), idTextX, medalCy + 24);

  // PROGRAM + judul campaign sengaja ditempel dekat kotak skor di bawahnya
  // (gap kecil, bukan nol) -- lihat `boxY` yang memakai jarak pendek dari
  // identityBottom, bukan lagi jarak lebar seperti sebelumnya.
  const programY = medalCy + medalR + 40;
  ctx.font = `700 22px ${FONT_MONO}`;
  ctx.fillStyle = TEAL_DEEP;
  ctx.fillText("PROGRAM", MARGIN, programY);
  ctx.font = `700 32px ${FONT_DISPLAY}`;
  ctx.fillStyle = NAVY;
  const identityBottom = wrapText(ctx, data.campaignTitle, MARGIN, programY + 38, fullW, 38, 2);

  // ---------------------------------------------------------------------
  // Kotak skor + pencapaian -- disatukan jadi SATU kotak: kolom kiri skor
  // besar, kolom kanan 2 baris statistik (quest & badge), baris motivasi
  // selebar penuh, lalu "rak badge" ala pill (emoji+nama) selebar penuh di
  // paling bawah. Cap teller menumpuk di sudut kanan atas, kali ini lebih
  // masuk ke dalam kotak (bukan cuma menyentuh tepi atas).
  // ---------------------------------------------------------------------
  const boxY = Math.max(identityBottom, medalCy + medalR) + 16;
  const boxH = 460;
  ctx.save();
  cardShadow(ctx);
  ctx.fillStyle = "#FFFFFF";
  roundedRect(ctx, MARGIN, boxY, fullW, boxH, 20);
  ctx.fill();
  clearShadow(ctx);
  ctx.restore();
  ctx.strokeStyle = LINE_FAINT;
  ctx.lineWidth = 2;
  roundedRect(ctx, MARGIN + 10, boxY + 10, fullW - 20, boxH - 20, 14);
  ctx.stroke();

  const leftColW = fullW * 0.42;
  const rightColX = MARGIN + leftColW + 24;
  const rightColW = fullW - leftColW - 24 - 24;

  ctx.font = `700 22px ${FONT_MONO}`;
  ctx.fillStyle = GOLD;
  ctx.fillText("PEROLEHAN SKOR", MARGIN + 28, boxY + 46);

  ctx.font = `900 168px ${FONT_DISPLAY}`;
  ctx.fillStyle = NAVY;
  const scoreText = `${data.score}`;
  ctx.fillText(scoreText, MARGIN + 24, boxY + 190);
  const scoreW = ctx.measureText(scoreText).width;
  ctx.font = `700 34px ${FONT_MONO}`;
  ctx.fillStyle = GRAY;
  ctx.fillText(`/ ${data.maxScore}`, MARGIN + 24 + scoreW + 12, boxY + 190);

  // Kolom kanan (quest & badge) diberi top margin ekstra supaya turun
  // sedikit, sejajar dengan tepi atas angka skor besar di kolom kiri
  // (bukan lagi mulai dari tepi paling atas kotak).
  const statsTopY = boxY + 90;
  const STAT_ROW_H = 118;

  ctx.strokeStyle = LINE_FAINT;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(MARGIN + leftColW, boxY + 30);
  ctx.lineTo(MARGIN + leftColW, statsTopY + STAT_ROW_H * 2 - 20);
  ctx.stroke();

  interface StatEntry {
    icon: string;
    iconBg: string;
    value: string;
    label: string;
  }
  const stats: StatEntry[] = [
    { icon: "✅", iconBg: "#E3F5F3", value: `${data.questCount}`, label: "QUEST SELESAI" },
    { icon: "🏅", iconBg: "#FCEFD9", value: `${data.badgeTitles.length}`, label: "BADGE DIRAIH" },
  ];
  // Label ("QUEST SELESAI"/"BADGE DIRAIH") sengaja dibuat sebesar angkanya
  // -- ditumpuk di baris kedua (bukan sebaris) supaya muat, dibedakan lewat
  // warna abu-abu + bobot huruf, bukan lewat ukuran.
  stats.forEach((stat, i) => {
    const rowTopY = statsTopY + i * STAT_ROW_H;
    if (i > 0) {
      ctx.strokeStyle = LINE_FAINT;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rightColX, rowTopY - 24);
      ctx.lineTo(rightColX + rightColW, rowTopY - 24);
      ctx.stroke();
    }
    drawIconCircle(ctx, rightColX + 28, rowTopY + 10, 26, stat.iconBg, stat.icon, 24);
    ctx.font = `900 46px ${FONT_DISPLAY}`;
    ctx.fillStyle = NAVY;
    ctx.fillText(stat.value, rightColX + 68, rowTopY + 24);
    ctx.font = `700 40px ${FONT_MONO}`;
    ctx.fillStyle = GRAY;
    ctx.fillText(stat.label, rightColX, rowTopY + 76);
  });

  ctx.font = `600 20px ${FONT_BODY}`;
  ctx.fillStyle = GRAY;
  ctx.textAlign = "center";
  ctx.fillText(truncateToWidth(ctx, motivationalText(percent), fullW - 80), centerX, boxY + 356);
  ctx.textAlign = "left";

  const shelfDividerY = boxY + 382;
  ctx.strokeStyle = LINE_FAINT;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(MARGIN + 28, shelfDividerY);
  ctx.lineTo(MARGIN + fullW - 28, shelfDividerY);
  ctx.stroke();

  // Rak badge ala pill (emoji + nama) -- maksimum 2 pill ditampilkan
  // lengkap, sisanya diringkas jadi satu pill "+N Badge Lainnya". Kalau
  // belum ada badge sama sekali, tampilkan satu pill ajakan yang ramah
  // alih-alih baris kosong.
  const badges = data.badgeTitles;
  const MAX_BADGE_PILLS = 2;
  const pillPalette = [
    { bg: "#FCE4EE", fg: NAVY },
    { bg: "#DCEAFB", fg: NAVY },
  ];
  let pillTexts: string[];
  let overflowIndex = -1;
  if (badges.length === 0) {
    pillTexts = ["Belum ada badge"];
  } else if (badges.length <= MAX_BADGE_PILLS) {
    pillTexts = badges.map((t) => `${badgeEmoji(t)} ${t}`);
  } else {
    pillTexts = badges.slice(0, MAX_BADGE_PILLS).map((t) => `${badgeEmoji(t)} ${t}`);
    pillTexts.push(`+${badges.length - MAX_BADGE_PILLS} Badge Lainnya`);
    overflowIndex = pillTexts.length - 1;
  }

  const shelfCy = shelfDividerY + (boxY + boxH - shelfDividerY) / 2;
  const pillFont = `700 21px ${FONT_MONO}`;
  ctx.font = pillFont;
  const maxPillTextW = 250;
  const truncatedPills = pillTexts.map((t) => truncateToWidth(ctx, t, maxPillTextW));
  const pillPadX = 20;
  const pillGap = 14;
  const pillH = 54;
  const pillWidths = truncatedPills.map((t) => ctx.measureText(t).width + pillPadX * 2);
  const totalPillW = pillWidths.reduce((a, b) => a + b, 0) + pillGap * (truncatedPills.length - 1);
  let pillX = centerX - totalPillW / 2;
  truncatedPills.forEach((text, i) => {
    const isOverflow = i === overflowIndex || badges.length === 0;
    const tone = isOverflow ? { bg: "#DCE7DC", fg: GRAY } : pillPalette[i % pillPalette.length];
    const w = pillWidths[i];
    ctx.fillStyle = tone.bg;
    roundedRect(ctx, pillX, shelfCy - pillH / 2, w, pillH, pillH / 2);
    ctx.fill();
    ctx.font = pillFont;
    ctx.fillStyle = tone.fg;
    ctx.textBaseline = "middle";
    ctx.fillText(text, pillX + pillPadX, shelfCy + 1);
    ctx.textBaseline = "alphabetic";
    pillX += w + pillGap;
  });

  drawStamp(ctx, MARGIN + fullW - 74, boxY + 48, 106, -11);

  // ---------------------------------------------------------------------
  // Kupon sobek -- garis perforasi di batas kertas/pita teal, lalu kupon
  // ajakan main (QR + tautan) di dalam pita teal, ditambatkan tetap dari
  // tepi bawah kanvas.
  // ---------------------------------------------------------------------
  const qrSize = 156;
  const stubH = qrSize + 100;
  const stubY = HEIGHT - stubH;

  ctx.fillStyle = TEAL_DEEP;
  ctx.fillRect(0, stubY, WIDTH, HEIGHT - stubY);
  drawPerforation(ctx, stubY, 0, WIDTH, PAPER);
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.setLineDash([9, 7]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, stubY);
  ctx.lineTo(WIDTH, stubY);
  ctx.stroke();
  ctx.restore();

  // Ajakan main + URL disatukan jadi satu blok dan ditengahkan vertikal di
  // dalam kupon (bukan lagi ditambatkan dari atas) -- baris credit di
  // paling bawah tetap punya jatah tempatnya sendiri, tidak ikut ditengahkan.
  const footerTextW = WIDTH - MARGIN - qrSize - 40 - MARGIN;
  const inviteFont = `900 34px ${FONT_DISPLAY}`;
  ctx.font = inviteFont;
  const inviteLines = computeWrappedLines(ctx, "Yuk ikutan main biar makin cageur rekeningna!", footerTextW, 2);
  const inviteLineH = 42;
  const urlFont = `700 26px ${FONT_MONO}`;
  const urlLineH = 34;
  const blockGap = 16;
  const blockH = inviteLines.length * inviteLineH + blockGap + urlLineH;
  const creditReserve = 60;
  const zoneTop = stubY + 6;
  const zoneBottom = stubY + stubH - creditReserve;
  const blockTop = zoneTop + Math.max(0, (zoneBottom - zoneTop - blockH) / 2);

  let footerCursorY = blockTop;
  ctx.font = inviteFont;
  ctx.fillStyle = "#FFFFFF";
  inviteLines.forEach((line) => {
    footerCursorY += inviteLineH;
    ctx.fillText(line, MARGIN, footerCursorY - inviteLineH * 0.25);
  });
  footerCursorY += blockGap + urlLineH;
  ctx.font = urlFont;
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText(APP_URL.replace("https://", ""), MARGIN, footerCursorY - urlLineH * 0.25);

  ctx.font = `600 24px ${FONT_BODY}`;
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.fillText("Bagian dari program CP Budker Kesejahteraan 2026", MARGIN, stubY + stubH - 22);

  const qrX = WIDTH - MARGIN - qrSize;
  const qrY = stubY + (stubH - qrSize) / 2 - 6;
  ctx.save();
  cardShadow(ctx);
  ctx.fillStyle = "#FFFFFF";
  roundedRect(ctx, qrX - 12, qrY - 12, qrSize + 24, qrSize + 24, 16);
  ctx.fill();
  clearShadow(ctx);
  ctx.restore();

  try {
    const qrDataUrl = await QRCode.toDataURL(APP_URL, {
      margin: 1,
      width: 320,
      color: { dark: NAVY, light: "#FFFFFF" },
    });
    const qrImg = await loadImage(qrDataUrl);
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
  } catch {
    // Kalau QR gagal dibuat, kartu tetap valid tanpa QR (link teks tetap ada).
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Gagal membuat gambar kartu hasil."));
    }, "image/png");
  });
}
