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
 * tanpa bingkai, dengan Kang Cageur berukuran besar sebagai fokus utama.
 * Bagian ajakan main + QR selalu ditambatkan di tepi bawah kanvas supaya
 * kartu terasa penuh di setiap ukuran konten. Dijalankan sepenuhnya di
 * browser (Canvas API), tidak ada data yang dikirim ke server.
 */
export async function generateShareCardBlob(data: ShareCardData): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak didukung di perangkat ini.");

  const percent = data.maxScore > 0 ? Math.round((data.score / data.maxScore) * 100) : 0;
  const fullW = WIDTH - MARGIN * 2;

  drawTealBackground(ctx);

  // ---------------------------------------------------------------------
  // Header — wordmark 3 baris + pill status di kolom kiri; Kang Cageur
  // besar + lingkaran glow di kolom kanan (kolom terpisah supaya karakter
  // bisa diperbesar tanpa menabrak teks judul di bawahnya)
  // ---------------------------------------------------------------------
  const contentRight = MARGIN + fullW * 0.6; // batas kanan kolom teks (wordmark, judul, nama)
  const headerTop = MARGIN;

  ctx.font = `800 34px ${FONT}`;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText("CAGEUR", MARGIN, headerTop + 32);
  ctx.fillText("REKENING", MARGIN, headerTop + 70);
  ctx.fillStyle = GOLD;
  ctx.fillText("QUEST", MARGIN, headerTop + 108);

  const pillY = headerTop + 130;
  ctx.font = `800 19px ${FONT}`;
  const pillLabel = "🏆 Misi Selesai!";
  const pillW = ctx.measureText(pillLabel).width + 42;
  const pillH = 50;
  ctx.save();
  cardShadow(ctx);
  ctx.fillStyle = "#FFFFFF";
  roundedRect(ctx, MARGIN, pillY, pillW, pillH, pillH / 2);
  ctx.fill();
  clearShadow(ctx);
  ctx.restore();
  ctx.fillStyle = TEAL_DARK;
  ctx.textBaseline = "middle";
  ctx.fillText(pillLabel, MARGIN + 21, pillY + pillH / 2 + 1);
  ctx.textBaseline = "alphabetic";

  // Kang Cageur — besar, kanan atas, dengan lingkaran glow lembut di belakang
  const kangWidth = 360;
  const kangHeight = kangWidth / KANG_THUMBSUP_ASPECT;
  const kangX = WIDTH - MARGIN - kangWidth + 34;
  const kangY = headerTop - 6;
  const glowCx = kangX + kangWidth / 2;
  const glowCy = kangY + kangHeight * 0.52;
  const glowR = 268;

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
  // Judul campaign — teks polos, dibatasi ke kolom kiri
  // ---------------------------------------------------------------------
  const titleColW = contentRight - MARGIN;
  const y = pillY + pillH + 30;
  ctx.fillStyle = GOLD;
  ctx.font = `800 17px ${FONT}`;
  ctx.fillText("CAMPAIGN", MARGIN, y);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `800 42px ${FONT}`;
  const titleEndY = wrapText(ctx, data.campaignTitle, MARGIN, y + 46, titleColW, 47, 2);

  // ---------------------------------------------------------------------
  // Nama peserta — label kecil + nama di baris sendiri (bukan satu baris
  // inline) supaya nama panjang tidak terpotong ellipsis; posisi dihitung
  // dari akhir judul supaya tidak tabrakan saat judul membungkus 2 baris.
  // ---------------------------------------------------------------------
  const participantLabelY = titleEndY + 14;
  ctx.font = `700 18px ${FONT}`;
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.fillText("🙋 DISELESAIKAN OLEH", MARGIN, participantLabelY);
  ctx.font = `800 27px ${FONT}`;
  ctx.fillStyle = "#FFFFFF";
  const participantY = participantLabelY + 34;
  ctx.fillText(truncateToWidth(ctx, data.participantName, titleColW), MARGIN, participantY);

  // ---------------------------------------------------------------------
  // Baris skor — kartu putih solid + pita kategori emas solid
  // ---------------------------------------------------------------------
  const scoreY = participantY + 34;
  const scoreH = 196;
  const scoreCardW = fullW * 0.6;
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
  ctx.font = `800 17px ${FONT}`;
  ctx.fillText("SKOR AKHIR", MARGIN + 32, scoreY + 42);
  ctx.fillStyle = TEAL_DARK;
  ctx.font = `800 96px ${FONT}`;
  ctx.fillText(`${data.score}`, MARGIN + 30, scoreY + 146);
  const scoreW = ctx.measureText(`${data.score}`).width;
  ctx.fillStyle = GRAY;
  ctx.font = `700 32px ${FONT}`;
  ctx.fillText(`/ ${data.maxScore}`, MARGIN + 30 + scoreW + 12, scoreY + 146);
  ctx.font = `700 18px ${FONT}`;
  ctx.fillStyle = NAVY;
  ctx.fillText("POIN", MARGIN + 32, scoreY + 176);

  ctx.save();
  cardShadow(ctx);
  ctx.fillStyle = GOLD;
  roundedRect(ctx, ribbonX, scoreY, ribbonW, scoreH, 28);
  ctx.fill();
  clearShadow(ctx);
  ctx.restore();
  ctx.fillStyle = NAVY;
  ctx.font = `800 25px ${FONT}`;
  ctx.textAlign = "center";
  wrapCentered(ctx, data.categoryLabel, ribbonX + ribbonW / 2, scoreY + scoreH / 2, ribbonW - 32, 30, 3);
  ctx.textAlign = "left";

  // ---------------------------------------------------------------------
  // Kartu gabungan: jumlah quest + pesan motivasi, dipisah garis tengah
  // ---------------------------------------------------------------------
  const questY = scoreY + scoreH + 20;
  const questH = 150;
  ctx.save();
  cardShadow(ctx);
  ctx.fillStyle = "#FFFFFF";
  roundedRect(ctx, MARGIN, questY, fullW, questH, 24);
  ctx.fill();
  clearShadow(ctx);
  ctx.restore();

  const midX = MARGIN + fullW / 2;
  ctx.strokeStyle = "#E2ECE9";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(midX, questY + 24);
  ctx.lineTo(midX, questY + questH - 24);
  ctx.stroke();

  drawIconCircle(ctx, MARGIN + 56, questY + 72, 30, "#E3F5F3", "✅", 26);
  ctx.fillStyle = NAVY;
  ctx.font = `800 36px ${FONT}`;
  ctx.fillText(`${data.questCount}`, MARGIN + 108, questY + 64);
  ctx.font = `700 19px ${FONT}`;
  ctx.fillStyle = GRAY;
  wrapText(ctx, "quest diselesaikan", MARGIN + 108, questY + 100, midX - (MARGIN + 108) - 16, 25, 2);

  drawIconCircle(ctx, midX + 56, questY + 72, 30, "#FCF1DE", "🎯", 26);
  ctx.fillStyle = NAVY;
  ctx.font = `700 19px ${FONT}`;
  wrapText(ctx, motivationalText(percent), midX + 108, questY + 60, MARGIN + fullW - (midX + 108) - 14, 26, 3);

  // ---------------------------------------------------------------------
  // Label badge (dengan garis pendamping kiri-kanan) + baris badge,
  // dipisah garis vertikal antar item — dilewati kalau tidak ada badge.
  // ---------------------------------------------------------------------
  const badges = data.badgeTitles.slice(0, 3);
  const labelY = questY + questH + 44;
  const badgeRowY = labelY + 28;
  const badgeRowH = 148;
  if (badges.length > 0) {
    const labelText = "BADGE YANG DIRAIH";
    ctx.font = `800 19px ${FONT}`;
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.fillText(labelText, WIDTH / 2, labelY);
    ctx.textAlign = "left";
    const labelW = ctx.measureText(labelText).width;
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(MARGIN, labelY - 6);
    ctx.lineTo(WIDTH / 2 - labelW / 2 - 20, labelY - 6);
    ctx.moveTo(WIDTH / 2 + labelW / 2 + 20, labelY - 6);
    ctx.lineTo(WIDTH - MARGIN, labelY - 6);
    ctx.stroke();

    ctx.save();
    cardShadow(ctx);
    ctx.fillStyle = "#FFFFFF";
    roundedRect(ctx, MARGIN, badgeRowY, fullW, badgeRowH, 24);
    ctx.fill();
    clearShadow(ctx);
    ctx.restore();

    const colW = fullW / badges.length;
    badges.forEach((title, i) => {
      const colX = MARGIN + i * colW;
      if (i > 0) {
        ctx.strokeStyle = "#E2ECE9";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(colX, badgeRowY + 20);
        ctx.lineTo(colX, badgeRowY + badgeRowH - 20);
        ctx.stroke();
      }
      const tone = BADGE_TONES[i % BADGE_TONES.length];
      const iconCx = colX + 52;
      const iconCy = badgeRowY + badgeRowH / 2;
      drawIconCircle(ctx, iconCx, iconCy, 31, tone.bg, badgeEmoji(title), 27);
      ctx.fillStyle = NAVY;
      ctx.font = `800 18px ${FONT}`;
      const textX = iconCx + 44;
      const textMaxW = colW - (textX - colX) - 16;
      wrapText(ctx, title, textX, iconCy - 8, textMaxW, 23, 2);
    });
  }

  // ---------------------------------------------------------------------
  // Footer — selalu ditambatkan di tepi bawah kanvas (posisi tetap dari
  // bawah, tapi bergeser turun kalau konten di atasnya ternyata lebih
  // panjang dari perkiraan, supaya tidak pernah tabrakan)
  // ---------------------------------------------------------------------
  const qrSize = 152;
  const footerH = qrSize + 46;
  const contentBottom = badges.length > 0 ? badgeRowY + badgeRowH : questY + questH;
  const footerY = Math.max(HEIGHT - MARGIN - footerH, contentBottom + 34);
  const qrX = WIDTH - MARGIN - qrSize;
  const qrY = footerY;

  ctx.fillStyle = "#FFFFFF";
  ctx.font = `800 29px ${FONT}`;
  ctx.fillText("Yuk mainkan juga &", MARGIN, footerY + 30);

  const line2Y = footerY + 70;
  ctx.font = `800 29px ${FONT}`;
  ctx.fillText("raih ", MARGIN, line2Y);
  const raihW = ctx.measureText("raih ").width;

  const hlText = "insight";
  ctx.font = `800 29px ${FONT}`;
  const hlW = ctx.measureText(hlText).width;
  const hlX = MARGIN + raihW;
  ctx.fillStyle = "#FBE3AE";
  roundedRect(ctx, hlX - 6, line2Y - 27, hlW + 12, 38, 9);
  ctx.fill();
  ctx.fillStyle = NAVY;
  ctx.fillText(hlText, hlX, line2Y);

  ctx.font = `800 29px ${FONT}`;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(" serumu sendiri!", hlX + hlW, line2Y);

  ctx.font = `italic 600 19px ${FONT}`;
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillText("Scan untuk ikutan main ya ✨", MARGIN, line2Y + 46);

  drawCurvedArrow(
    ctx,
    { x: MARGIN + 310, y: line2Y + 42 },
    { x: qrX - 100, y: line2Y + 76 },
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

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Gagal membuat gambar kartu hasil."));
    }, "image/png");
  });
}
