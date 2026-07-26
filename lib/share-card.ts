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

const WIDTH = 1080;
const HEIGHT = 1350;
const MARGIN = 56;

// Rasio asli assets/kang-cageur/07-thumbsup.svg (viewBox 1128x1268). Dihardcode
// supaya tidak bergantung pada img.naturalWidth/Height, yang tidak selalu
// terisi benar untuk SVG tanpa atribut width/height eksplisit.
const KANG_THUMBSUP_ASPECT = 1128 / 1268;

const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";

const TEAL_DARK = "#0B5C55";
const NAVY = "#1B2A41";
const GOLD = "#E8A93A";
const GRAY = "#7C8A93";

const BADGE_TONES = [
  { bg: "#EC6FA0" },
  { bg: "#3B82C9" },
  { bg: "#2E9E5B" },
  { bg: "#E8A93A" },
  { bg: "#8B5CF6" },
];

// Berapa banyak ikon badge yang ditampilkan penuh sebelum sisanya diringkas
// jadi satu chip "+N lainnya" -- inilah kunci yang bikin tinggi kartu selalu
// tetap (fixed) berapa pun jumlah badge yang diraih pemain, alih-alih terus
// bertambah tinggi ke bawah seperti desain lama (itu penyebab footer
// terpotong keluar kanvas kalau badge-nya banyak).
const MAX_BADGE_ICONS = 5;

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
  ctx.shadowColor = "rgba(6,20,25,0.22)";
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 8;
}

function clearShadow(ctx: CanvasRenderingContext2D) {
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
}

/** Bungkus teks ke beberapa baris rata kiri, kembalikan posisi Y setelah baris terakhir. */
function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 3): number {
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
    while (ctx.measureText(`${last}…`).width > maxWidth && last.length > 1) {
      last = last.slice(0, -1);
    }
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
    while (ctx.measureText(`${last}…`).width > maxWidth && last.length > 1) {
      last = last.slice(0, -1);
    }
    shown[shown.length - 1] = `${last}…`;
  }

  const startY = y - ((shown.length - 1) * lineHeight) / 2;
  shown.forEach((l, i) => ctx.fillText(l, cx, startY + i * lineHeight));
  return startY + shown.length * lineHeight;
}

function truncateToWidth(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1);
  return `${t}…`;
}

