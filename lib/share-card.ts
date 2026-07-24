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
const MARGIN = 76;
const FRAME_INSET = 28;

// Rasio asli assets/kang-cageur/07-thumbsup.svg (viewBox 1128x1268). Dihardcode
// supaya tidak bergantung pada img.naturalWidth/Height, yang tidak selalu
// terisi benar untuk SVG tanpa atribut width/height eksplisit.
const KANG_THUMBSUP_ASPECT = 1128 / 1268;

const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";

const TEAL = "#0F9B8E";
const TEAL_DARK = "#0B5C55";
const NAVY = "#1B2A41";
const GOLD = "#E8A93A";
const GRAY = "#7C8A93";
const BG = "#F1FAF8";

const BADGE_TONES = [
  { bg: "#EC6FA0", fg: "#FFFFFF" },
  { bg: "#3B82C9", fg: "#FFFFFF" },
  { bg: "#2E9E5B", fg: "#FFFFFF" },
];

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
  ctx.shadowColor = "rgba(10,20,35,0.10)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;
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

/** Teks rata tengah multi-baris (dipakai untuk label kategori & badge). */
function wrapCentered(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, maxWidth: number, lineHeight: number, maxLines = 2) {
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
  const shown = lines.slice(0, maxLines);
  const startY = y - ((shown.length - 1) * lineHeight) / 2;
  shown.forEach((l, i) => ctx.fillText(l, cx, startY + i * lineHeight));
}

function truncateToWidth(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1);
  return `${t}…`;
}

