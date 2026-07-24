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
const MARGIN = 48;

// Rasio asli assets/kang-cageur/07-thumbsup.svg (viewBox 1128x1268). Dihardcode
// supaya tidak bergantung pada img.naturalWidth/Height, yang tidak selalu
// terisi benar untuk SVG tanpa atribut width/height eksplisit.
const KANG_THUMBSUP_ASPECT = 1128 / 1268;

const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";

const BADGE_TONES = [
  { bg: "#0F9B8E", fg: "#FFFFFF" },
  { bg: "#1B2A41", fg: "#FFFFFF" },
  { bg: "#E8A93A", fg: "#1B2A41" },
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
  ctx.shadowColor = "rgba(10,20,35,0.16)";
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 8;
}

function clearShadow(ctx: CanvasRenderingContext2D) {
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
}

/** Bungkus teks ke beberapa baris, kembalikan posisi Y setelah baris terakhir. */
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
    const r = 3 + next() * 7;
    ctx.globalAlpha = 0.1 + next() * 0.2;
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

/**
 * Membuat kartu hasil 4:5 (potret) — komposisi berlapis-lapis "kartu di
 * atas kartu" (mengikuti brief: gunakan beberapa panel supaya layout
 * terasa penuh, bukan satu panel besar dengan banyak ruang kosong).
 * Dijalankan sepenuhnya di browser (Canvas API), tidak ada data yang
 * dikirim ke server.
 */
