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

/** Bungkus teks ke beberapa baris, kembalikan posisi Y setelah baris terakhir. */
function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number {
  const words = text.split(" ");
  let line = "";
  let cursorY = y;
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(testLine).width > maxWidth) {
      ctx.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, cursorY);
    cursorY += lineHeight;
  }
  return cursorY;
}

const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";

/**
 * Membuat kartu hasil 4:5 (portrait) berisi campaign, nama peserta, skor,
 * badge, Kang Cageur thumbs-up, dan ajakan main + QR code. Dijalankan
 * sepenuhnya di browser (Canvas API), tidak ada data yang dikirim ke server.
 */
export async function generateShareCardBlob(data: ShareCardData): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak didukung di perangkat ini.");

  // Latar
  ctx.fillStyle = "#F7F9F9";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Header — campaign card
  const headerY = MARGIN;
  const headerH = 210;
  const gradient = ctx.createLinearGradient(MARGIN, headerY, WIDTH - MARGIN, headerY + headerH);
  gradient.addColorStop(0, "#12B0A1");
  gradient.addColorStop(1, "#0F9B8E");
  ctx.fillStyle = gradient;
  roundedRect(ctx, MARGIN, headerY, WIDTH - MARGIN * 2, headerH, 32);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = `800 24px ${FONT}`;
  ctx.fillText("CAGEUR REKENING QUEST", MARGIN + 36, headerY + 54);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = `800 44px ${FONT}`;
  wrapText(ctx, data.campaignTitle, MARGIN + 36, headerY + 112, WIDTH - MARGIN * 2 - 72, 50);

  // Kang Cageur thumbs-up, besar di kiri (berdiri di bagian bawah area konten)
  const contentTop = headerY + headerH + 36;
  const contentBottom = HEIGHT - 216;
  const kangWidth = 440;
  const kangHeight = kangWidth / KANG_THUMBSUP_ASPECT;
  const kangX = MARGIN - 20;
  const kangY = contentBottom - kangHeight;
  try {
    const kangImg = await loadImage("/kang-cageur-thumbsup.svg");
    ctx.drawImage(kangImg, kangX, kangY, kangWidth, kangHeight);
  } catch {
    // Kalau gambar gagal dimuat, lanjutkan tanpa maskot alih-alih gagal total.
  }

  // Kolom kanan — hasil pemain
  const colX = Math.round(kangX + kangWidth + 36);
  const colWidth = WIDTH - MARGIN - colX;
  let cursorY = contentTop + 56;

  ctx.fillStyle = "#1B2A41";
  ctx.font = `700 28px ${FONT}`;
  ctx.fillText("Kerja bagus,", colX, cursorY);
  cursorY += 48;

  ctx.font = `800 40px ${FONT}`;
  cursorY = wrapText(ctx, `${data.participantName}!`, colX, cursorY, colWidth, 46);
  cursorY += 24;

  ctx.fillStyle = "#0F9B8E";
  ctx.font = `800 104px ${FONT}`;
  ctx.fillText(`${data.score}`, colX, cursorY + 88);
  const scoreWidth = ctx.measureText(`${data.score}`).width;
  ctx.fillStyle = "#6B7280";
  ctx.font = `700 28px ${FONT}`;
  ctx.fillText(`/ ${data.maxScore} poin`, colX + scoreWidth + 14, cursorY + 88);
  cursorY += 130;

  // Kategori
  ctx.font = `800 26px ${FONT}`;
  const pillPaddingX = 22;
  const pillWidth = Math.min(colWidth, ctx.measureText(data.categoryLabel).width + pillPaddingX * 2);
  const pillHeight = 52;
  ctx.fillStyle = "#FCF1DE";
  roundedRect(ctx, colX, cursorY, pillWidth, pillHeight, pillHeight / 2);
  ctx.fill();
  ctx.fillStyle = "#C98A22";
  ctx.textBaseline = "middle";
  ctx.fillText(data.categoryLabel, colX + pillPaddingX, cursorY + pillHeight / 2 + 2);
  ctx.textBaseline = "alphabetic";
  cursorY += pillHeight + 34;

  ctx.fillStyle = "#374151";
  ctx.font = `700 27px ${FONT}`;
  ctx.fillText(`✅ ${data.questCount} quest diselesaikan`, colX, cursorY);
  cursorY += 42;

  if (data.rank) {
    ctx.fillText(`🏁 Ranking #${data.rank}`, colX, cursorY);
    cursorY += 42;
  }

  if (data.badgeTitles.length > 0) {
    cursorY += 14;
    ctx.font = `700 22px ${FONT}`;
    for (const title of data.badgeTitles.slice(0, 3)) {
      ctx.fillStyle = "#FCE6C4";
      roundedRect(ctx, colX, cursorY, 26, 26, 13);
      ctx.fill();
      ctx.fillStyle = "#1B2A41";
      const label = `🏅 ${title}`;
      const truncated = label.length > 26 ? `${label.slice(0, 24)}…` : label;
      ctx.fillText(truncated, colX + 34, cursorY + 20);
      cursorY += 38;
    }
  }

  // Footer — ajakan main + QR
  const footerY = HEIGHT - 190;
  ctx.strokeStyle = "#E2E5E7";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(MARGIN, footerY);
  ctx.lineTo(WIDTH - MARGIN, footerY);
  ctx.stroke();

  ctx.fillStyle = "#1B2A41";
  ctx.font = `800 28px ${FONT}`;
  ctx.fillText("Yuk, ikutan main juga! 🎮", MARGIN, footerY + 54);

  ctx.fillStyle = "#0F9B8E";
  ctx.font = `700 26px ${FONT}`;
  ctx.fillText(APP_URL.replace("https://", ""), MARGIN, footerY + 94);

  const qrSize = 132;
  const qrX = WIDTH - MARGIN - qrSize;
  const qrY = footerY + 20;
  try {
    const qrDataUrl = await QRCode.toDataURL(APP_URL, {
      margin: 1,
      width: 300,
      color: { dark: "#1B2A41", light: "#FFFFFF" },
    });
    const qrImg = await loadImage(qrDataUrl);
    ctx.fillStyle = "#FFFFFF";
    roundedRect(ctx, qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 16);
    ctx.fill();
    ctx.strokeStyle = "#0F9B8E";
    ctx.lineWidth = 3;
    roundedRect(ctx, qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 16);
    ctx.stroke();
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
