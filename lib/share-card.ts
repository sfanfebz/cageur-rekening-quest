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
 * KONSEP: "Buku Tabungan Kecageuran" -- kartu hasil dirombak total jadi
 * meniru halaman buku tabungan/rekening koran ala bank Indonesia (letterhead
 * teal, kolom identitas monospace, cap teller berputar, baris "riwayat
 * pencapaian" ala baris transaksi, sobekan berlubang buat kupon ajakan
 * main). Ini metafora yang pas banget buat game yang temanya literally
 * "rekening" yang "cageur" -- bukan lagi kartu game generik gradasi+maskot
 * gede seperti versi sebelumnya.
 *
 * Tiap bagian tetap punya tinggi TETAP (fixed) apa pun datanya -- termasuk
 * baris "riwayat pencapaian" (maksimum 4 slot, sisanya diringkas "+N
 * lainnya") -- prinsip ini dipertahankan dari perbaikan bug sebelumnya
 * (badge yang banyak dulu pernah mendorong footer keluar kanvas).
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

// Maksimum baris badge yang ditampilkan penuh di "riwayat pencapaian"
// sebelum sisanya diringkas jadi satu baris "+N lainnya" -- total slot
// baris (1 baris ringkasan quest + ini) SELALU 4, supaya tinggi kartu
// terprediksi berapa pun jumlah badge yang diraih pemain.
const LEDGER_BADGE_SLOTS = 3;

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

/** Bungkus teks rata kiri ke beberapa baris, kembalikan posisi Y setelah baris terakhir. */
function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 2): number {
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

  let cursorY = y;
  for (const l of shown) {
    ctx.fillText(l, x, cursorY);
    cursorY += lineHeight;
  }
  return cursorY;
}