function drawIconCircle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, bg: string, emoji: string, fontSize: number) {
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = `${fontSize}px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, cx, cy + 2);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

/** Panah lengkung sederhana (kurva kuadratik + kepala panah) untuk anotasi QR. */
function drawCurvedArrow(
  ctx: CanvasRenderingContext2D,
  from: { x: number; y: number },
  ctrl: { x: number; y: number },
  to: { x: number; y: number },
  color: string
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.quadraticCurveTo(ctrl.x, ctrl.y, to.x, to.y);
  ctx.stroke();

  const angle = Math.atan2(to.y - ctrl.y, to.x - ctrl.x);
  const headLen = 11;
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - headLen * Math.cos(angle - Math.PI / 6), to.y - headLen * Math.sin(angle - Math.PI / 6));
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - headLen * Math.cos(angle + Math.PI / 6), to.y - headLen * Math.sin(angle + Math.PI / 6));
  ctx.stroke();
  ctx.restore();
}

/**
 * Latar gradasi teal + tekstur bentuk geometris (lingkaran, cincin, wajik)
 * dengan opasitas rendah supaya tidak polos tapi tetap tidak mengganggu
 * keterbacaan teks/kartu di atasnya.
 */
function drawTealBackground(ctx: CanvasRenderingContext2D) {
  const bgGradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  bgGradient.addColorStop(0, "#1AC7B4");
  bgGradient.addColorStop(0.55, "#0F9B8E");
  bgGradient.addColorStop(1, "#0A5F58");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  let rand = 42;
  const next = () => {
    rand = (rand * 9301 + 49297) % 233280;
    return rand / 233280;
  };
  const palette = ["rgba(255,255,255,0.16)", "rgba(255,255,255,0.10)", "rgba(232,169,58,0.20)"];

  for (let i = 0; i < 20; i++) {
    const x = next() * WIDTH;
    const y = next() * HEIGHT;
    const size = 50 + next() * 130;
    const kind = Math.floor(next() * 3);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(next() * Math.PI);
    const fill = palette[i % palette.length];
    if (kind === 0) {
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === 1) {
      ctx.strokeStyle = fill;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      const s = size * 0.62;
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(0, -s / 2);
      ctx.lineTo(s / 2, 0);
      ctx.lineTo(0, s / 2);
      ctx.lineTo(-s / 2, 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  for (let i = 0; i < 40; i++) {
    const x = next() * WIDTH;
    const y = next() * HEIGHT;
    const r = 2 + next() * 5;
    ctx.globalAlpha = 0.1 + next() * 0.12;
    ctx.fillStyle = i % 3 === 0 ? "#F6D287" : "#FFFFFF";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/**
 * Membuat kartu hasil 4:5 (potret) — latar gradasi teal bertekstur geometris,
 * Kang Cageur besar sebagai fokus utama di tengah atas. Desain sengaja
 * dirombak jadi satu kolom sederhana dengan tinggi TIAP bagian tetap
 * (fixed) apa pun datanya -- termasuk badge, yang di versi lama ditampilkan
 * sebagai grid dengan judul lengkap dan tinggi ikut bertambah kalau
 * badge-nya banyak, sampai mendorong footer (ajakan main + QR) keluar dari
 * kanvas. Sekarang badge cuma ditampilkan sebagai deretan ikon satu baris
 * (maksimum MAX_BADGE_ICONS, sisanya diringkas "+N") -- info intinya
 * (raih berapa badge) tetap ada tanpa bikin tinggi kartu jadi tidak
 * terduga. Dijalankan sepenuhnya di browser (Canvas API), tidak ada data
 * yang dikirim ke server.
 */
export async function generateShareCardBlob(data: ShareCardData): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak didukung di perangkat ini.");

  const percent = data.maxScore > 0 ? Math.round((data.score / data.maxScore) * 100) : 0;
  const fullW = WIDTH - MARGIN * 2;
  const centerX = WIDTH / 2;

  drawTealBackground(ctx);

  // ---------------------------------------------------------------------
  // Header — baris tunggal: logo kecil + wordmark di kiri, pill status
  // di kanan. Jauh lebih ringkas dari versi lama (wordmark 3 baris +
  // pill terpisah di bawahnya).
  // ---------------------------------------------------------------------
  const headerY = MARGIN;
  const logoSize = 60;
  try {
    const logoImg = await loadImage("/logo-fesbuker.svg");
    ctx.drawImage(logoImg, MARGIN, headerY, logoSize, logoSize);
  } catch {
    // Kalau logo gagal dimuat, lanjutkan tanpa logo alih-alih gagal total.
  }

  ctx.font = `800 24px ${FONT}`;
  ctx.fillStyle = "#FFFFFF";
  ctx.textBaseline = "middle";
  const wordmarkX = MARGIN + logoSize + 16;
  ctx.fillText("CAGEUR REKENING", wordmarkX, headerY + logoSize / 2 - 12);
  ctx.fillStyle = GOLD;
  ctx.fillText("QUEST", wordmarkX, headerY + logoSize / 2 + 14);
  ctx.textBaseline = "alphabetic";

  ctx.font = `800 22px ${FONT}`;
  const pillLabel = "🏆 Misi Selesai!";
  const pillW = ctx.measureText(pillLabel).width + 44;
  const pillH = logoSize;
  const pillX = WIDTH - MARGIN - pillW;
  ctx.save();
  cardShadow(ctx);
  ctx.fillStyle = "#FFFFFF";
  roundedRect(ctx, pillX, headerY, pillW, pillH, pillH / 2);
  ctx.fill();
  clearShadow(ctx);
  ctx.restore();
  ctx.fillStyle = TEAL_DARK;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(pillLabel, pillX + pillW / 2, headerY + pillH / 2 + 1);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  // ---------------------------------------------------------------------
  // Kang Cageur — besar, tengah, dengan lingkaran glow lembut di
  // belakang. Ukuran & posisi tetap (fixed), tidak bergantung data.
  // ---------------------------------------------------------------------
  const mascotTop = headerY + logoSize + 26;
  const kangWidth = 330;
  const kangHeight = kangWidth / KANG_THUMBSUP_ASPECT;
  const kangX = centerX - kangWidth / 2;
  const kangY = mascotTop;
  const glowCx = centerX;
  const glowCy = kangY + kangHeight * 0.5;
  const glowR = 250;

  ctx.save();
  const glow = ctx.createRadialGradient(glowCx, glowCy, glowR * 0.2, glowCx, glowCy, glowR);
  glow.addColorStop(0, "rgba(255,255,255,0.32)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(glowCx, glowCy, glowR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  try {
    const kangImg = await loadImage("/kang-cageur-thumbsup.svg");
    ctx.save();
    ctx.shadowColor = "rgba(5,15,20,0.28)";
    ctx.shadowBlur = 26;
    ctx.shadowOffsetY = 14;
    ctx.drawImage(kangImg, kangX, kangY, kangWidth, kangHeight);
    ctx.restore();
  } catch {
    // Kalau gambar gagal dimuat, lanjutkan tanpa maskot alih-alih gagal total.
  }

  // ---------------------------------------------------------------------
  // Judul campaign + nama peserta — rata tengah, dibatasi maksimum 2
  // baris (judul) supaya tinggi bagian ini selalu bisa diprediksi.
  // ---------------------------------------------------------------------
  const titleTextW = fullW - 80;
  let cursorY = mascotTop + kangHeight + 34;
  ctx.fillStyle = GOLD;
  ctx.font = `800 16px ${FONT}`;
  ctx.textAlign = "center";
  ctx.fillText("CAMPAIGN", centerX, cursorY);

  cursorY += 40;
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `800 38px ${FONT}`;
  cursorY = wrapCentered(ctx, data.campaignTitle, centerX, cursorY, titleTextW, 42, 2) - 20;

  cursorY += 20;
  ctx.font = `700 22px ${FONT}`;
  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.fillText(`🙋 ${truncateToWidth(ctx, data.participantName, titleTextW)}`, centerX, cursorY);
  ctx.textAlign = "left";

  // ---------------------------------------------------------------------
  // Skor akhir — kartu putih besar (angka skor) + pita kategori emas,
  // berdampingan. Tinggi tetap (fixed), pusat perhatian kartu.
  // ---------------------------------------------------------------------
  const scoreY = cursorY + 34;
  const scoreH = 186;
  const scoreCardW = fullW * 0.58;
  const ribbonGap = 20;
  const ribbonW = fullW - scoreCardW - ribbonGap;
  const ribbonX = MARGIN + scoreCardW + ribbonGap;

  ctx.save();
  cardShadow(ctx);
  ctx.fillStyle = "#FFFFFF";
  roundedRect(ctx, MARGIN, scoreY, scoreCardW, scoreH, 28);
  ctx.fill();
  clearShadow(ctx);
  ctx.restore();

  ctx.fillStyle = GRAY;
  ctx.font = `800 16px ${FONT}`;
  ctx.fillText("SKOR AKHIR", MARGIN + 32, scoreY + 40);
  ctx.fillStyle = TEAL_DARK;
  ctx.font = `800 88px ${FONT}`;
  ctx.fillText(`${data.score}`, MARGIN + 30, scoreY + 138);
  const scoreW = ctx.measureText(`${data.score}`).width;
  ctx.fillStyle = GRAY;
  ctx.font = `700 30px ${FONT}`;
  ctx.fillText(`/ ${data.maxScore}`, MARGIN + 30 + scoreW + 12, scoreY + 138);
  ctx.font = `700 17px ${FONT}`;
  ctx.fillStyle = NAVY;
  ctx.fillText("POIN", MARGIN + 32, scoreY + 166);

  ctx.save();
  cardShadow(ctx);
  ctx.fillStyle = GOLD;
  roundedRect(ctx, ribbonX, scoreY, ribbonW, scoreH, 28);
  ctx.fill();
  clearShadow(ctx);
  ctx.restore();
  ctx.fillStyle = NAVY;
  ctx.font = `800 30px ${FONT}`;
  ctx.textAlign = "center";
  wrapCentered(ctx, data.categoryLabel, ribbonX + ribbonW / 2, scoreY + scoreH / 2, ribbonW - 28, 34, 3);
  ctx.textAlign = "left";

  // ---------------------------------------------------------------------
  // Baris statistik — SATU baris, tinggi tetap: jumlah quest di kiri,
  // deretan ikon badge (dibatasi MAX_BADGE_ICONS + chip "+N") di kanan.
  // Inilah bagian yang dulu jadi grid badge tak terbatas tingginya --
  // sekarang selalu satu baris berapa pun jumlah badge-nya.
  // ---------------------------------------------------------------------
  const statsY = scoreY + scoreH + 22;
  const statsH = 118;
  ctx.save();
  cardShadow(ctx);
  ctx.fillStyle = "#FFFFFF";
  roundedRect(ctx, MARGIN, statsY, fullW, statsH, 24);
  ctx.fill();
  clearShadow(ctx);
  ctx.restore();

  const statsMidX = MARGIN + fullW * 0.42;
  ctx.strokeStyle = "#E2ECE9";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(statsMidX, statsY + 20);
  ctx.lineTo(statsMidX, statsY + statsH - 20);
  ctx.stroke();

  const statsCy = statsY + statsH / 2;
  drawIconCircle(ctx, MARGIN + 54, statsCy, 30, "#E3F5F3", "✅", 26);
  ctx.fillStyle = NAVY;
  ctx.font = `800 40px ${FONT}`;
  ctx.textBaseline = "middle";
  ctx.fillText(`${data.questCount}`, MARGIN + 104, statsCy - 12);
  ctx.font = `700 17px ${FONT}`;
  ctx.fillStyle = GRAY;
  ctx.fillText("Quest Selesai", MARGIN + 104, statsCy + 22);
  ctx.textBaseline = "alphabetic";

  const badgeAreaX = statsMidX + 36;
  const badgeAreaW = MARGIN + fullW - badgeAreaX - 20;
  if (data.badgeTitles.length > 0) {
    const shown = data.badgeTitles.slice(0, MAX_BADGE_ICONS);
    const overflow = data.badgeTitles.length - shown.length;
    const iconR = 26;
    const iconGap = 12;
    const chipW = overflow > 0 ? 54 : 0;
    const totalW = shown.length * (iconR * 2) + (shown.length - 1) * iconGap + (overflow > 0 ? iconGap + chipW : 0);
    let iconCx = badgeAreaX + Math.max(0, (badgeAreaW - totalW) / 2) + iconR;
    shown.forEach((title, i) => {
      const tone = BADGE_TONES[i % BADGE_TONES.length];
      drawIconCircle(ctx, iconCx, statsCy - 6, iconR, tone.bg, badgeEmoji(title), 24);
      iconCx += iconR * 2 + iconGap;
    });
    if (overflow > 0) {
      const chipX = iconCx - iconR;
      ctx.fillStyle = "#EFF3F2";
      roundedRect(ctx, chipX, statsCy - 6 - iconR, chipW, iconR * 2, iconR);
      ctx.fill();
      ctx.fillStyle = NAVY;
      ctx.font = `800 18px ${FONT}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`+${overflow}`, chipX + chipW / 2, statsCy - 6 + 1);
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
    }
    ctx.font = `700 17px ${FONT}`;
    ctx.fillStyle = GRAY;
    ctx.textAlign = "center";
    ctx.fillText(
      data.badgeTitles.length === 1 ? "1 Badge Diraih" : `${data.badgeTitles.length} Badge Diraih`,
      badgeAreaX + badgeAreaW / 2,
      statsCy + 30
    );
    ctx.textAlign = "left";
  } else {
    ctx.font = `700 18px ${FONT}`;
    ctx.fillStyle = GRAY;
    ctx.textAlign = "center";
    ctx.fillText("Belum ada badge", badgeAreaX + badgeAreaW / 2, statsCy + 6);
    ctx.textAlign = "left";
  }

  // ---------------------------------------------------------------------
  // Satu baris pesan motivasi -- ringkas, tidak makan tempat.
  // ---------------------------------------------------------------------
  const motivationY = statsY + statsH + 46;
  ctx.font = `700 22px ${FONT}`;
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.fillText(truncateToWidth(ctx, motivationalText(percent), fullW), centerX, motivationY);
  ctx.textAlign = "left";

  // ---------------------------------------------------------------------
  // Footer — selalu ditambatkan di tepi bawah kanvas. Karena semua bagian
  // di atas sekarang punya tinggi tetap (termasuk badge), footer ini
  // TIDAK PERNAH terdorong keluar kanvas apa pun jumlah datanya.
  // ---------------------------------------------------------------------
  const qrSize = 140;
  const footerH = qrSize + 44;
  const footerY = HEIGHT - MARGIN - footerH;
  const qrX = WIDTH - MARGIN - qrSize;
  const qrY = footerY;

  ctx.fillStyle = "#FFFFFF";
  ctx.font = `800 27px ${FONT}`;
  ctx.fillText("Yuk mainkan juga &", MARGIN, footerY + 28);

  const line2Y = footerY + 66;
  ctx.font = `800 27px ${FONT}`;
  ctx.fillText("raih ", MARGIN, line2Y);
  const raihW = ctx.measureText("raih ").width;

  const hlText = "insight";
  ctx.font = `800 27px ${FONT}`;
  const hlW = ctx.measureText(hlText).width;
  const hlX = MARGIN + raihW;
  ctx.fillStyle = "#FBE3AE";
  roundedRect(ctx, hlX - 6, line2Y - 25, hlW + 12, 36, 9);
  ctx.fill();
  ctx.fillStyle = NAVY;
  ctx.fillText(hlText, hlX, line2Y);

  ctx.font = `800 27px ${FONT}`;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(" serumu sendiri!", hlX + hlW, line2Y);

  ctx.font = `italic 600 18px ${FONT}`;
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillText("Scan untuk ikutan main ya ✨", MARGIN, line2Y + 42);

  drawCurvedArrow(
    ctx,
    { x: MARGIN + 290, y: line2Y + 38 },
    { x: qrX - 90, y: line2Y + 70 },
    { x: qrX - 18, y: qrY + qrSize / 2 + 4 },
    "#FFFFFF"
  );

  ctx.save();
  cardShadow(ctx);
  ctx.fillStyle = "#FFFFFF";
  roundedRect(ctx, qrX - 12, qrY - 12, qrSize + 24, qrSize + 24, 20);
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

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = `700 15px ${FONT}`;
  ctx.textAlign = "right";
  ctx.fillText(APP_URL.replace("https://", ""), qrX + qrSize, qrY + qrSize + 32);
  ctx.textAlign = "left";

  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = `600 14px ${FONT}`;
  ctx.fillText("Bagian dari program CP Budker Kesejahteraan 2026", MARGIN, qrY + qrSize + 32);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Gagal membuat gambar kartu hasil."));
    }, "image/png");
  });
}
