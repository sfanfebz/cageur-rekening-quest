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
    const r = 3 + next() * 8;
    ctx.globalAlpha = 0.1 + next() * 0.22;
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawGlow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha: number) {
  const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
  glow.addColorStop(0, color);
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.globalAlpha = alpha;
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

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

  // ---------------------------------------------------------------------
  // Latar penuh warna (bukan putih polos) — gradasi teal ke navy + tekstur
  // ---------------------------------------------------------------------
  const bgGradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  bgGradient.addColorStop(0, "#14B8A8");
  bgGradient.addColorStop(0.55, "#0F9B8E");
  bgGradient.addColorStop(1, "#152036");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawGlow(ctx, WIDTH - 60, 40, 320, "#F6D287", 0.35);
  drawGlow(ctx, 40, HEIGHT - 120, 380, "#FFFFFF", 0.12);
  drawGlow(ctx, WIDTH * 0.75, HEIGHT * 0.62, 260, "#FFFFFF", 0.08);

  drawScatterDots(ctx, { x: 0, y: 0, w: WIDTH, h: HEIGHT }, 46, ["#FFFFFF", "#F6D287", "#7BE0D2"], 7);

  // ---------------------------------------------------------------------
  // Header — nama campaign
  // ---------------------------------------------------------------------
  const headerTop = 76;
  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.font = `800 24px ${FONT}`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText("CAGEUR REKENING QUEST", MARGIN, headerTop);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = `800 52px ${FONT}`;
  const afterTitleY = wrapText(ctx, data.campaignTitle, MARGIN, headerTop + 68, WIDTH - MARGIN * 2, 58, 2);

  // Stempel kategori — sedikit dirotasi biar terasa "poster"
  const stampY = afterTitleY + 44;
  ctx.save();
  ctx.font = `800 30px ${FONT}`;
  const stampPaddingX = 26;
  const stampTextWidth = ctx.measureText(data.categoryLabel).width;
  const stampWidth = stampTextWidth + stampPaddingX * 2;
  const stampHeight = 60;
  ctx.translate(MARGIN + stampWidth / 2, stampY);
  ctx.rotate((-3 * Math.PI) / 180);
  ctx.fillStyle = "#F6D287";
  roundedRect(ctx, -stampWidth / 2, -stampHeight / 2, stampWidth, stampHeight, stampHeight / 2);
  ctx.fill();
  ctx.fillStyle = "#1B2A41";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(data.categoryLabel, 0, 2);
  ctx.restore();
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  // ---------------------------------------------------------------------
  // Zona tengah: Kang Cageur (kiri) + panel skor putih mengambang (kanan)
  // ---------------------------------------------------------------------
  const midTop = stampY + 70;
  const midBottom = HEIGHT - 210;

  const cardX = 468;
  const cardW = WIDTH - MARGIN - cardX;
  const cardH = midBottom - midTop;
  ctx.save();
  ctx.shadowColor = "rgba(10,20,35,0.35)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 18;
  ctx.fillStyle = "#FFFFFF";
  roundedRect(ctx, cardX, midTop, cardW, cardH, 36);
  ctx.fill();
  ctx.restore();

  // Kang Cageur — besar, disandarkan tengah secara vertikal di kolom kiri
  const kangWidth = 430;
  const kangHeight = kangWidth / KANG_THUMBSUP_ASPECT;
  const kangX = MARGIN - 36;
  const kangSlotHeight = midBottom - midTop;
  const kangY = midTop + (kangSlotHeight - kangHeight) / 2 + 30;
  try {
    const kangImg = await loadImage("/kang-cageur-thumbsup.svg");
    ctx.save();
    ctx.shadowColor = "rgba(10,20,35,0.3)";
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 14;
    ctx.drawImage(kangImg, kangX, kangY, kangWidth, kangHeight);
    ctx.restore();
  } catch {
    // Kalau gambar gagal dimuat, lanjutkan tanpa maskot alih-alih gagal total.
  }

  // ---------------------------------------------------------------------
  // Isi panel putih — hasil pemain
  // ---------------------------------------------------------------------
  const padX = 44;
  const colX = cardX + padX;
  const colWidth = cardW - padX * 2;
  let cursorY = midTop + 64;

  ctx.fillStyle = "#6B7280";
  ctx.font = `700 24px ${FONT}`;
  ctx.fillText("Kerja bagus,", colX, cursorY);
  cursorY += 42;

  ctx.fillStyle = "#1B2A41";
  ctx.font = `800 38px ${FONT}`;
  cursorY = wrapText(ctx, `${data.participantName}!`, colX, cursorY, colWidth, 44, 2);
  cursorY += 30;

  ctx.strokeStyle = "#EEF1F5";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(colX, cursorY);
  ctx.lineTo(colX + colWidth, cursorY);
  ctx.stroke();
  cursorY += 54;

  ctx.fillStyle = "#0F9B8E";
  ctx.font = `800 118px ${FONT}`;
  ctx.fillText(`${data.score}`, colX, cursorY + 96);
  const scoreWidth = ctx.measureText(`${data.score}`).width;
  ctx.fillStyle = "#9AA1A9";
  ctx.font = `700 28px ${FONT}`;
  ctx.fillText(`/ ${data.maxScore}`, colX + scoreWidth + 14, cursorY + 96);
  ctx.font = `700 20px ${FONT}`;
  ctx.fillText("POIN", colX, cursorY + 128);
  cursorY += 168;

  ctx.fillStyle = "#374151";
  ctx.font = `700 26px ${FONT}`;
  ctx.fillText(`✅ ${data.questCount} quest diselesaikan`, colX, cursorY);
  cursorY += 40;

  if (data.rank) {
    ctx.fillText(`🏁 Ranking #${data.rank}`, colX, cursorY);
    cursorY += 40;
  }

  if (data.badgeTitles.length > 0) {
    cursorY += 18;
    ctx.font = `700 21px ${FONT}`;
    for (const title of data.badgeTitles.slice(0, 3)) {
      const label = `🏅 ${title}`;
      const truncated = label.length > 27 ? `${label.slice(0, 25)}…` : label;
      const textWidth = ctx.measureText(truncated).width;
      const pillH = 40;
      ctx.fillStyle = "#FCF1DE";
      roundedRect(ctx, colX, cursorY, textWidth + 28, pillH, pillH / 2);
      ctx.fill();
      ctx.fillStyle = "#1B2A41";
      ctx.textBaseline = "middle";
      ctx.fillText(truncated, colX + 14, cursorY + pillH / 2 + 1);
      ctx.textBaseline = "alphabetic";
      cursorY += pillH + 10;
    }
  }

  // ---------------------------------------------------------------------
  // Footer — ajakan main + QR
  // ---------------------------------------------------------------------
  const footerY = HEIGHT - 168;
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(MARGIN, footerY);
  ctx.lineTo(WIDTH - MARGIN, footerY);
  ctx.stroke();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = `800 30px ${FONT}`;
  ctx.fillText("Yuk, ikutan main juga! 🎮", MARGIN, footerY + 54);

  ctx.fillStyle = "#F6D287";
  ctx.font = `700 27px ${FONT}`;
  ctx.fillText(APP_URL.replace("https://", ""), MARGIN, footerY + 94);

  const qrSize = 130;
  const qrX = WIDTH - MARGIN - qrSize - 4;
  const qrY = footerY + 18;
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