/** Teks rata tengah multi-baris (dipakai untuk judul campaign & kategori). */
function wrapCentered(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, maxWidth: number, lineHeight: number, maxLines = 2): number {
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
  const startY = y - ((shown.length - 1) * lineHeight) / 2;
  shown.forEach((l, i) => ctx.fillText(l, cx, startY + i * lineHeight));
  return startY + shown.length * lineHeight;
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
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, radius - 11, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = STAMP_RED;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 20px ${FONT_MONO}`;
  ctx.fillText("★", 0, -radius * 0.42);
  ctx.font = `900 30px ${FONT_DISPLAY}`;
  ctx.fillText("CAGEUR!", 0, 2);
  ctx.font = `700 15px ${FONT_MONO}`;
  ctx.fillText("MISI SELESAI", 0, radius * 0.42);
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
  const headerH = 172;
  ctx.fillStyle = TEAL_DEEP;
  ctx.fillRect(0, 0, WIDTH, headerH);
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, headerH - 4, WIDTH, 4);

  const logoSize = 76;
  try {
    const logoImg = await loadImage("/logo-fesbuker.svg");
    ctx.drawImage(logoImg, MARGIN, (headerH - logoSize) / 2 - 10, logoSize, logoSize);
  } catch {
    // Kalau logo gagal dimuat, lanjutkan tanpa logo alih-alih gagal total.
  }

  const wordmarkX = MARGIN + logoSize + 22;
  ctx.font = `900 34px ${FONT_DISPLAY}`;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText("CAGEUR REKENING", wordmarkX, headerH / 2 - 6);
  ctx.fillStyle = GOLD;
  ctx.fillText("QUEST", wordmarkX, headerH / 2 + 32);
  ctx.font = `700 15px ${FONT_MONO}`;
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.fillText("· BUKU TABUNGAN KECAGEURAN ·", wordmarkX, headerH / 2 + 58);

  // ---------------------------------------------------------------------
  // Blok identitas -- medali maskot bundar + nama peserta & program ala
  // kolom data buku tabungan (font monospace).
  // ---------------------------------------------------------------------
  const identityY = headerH + 40;
  const medalR = 52;
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
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(medalCx, medalCy, medalR - 5, 0, Math.PI * 2);
  ctx.stroke();

  try {
    const kangImg = await loadImage("/kang-cageur-thumbsup.svg");
    const innerR = medalR - 14;
    const kh = innerR * 2;
    const kw = kh * KANG_THUMBSUP_ASPECT;
    ctx.save();
    ctx.beginPath();
    ctx.arc(medalCx, medalCy, innerR, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(kangImg, medalCx - kw / 2, medalCy - kh / 2 + 6, kw, kh);
    ctx.restore();
  } catch {
    // Kalau gambar gagal dimuat, medali tetap tampil kosong (bingkai emas).
  }

  const idTextX = medalCx + medalR + 26;
  const idTextW = MARGIN + fullW - idTextX;
  ctx.font = `700 14px ${FONT_MONO}`;
  ctx.fillStyle = TEAL_DEEP;
  ctx.fillText("PESERTA", idTextX, medalCy - 30);
  ctx.font = `700 26px ${FONT_MONO}`;
  ctx.fillStyle = NAVY;
  ctx.fillText(truncateToWidth(ctx, data.participantName, idTextW), idTextX, medalCy - 4);
  ctx.font = `700 14px ${FONT_MONO}`;
  ctx.fillStyle = TEAL_DEEP;
  ctx.fillText("PROGRAM", idTextX, medalCy + 24);
  ctx.font = `400 17px ${FONT_MONO}`;
  ctx.fillStyle = NAVY;
  wrapText(ctx, data.campaignTitle, idTextX, medalCy + 46, idTextW, 22, 2);

  // ---------------------------------------------------------------------
  // Panel saldo -- kotak bingkai ganda ala kotak segel, angka skor besar
  // (Roboto Slab), pita kategori, dan cap teller yang menumpuk di sudut.
  // ---------------------------------------------------------------------
  const panelY = identityY + 128;
  const panelH = 258;
  ctx.save();
  cardShadow(ctx);
  ctx.fillStyle = "#FFFFFF";
  roundedRect(ctx, MARGIN, panelY, fullW, panelH, 18);
  ctx.fill();
  clearShadow(ctx);
  ctx.restore();
  ctx.strokeStyle = LINE_FAINT;
  ctx.lineWidth = 2;
  roundedRect(ctx, MARGIN + 10, panelY + 10, fullW - 20, panelH - 20, 12);
  ctx.stroke();

  ctx.font = `700 17px ${FONT_MONO}`;
  ctx.fillStyle = GOLD;
  ctx.textAlign = "center";
  ctx.fillText("SALDO KECAGEURAN", centerX, panelY + 46);

  ctx.font = `900 128px ${FONT_DISPLAY}`;
  ctx.fillStyle = NAVY;
  const scoreText = `${data.score}`;
  const scoreW = ctx.measureText(scoreText).width;
  ctx.font = `700 34px ${FONT_MONO}`;
  const maxScoreText = `/ ${data.maxScore}`;
  const maxScoreW = ctx.measureText(maxScoreText).width;
  const scoreBlockW = scoreW + 14 + maxScoreW;
  const scoreStartX = centerX - scoreBlockW / 2;
  ctx.textAlign = "left";
  ctx.font = `900 128px ${FONT_DISPLAY}`;
  ctx.fillStyle = NAVY;
  ctx.fillText(scoreText, scoreStartX, panelY + 158);
  ctx.font = `700 34px ${FONT_MONO}`;
  ctx.fillStyle = GRAY;
  ctx.fillText(maxScoreText, scoreStartX + scoreW + 14, panelY + 158);

  ctx.font = `800 26px ${FONT_DISPLAY}`;
  ctx.fillStyle = TEAL_DEEP;
  ctx.textAlign = "center";
  wrapCentered(ctx, data.categoryLabel, centerX, panelY + 200, fullW - 260, 30, 1);

  ctx.font = `600 17px ${FONT_BODY}`;
  ctx.fillStyle = GRAY;
  ctx.fillText(truncateToWidth(ctx, motivationalText(percent), fullW - 260), centerX, panelY + 234);
  ctx.textAlign = "left";

  drawStamp(ctx, MARGIN + fullW - 60, panelY - 6, 78, -11);

  // ---------------------------------------------------------------------
  // Riwayat pencapaian -- SELALU 4 slot baris (1 ringkasan quest + maks 3
  // badge/overflow), jadi tinggi bagian ini tidak pernah berubah berapa
  // pun jumlah badge yang diraih pemain.
  // ---------------------------------------------------------------------
  const ledgerY = panelY + panelH + 34;
  ctx.font = `700 17px ${FONT_MONO}`;
  ctx.fillStyle = TEAL_DEEP;
  ctx.fillText("RIWAYAT PENCAPAIAN", MARGIN, ledgerY);
  ctx.strokeStyle = LINE_FAINT;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(MARGIN, ledgerY + 14);
  ctx.lineTo(MARGIN + fullW, ledgerY + 14);
  ctx.stroke();

  const ROW_H = 56;
  const ledgerRowsTop = ledgerY + 34;

  interface LedgerRow {
    icon: string;
    iconBg: string;
    label: string;
    muted?: boolean;
  }
  const rows: LedgerRow[] = [
    { icon: "✅", iconBg: "#E3F5F3", label: `${data.questCount} Quest Diselesaikan` },
  ];
  const badges = data.badgeTitles;
  if (badges.length <= LEDGER_BADGE_SLOTS) {
    badges.forEach((title, i) => {
      rows.push({ icon: badgeEmoji(title), iconBg: LEDGER_ICON_TONES[i % LEDGER_ICON_TONES.length], label: title });
    });
  } else {
    const shownCount = LEDGER_BADGE_SLOTS - 1;
    badges.slice(0, shownCount).forEach((title, i) => {
      rows.push({ icon: badgeEmoji(title), iconBg: LEDGER_ICON_TONES[i % LEDGER_ICON_TONES.length], label: title });
    });
    rows.push({
      icon: "➕",
      iconBg: "#DCE7DC",
      label: `+${badges.length - shownCount} Badge lainnya`,
      muted: true,
    });
  }

  // Selalu gambar SEMUA slot baris (terisi ATAU kosong) -- baris yang belum
  // terisi cuma tampil sebagai garis putus-putus kosong, persis "baris
  // kosong menunggu transaksi berikutnya" di buku tabungan asli. Ini yang
  // bikin kartu tetap terasa "dirancang penuh" walau badge-nya sedikit,
  // alih-alih ada area kosong yang keliatan seperti bagian yang rusak.
  const TOTAL_LEDGER_SLOTS = 1 + LEDGER_BADGE_SLOTS;
  for (let i = 0; i < TOTAL_LEDGER_SLOTS; i++) {
    const rowCy = ledgerRowsTop + i * ROW_H + ROW_H / 2;
    if (i > 0) {
      ctx.strokeStyle = LINE_FAINT;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.moveTo(MARGIN, rowCy - ROW_H / 2);
      ctx.lineTo(MARGIN + fullW, rowCy - ROW_H / 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    const row = rows[i];
    if (!row) continue;
    drawIconCircle(ctx, MARGIN + 24, rowCy, 22, row.iconBg, row.icon, 20);
    ctx.font = row.muted ? `400 italic 20px ${FONT_MONO}` : `700 20px ${FONT_MONO}`;
    ctx.fillStyle = row.muted ? GRAY : NAVY;
    ctx.fillText(truncateToWidth(ctx, row.label, fullW - 80), MARGIN + 62, rowCy + 7);
  }

  // ---------------------------------------------------------------------
  // Kupon sobek -- garis perforasi di batas kertas/pita teal, lalu kupon
  // ajakan main (QR + tautan) di dalam pita teal, ditambatkan tetap dari
  // tepi bawah kanvas.
  // ---------------------------------------------------------------------
  const qrSize = 130;
  const stubH = qrSize + 64;
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

  ctx.font = `700 15px ${FONT_MONO}`;
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText("✂ GUNTING & AJAK TEMAN MAIN", MARGIN, stubY + 30);

  ctx.font = `900 30px ${FONT_DISPLAY}`;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText("Coba juga ", MARGIN, stubY + 68);
  const coba = ctx.measureText("Coba juga ").width;
  const hlText = "serumu";
  const hlW = ctx.measureText(hlText).width;
  ctx.fillStyle = GOLD;
  ctx.fillText(hlText, MARGIN + coba, stubY + 68);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText("!", MARGIN + coba + hlW, stubY + 68);

  ctx.font = `400 16px ${FONT_MONO}`;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText(APP_URL.replace("https://", ""), MARGIN, stubY + 100);

  ctx.font = `600 13px ${FONT_BODY}`;
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillText("Bagian dari program CP Budker Kesejahteraan 2026", MARGIN, stubY + stubH - 16);

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