function drawScatterDots(
  ctx: CanvasRenderingContext2D,
  bounds: { x: number; y: number; w: number; h: number },
  count: number,
  colors: string[],
  seed: number
) {
  let rand = seed;
  const next = () => {
    rand = (rand * 9301 + 49297) % 233280;
    return rand / 233280;
  };
  for (let i = 0; i < count; i++) {
    const x = bounds.x + next() * bounds.w;
    const y = bounds.y + next() * bounds.h;
    const r = 3 + next() * 6;
    ctx.globalAlpha = 0.06 + next() * 0.1;
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
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
 * Membuat kartu hasil 4:5 (potret) — latar terang dengan bingkai, mengikuti
 * referensi desain: teks judul & nama polos tanpa kartu, kartu skor bergaya
 * outline, pita kategori solid, baris badge dengan pembatas garis, dan
 * anotasi panah lengkung menuju QR. Dijalankan sepenuhnya di browser
 * (Canvas API), tidak ada data yang dikirim ke server.
 */
export async function generateShareCardBlob(data: ShareCardData): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak didukung di perangkat ini.");

  const percent = data.maxScore > 0 ? Math.round((data.score / data.maxScore) * 100) : 0;
  const fullW = WIDTH - MARGIN * 2;

  // ---------------------------------------------------------------------
  // Latar terang + tekstur titik halus
  // ---------------------------------------------------------------------
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  drawScatterDots(ctx, { x: 0, y: 0, w: WIDTH, h: HEIGHT }, 34, [TEAL, GOLD], 11);

  // ---------------------------------------------------------------------
  // Header — wordmark 3 baris + pill status, blob dekoratif + Kang Cageur
  // ---------------------------------------------------------------------
  const headerTop = MARGIN;
  ctx.font = `800 28px ${FONT}`;
  ctx.fillStyle = TEAL;
  ctx.fillText("CAGEUR", MARGIN, headerTop + 28);
  ctx.fillStyle = NAVY;
  ctx.fillText("REKENING", MARGIN, headerTop + 60);
  ctx.fillStyle = GOLD;
  ctx.fillText("QUEST", MARGIN, headerTop + 92);

  const pillY = headerTop + 114;
  ctx.font = `800 18px ${FONT}`;
  const pillLabel = "🏆 Misi Selesai!";
  const pillW = ctx.measureText(pillLabel).width + 40;
  const pillH = 42;
  ctx.fillStyle = "#FFFFFF";
  ctx.strokeStyle = TEAL;
  ctx.lineWidth = 2;
  roundedRect(ctx, MARGIN, pillY, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = TEAL;
  ctx.textBaseline = "middle";
  ctx.fillText(pillLabel, MARGIN + 20, pillY + pillH / 2 + 1);
  ctx.textBaseline = "alphabetic";

  // Kang Cageur — kanan atas, dengan blob lembut di belakangnya
  const kangWidth = 260;
  const kangHeight = kangWidth / KANG_THUMBSUP_ASPECT;
  const headerBottom = headerTop + 290;
  const kangX = WIDTH - MARGIN - kangWidth + 30;
  const kangY = headerBottom - kangHeight;

  ctx.save();
  ctx.fillStyle = "rgba(15,155,142,0.12)";
  ctx.beginPath();
  ctx.arc(kangX + kangWidth / 2, kangY + kangHeight * 0.55, 190, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  try {
    const kangImg = await loadImage("/kang-cageur-thumbsup.svg");
    ctx.save();
    ctx.shadowColor = "rgba(10,20,35,0.18)";
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 10;
    ctx.drawImage(kangImg, kangX, kangY, kangWidth, kangHeight);
    ctx.restore();
  } catch {
    // Kalau gambar gagal dimuat, lanjutkan tanpa maskot alih-alih gagal total.
  }

  // ---------------------------------------------------------------------
  // Judul campaign — teks polos, tanpa kartu
  // ---------------------------------------------------------------------
  const y = headerBottom + 14;
  ctx.fillStyle = TEAL;
  ctx.font = `800 15px ${FONT}`;
  ctx.fillText("CAMPAIGN", MARGIN, y + 15);
  ctx.fillStyle = NAVY;
  ctx.font = `800 38px ${FONT}`;
  const titleEndY = wrapText(ctx, data.campaignTitle, MARGIN, y + 56, fullW, 44, 2);

  // ---------------------------------------------------------------------
  // Nama peserta — satu baris, polos (jarak dihitung dari akhir judul supaya
  // tidak tabrakan saat judul campaign panjang dan membungkus 2 baris)
  // ---------------------------------------------------------------------
  const participantY = titleEndY + 4;
  ctx.font = `700 22px ${FONT}`;
  ctx.fillStyle = GRAY;
  ctx.fillText("🙋 Diselesaikan oleh", MARGIN, participantY);
  const prefixW = ctx.measureText("🙋 Diselesaikan oleh ").width;
  ctx.font = `800 26px ${FONT}`;
  ctx.fillStyle = NAVY;
  ctx.fillText(truncateToWidth(ctx, data.participantName, fullW - prefixW), MARGIN + prefixW, participantY);

  // ---------------------------------------------------------------------
  // Baris skor — kartu outline + pita kategori solid
  // ---------------------------------------------------------------------
  const scoreY = participantY + 16;
  const scoreH = 170;
  const scoreCardW = fullW * 0.6;
  const ribbonGap = 20;
  const ribbonW = fullW - scoreCardW - ribbonGap;
  const ribbonX = MARGIN + scoreCardW + ribbonGap;

  ctx.save();
  ctx.fillStyle = "#FFFFFF";
  ctx.strokeStyle = TEAL;
  ctx.lineWidth = 3;
  roundedRect(ctx, MARGIN, scoreY, scoreCardW, scoreH, 26);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = GRAY;
  ctx.font = `800 15px ${FONT}`;
  ctx.fillText("SKOR AKHIR", MARGIN + 30, scoreY + 38);
  ctx.fillStyle = TEAL;
  ctx.font = `800 84px ${FONT}`;
  ctx.fillText(`${data.score}`, MARGIN + 28, scoreY + 128);
  const scoreW = ctx.measureText(`${data.score}`).width;
  ctx.fillStyle = GRAY;
  ctx.font = `700 28px ${FONT}`;
  ctx.fillText(`/ ${data.maxScore}`, MARGIN + 28 + scoreW + 10, scoreY + 128);
  ctx.font = `700 16px ${FONT}`;
  ctx.fillStyle = NAVY;
  ctx.fillText("POIN", MARGIN + 30, scoreY + 154);

  ctx.save();
  cardShadow(ctx);
  ctx.fillStyle = TEAL_DARK;
  roundedRect(ctx, ribbonX, scoreY, ribbonW, scoreH, 26);
  ctx.fill();
  clearShadow(ctx);
  ctx.restore();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `800 22px ${FONT}`;
  ctx.textAlign = "center";
  wrapCentered(ctx, data.categoryLabel, ribbonX + ribbonW / 2, scoreY + scoreH / 2, ribbonW - 32, 27, 3);
  ctx.textAlign = "left";

  // ---------------------------------------------------------------------
  // Kartu gabungan: jumlah quest + pesan motivasi, dipisah garis tengah
  // ---------------------------------------------------------------------
  const questY = scoreY + scoreH + 16;
  const questH = 130;
  ctx.save();
  ctx.fillStyle = "#FFFFFF";
  ctx.strokeStyle = "#DCEAE7";
  ctx.lineWidth = 2;
  roundedRect(ctx, MARGIN, questY, fullW, questH, 22);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  const midX = MARGIN + fullW / 2;
  ctx.strokeStyle = "#DCEAE7";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(midX, questY + 20);
  ctx.lineTo(midX, questY + questH - 20);
  ctx.stroke();

  drawIconCircle(ctx, MARGIN + 50, questY + 62, 26, "#E3F5F3", "✅", 22);
  ctx.fillStyle = NAVY;
  ctx.font = `800 32px ${FONT}`;
  ctx.fillText(`${data.questCount}`, MARGIN + 96, questY + 55);
  ctx.font = `700 17px ${FONT}`;
  ctx.fillStyle = GRAY;
  wrapText(ctx, "quest diselesaikan", MARGIN + 96, questY + 86, midX - (MARGIN + 96) - 16, 22, 2);

  drawIconCircle(ctx, midX + 50, questY + 62, 26, "#FCF1DE", "🎯", 22);
  ctx.fillStyle = NAVY;
  ctx.font = `700 18px ${FONT}`;
  wrapText(ctx, motivationalText(percent), midX + 96, questY + 52, MARGIN + fullW - (midX + 96) - 14, 24, 3);

  // ---------------------------------------------------------------------
  // Label badge (dengan garis pendamping kiri-kanan) + baris badge,
  // dipisah garis vertikal antar item — dilewati kalau tidak ada badge.
  // ---------------------------------------------------------------------
  const badges = data.badgeTitles.slice(0, 3);
  const labelY = questY + questH + 40;
  const badgeRowY = labelY + 24;
  const badgeRowH = 130;
  if (badges.length > 0) {
    const labelText = "BADGE YANG DIRAIH";
    ctx.font = `800 18px ${FONT}`;
    ctx.fillStyle = NAVY;
    ctx.textAlign = "center";
    ctx.fillText(labelText, WIDTH / 2, labelY);
    ctx.textAlign = "left";
    const labelW = ctx.measureText(labelText).width;
    ctx.strokeStyle = "#C9DEDA";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(MARGIN, labelY - 6);
    ctx.lineTo(WIDTH / 2 - labelW / 2 - 20, labelY - 6);
    ctx.moveTo(WIDTH / 2 + labelW / 2 + 20, labelY - 6);
    ctx.lineTo(WIDTH - MARGIN, labelY - 6);
    ctx.stroke();

    ctx.save();
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#DCEAE7";
    ctx.lineWidth = 2;
    roundedRect(ctx, MARGIN, badgeRowY, fullW, badgeRowH, 22);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    const colW = fullW / badges.length;
    badges.forEach((title, i) => {
      const colX = MARGIN + i * colW;
      if (i > 0) {
        ctx.strokeStyle = "#DCEAE7";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(colX, badgeRowY + 18);
        ctx.lineTo(colX, badgeRowY + badgeRowH - 18);
        ctx.stroke();
      }
      const tone = BADGE_TONES[i % BADGE_TONES.length];
      const iconCx = colX + 46;
      const iconCy = badgeRowY + badgeRowH / 2;
      drawIconCircle(ctx, iconCx, iconCy, 27, tone.bg, badgeEmoji(title), 24);
      ctx.fillStyle = NAVY;
      ctx.font = `800 16px ${FONT}`;
      const textX = iconCx + 40;
      const textMaxW = colW - (textX - colX) - 16;
      wrapText(ctx, title, textX, iconCy - 8, textMaxW, 21, 2);
    });
  }

  // ---------------------------------------------------------------------
  // Footer — ajakan main dengan kata tersorot + anotasi QR panah lengkung
  // ---------------------------------------------------------------------
  const footerY = badges.length > 0 ? badgeRowY + badgeRowH + 34 : badgeRowY + 34;
  const qrSize = 128;
  const qrX = WIDTH - MARGIN - qrSize;
  const qrY = footerY;

  ctx.fillStyle = NAVY;
  ctx.font = `800 26px ${FONT}`;
  ctx.fillText("Yuk mainkan juga &", MARGIN, footerY + 26);

  const line2Y = footerY + 62;
  ctx.font = `800 26px ${FONT}`;
  ctx.fillText("raih ", MARGIN, line2Y);
  const raihW = ctx.measureText("raih ").width;

  const hlText = "insight";
  ctx.font = `800 26px ${FONT}`;
  const hlW = ctx.measureText(hlText).width;
  const hlX = MARGIN + raihW;
  ctx.fillStyle = "#FBE3AE";
  roundedRect(ctx, hlX - 6, line2Y - 24, hlW + 12, 34, 8);
  ctx.fill();
  ctx.fillStyle = NAVY;
  ctx.fillText(hlText, hlX, line2Y);

  ctx.font = `800 26px ${FONT}`;
  ctx.fillText(" serumu sendiri!", hlX + hlW, line2Y);

  ctx.font = `italic 600 18px ${FONT}`;
  ctx.fillStyle = GRAY;
  ctx.fillText("Scan untuk ikutan main ya ✨", MARGIN, line2Y + 44);

  drawCurvedArrow(
    ctx,
    { x: MARGIN + 300, y: line2Y + 40 },
    { x: qrX - 90, y: line2Y + 70 },
    { x: qrX - 16, y: qrY + qrSize / 2 + 4 },
    TEAL
  );

  ctx.save();
  ctx.fillStyle = "#FFFFFF";
  ctx.strokeStyle = TEAL;
  ctx.lineWidth = 2.5;
  roundedRect(ctx, qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 18);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  try {
    const qrDataUrl = await QRCode.toDataURL(APP_URL, {
      margin: 1,
      width: 300,
      color: { dark: NAVY, light: "#FFFFFF" },
    });
    const qrImg = await loadImage(qrDataUrl);
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
  } catch {
    // Kalau QR gagal dibuat, kartu tetap valid tanpa QR (link teks tetap ada).
  }

  ctx.fillStyle = GRAY;
  ctx.font = `700 14px ${FONT}`;
  ctx.textAlign = "right";
  ctx.fillText(APP_URL.replace("https://", ""), qrX + qrSize, qrY + qrSize + 30);
  ctx.textAlign = "left";

  // ---------------------------------------------------------------------
  // Bingkai luar — digambar terakhir supaya selalu di atas
  // ---------------------------------------------------------------------
  ctx.save();
  ctx.strokeStyle = TEAL;
  ctx.lineWidth = 6;
  roundedRect(
    ctx,
    FRAME_INSET,
    FRAME_INSET,
    WIDTH - FRAME_INSET * 2,
    HEIGHT - FRAME_INSET * 2,
    40
  );
  ctx.stroke();
  ctx.restore();

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Gagal membuat gambar kartu hasil."));
    }, "image/png");
  });
}