export async function generateShareCardBlob(data: ShareCardData): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak didukung di perangkat ini.");

  const percent = data.maxScore > 0 ? Math.round((data.score / data.maxScore) * 100) : 0;

  // ---------------------------------------------------------------------
  // Latar penuh warna — gradasi teal + tekstur confetti/dot
  // ---------------------------------------------------------------------
  const bgGradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  bgGradient.addColorStop(0, "#16C2AF");
  bgGradient.addColorStop(0.5, "#0F9B8E");
  bgGradient.addColorStop(1, "#0B7368");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  drawScatterDots(ctx, { x: 0, y: 0, w: WIDTH, h: HEIGHT }, 60, ["#FFFFFF", "#F6D287", "#8FE9DB"], 11);

  const contentRight = 632; // batas kanan kolom teks header, sebelum kolom Kang Cageur

  // ---------------------------------------------------------------------
  // Header — logo chip + wordmark
  // ---------------------------------------------------------------------
  drawIconCircle(ctx, MARGIN + 26, MARGIN + 26, 26, "#F6D287", "💰", 26);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `800 22px ${FONT}`;
  ctx.fillText("CAGEUR REKENING", MARGIN + 66, MARGIN + 20);
  ctx.fillText("QUEST", MARGIN + 66, MARGIN + 46);

  // Pill "MISI SELESAI!"
  const pillY = MARGIN + 78;
  ctx.font = `800 24px ${FONT}`;
  const pillLabel = "🏆 MISI SELESAI!";
  const pillW = ctx.measureText(pillLabel).width + 44;
  const pillH = 48;
  ctx.fillStyle = "#F6D287";
  roundedRect(ctx, MARGIN, pillY, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.fillStyle = "#1B2A41";
  ctx.textBaseline = "middle";
  ctx.fillText(pillLabel, MARGIN + 22, pillY + pillH / 2 + 2);
  ctx.textBaseline = "alphabetic";

  // Kartu nama campaign
  const titleCardY = pillY + pillH + 16;
  const titleCardW = contentRight - MARGIN;
  ctx.save();
  cardShadow(ctx);
  ctx.fillStyle = "#FFFFFF";
  roundedRect(ctx, MARGIN, titleCardY, titleCardW, 168, 24);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = "#0F9B8E";
  ctx.font = `800 16px ${FONT}`;
  ctx.fillText("CAMPAIGN", MARGIN + 26, titleCardY + 34);
  ctx.fillStyle = "#1B2A41";
  ctx.font = `800 32px ${FONT}`;
  wrapText(ctx, data.campaignTitle, MARGIN + 26, titleCardY + 74, titleCardW - 52, 38, 3);

  const headerBottom = titleCardY + 168;

  // ---------------------------------------------------------------------
  // Kang Cageur — besar, kanan atas
  // ---------------------------------------------------------------------
  const kangWidth = 372;
  const kangHeight = kangWidth / KANG_THUMBSUP_ASPECT;
  const kangX = WIDTH - MARGIN - kangWidth + 24;
  const kangY = headerBottom - kangHeight + 18;
  try {
    const kangImg = await loadImage("/kang-cageur-thumbsup.svg");
    ctx.save();
    ctx.shadowColor = "rgba(10,20,35,0.25)";
    ctx.shadowBlur = 26;
    ctx.shadowOffsetY = 12;
    ctx.drawImage(kangImg, kangX, kangY, kangWidth, kangHeight);
    ctx.restore();
  } catch {
    // Kalau gambar gagal dimuat, lanjutkan tanpa maskot alih-alih gagal total.
  }

  // ---------------------------------------------------------------------
  // Kartu peserta
  // ---------------------------------------------------------------------
  let y = headerBottom + 20;
  const fullW = WIDTH - MARGIN * 2;
  const participantH = 96;
  ctx.save();
  cardShadow(ctx);
  ctx.fillStyle = "#FFFFFF";
  roundedRect(ctx, MARGIN, y, fullW, participantH, 22);
  ctx.fill();
  ctx.restore();
  drawIconCircle(ctx, MARGIN + 46, y + participantH / 2, 28, "#E3F5F3", "🙋", 26);
  ctx.fillStyle = "#9AA1A9";
  ctx.font = `800 16px ${FONT}`;
  ctx.fillText("PESERTA", MARGIN + 92, y + 38);
  ctx.fillStyle = "#1B2A41";
  ctx.font = `800 30px ${FONT}`;
  ctx.fillText(truncateToWidth(ctx, data.participantName, fullW - 140), MARGIN + 92, y + 74);

  // ---------------------------------------------------------------------
  // Kartu skor + stempel kategori
  // ---------------------------------------------------------------------
  y += participantH + 18;
  const scoreCardW = fullW * 0.62;
  const scoreCardH = 176;
  ctx.save();
  cardShadow(ctx);
  ctx.fillStyle = "#FFFFFF";
  roundedRect(ctx, MARGIN, y, scoreCardW, scoreCardH, 24);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = "#9AA1A9";
  ctx.font = `800 16px ${FONT}`;
  ctx.fillText("SKOR AKHIR", MARGIN + 28, y + 40);
  ctx.fillStyle = "#0F9B8E";
  ctx.font = `800 92px ${FONT}`;
  ctx.fillText(`${data.score}`, MARGIN + 26, y + 132);
  const scoreW = ctx.measureText(`${data.score}`).width;
  ctx.fillStyle = "#9AA1A9";
  ctx.font = `700 30px ${FONT}`;
  ctx.fillText(`/ ${data.maxScore}`, MARGIN + 26 + scoreW + 12, y + 132);
  ctx.font = `700 18px ${FONT}`;
  ctx.fillText("POIN", MARGIN + 28, y + 158);

  // Stempel kategori — dirotasi, menumpuk di sisi kanan kartu skor
  ctx.save();
  const stampCx = MARGIN + scoreCardW + (fullW - scoreCardW) / 2 + 8;
  const stampCy = y + scoreCardH / 2 + 6;
  ctx.font = `800 21px ${FONT}`;
  const stampLines = data.categoryLabel.split(" ");
  const stampMaxLineW = Math.max(...stampLines.map((w) => ctx.measureText(w).width));
  const stampW = Math.min(fullW - scoreCardW - 8, Math.max(stampMaxLineW + 40, 150));
  const stampH = 132;
  ctx.translate(stampCx, stampCy);
  ctx.rotate((-6 * Math.PI) / 180);
  ctx.fillStyle = "#F6D287";
  roundedRect(ctx, -stampW / 2, -stampH / 2, stampW, stampH, 20);
  ctx.fill();
  ctx.fillStyle = "#1B2A41";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  wrapCentered(ctx, data.categoryLabel, 0, -12, stampW - 24, 26);
  ctx.restore();
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  // ---------------------------------------------------------------------
  // Dua kartu kecil: jumlah quest & pesan motivasi
  // ---------------------------------------------------------------------
  y += scoreCardH + 18;
  const smallGap = 18;
  const smallW = (fullW - smallGap) / 2;
  const smallH = 138;

  ctx.save();
  cardShadow(ctx);
  ctx.fillStyle = "#FFFFFF";
  roundedRect(ctx, MARGIN, y, smallW, smallH, 22);
  ctx.fill();
  roundedRect(ctx, MARGIN + smallW + smallGap, y, smallW, smallH, 22);
  ctx.fill();
  ctx.restore();

  drawIconCircle(ctx, MARGIN + 40, y + 40, 24, "#E3F5F3", "✅", 22);
  ctx.fillStyle = "#1B2A41";
  ctx.font = `800 30px ${FONT}`;
  ctx.fillText(`${data.questCount}`, MARGIN + 24, y + 100);
  ctx.font = `700 19px ${FONT}`;
  ctx.fillStyle = "#374151";
  wrapText(ctx, "quest diselesaikan", MARGIN + 24, y + 128, smallW - 48, 24, 1);

  const card2X = MARGIN + smallW + smallGap;
  drawIconCircle(ctx, card2X + 40, y + 40, 24, "#FCF1DE", "🎯", 22);
  ctx.fillStyle = "#1B2A41";
  ctx.font = `700 19px ${FONT}`;
  wrapText(ctx, motivationalText(percent), card2X + 24, y + 92, smallW - 48, 25, 3);

  // ---------------------------------------------------------------------
  // Badge yang diraih
  // ---------------------------------------------------------------------
  y += smallH + 30;
  if (data.badgeTitles.length > 0) {
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `800 22px ${FONT}`;
    ctx.textAlign = "center";
    ctx.fillText(`⭐ BADGE YANG DIRAIH ⭐`, WIDTH / 2, y);
    ctx.textAlign = "left";
    y += 26;

    const badges = data.badgeTitles.slice(0, 3);
    const bGap = 18;
    const bW = (fullW - bGap * (badges.length - 1)) / badges.length;
    const bH = 128;
    ctx.save();
    cardShadow(ctx);
    ctx.fillStyle = "#FFFFFF";
    badges.forEach((_, i) => {
      const bx = MARGIN + i * (bW + bGap);
      roundedRect(ctx, bx, y, bW, bH, 20);
      ctx.fill();
    });
    ctx.restore();

    badges.forEach((title, i) => {
      const bx = MARGIN + i * (bW + bGap);
      const tone = BADGE_TONES[i % BADGE_TONES.length];
      drawIconCircle(ctx, bx + bW / 2, y + 42, 28, tone.bg, badgeEmoji(title), 26);
      ctx.fillStyle = "#1B2A41";
      ctx.font = `800 17px ${FONT}`;
      ctx.textAlign = "center";
      wrapCentered(ctx, title, bx + bW / 2, y + 92, bW - 20, 21, 2);
      ctx.textAlign = "left";
    });

    y += bH;
  }

  // ---------------------------------------------------------------------
  // Footer — ajakan main + link + QR
  // ---------------------------------------------------------------------
  const footerH = 248;
  const footerY = HEIGHT - footerH;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.2)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = -6;
  ctx.fillStyle = "#0E2A38";
  roundedRect(ctx, 0, footerY, WIDTH, footerH + 40, 40);
  ctx.fill();
  ctx.restore();

  // dekorasi koin, aman di dalam batas kanvas
  drawIconCircle(ctx, WIDTH - MARGIN - 210, footerY + 18, 16, "#F6D287", "🪙", 15);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = `800 30px ${FONT}`;
  ctx.fillText("Yuk, ikutan main juga! 👋", MARGIN, footerY + 54);

  ctx.fillStyle = "rgba(255,255,255,0.78)";
  ctx.font = `700 20px ${FONT}`;
  const subtitleEndY = wrapText(ctx, "Belajar literasi keuangan jadi seru, dapat insight, dan banyak pencapaian!", MARGIN, footerY + 90, 620, 27, 2);

  const linkPillY = subtitleEndY + 14;
  ctx.font = `800 22px ${FONT}`;
  const linkLabel = `🌐  ${APP_URL.replace("https://", "")}`;
  const linkPillW = Math.min(620, ctx.measureText(linkLabel).width + 44);
  const linkPillH = 50;
  ctx.fillStyle = "#F6D287";
  roundedRect(ctx, MARGIN, linkPillY, linkPillW, linkPillH, linkPillH / 2);
  ctx.fill();
  ctx.fillStyle = "#1B2A41";
  ctx.textBaseline = "middle";
  ctx.fillText(truncateToWidth(ctx, linkLabel, linkPillW - 36), MARGIN + 20, linkPillY + linkPillH / 2 + 2);
  ctx.textBaseline = "alphabetic";

  const qrSize = 134;
  const qrX = WIDTH - MARGIN - qrSize - 6;
  const qrY = footerY + 34;
  try {
    const qrDataUrl = await QRCode.toDataURL(APP_URL, {
      margin: 1,
      width: 300,
      color: { dark: "#1B2A41", light: "#FFFFFF" },
    });
    const qrImg = await loadImage(qrDataUrl);
    ctx.fillStyle = "#FFFFFF";
    roundedRect(ctx, qrX - 12, qrY - 12, qrSize + 24, qrSize + 24, 18);
    ctx.fill();
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = `700 16px ${FONT}`;
    ctx.textAlign = "center";
    ctx.fillText("Scan di sini!", qrX + qrSize / 2, qrY + qrSize + 34);
    ctx.textAlign = "left";
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

/** Teks rata tengah multi-baris (dipakai untuk stempel & label badge). */
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
