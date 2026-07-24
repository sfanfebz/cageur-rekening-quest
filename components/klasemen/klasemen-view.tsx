"use client";

import { useState, type FormEvent } from "react";
import { Card } from "@/components/ui/card";
import { Button, LinkButton } from "@/components/ui/button";
import { ErrorBanner } from "@/components/ui/error-banner";
import { KangCageur } from "@/components/ui/kang-cageur";
import { COPY } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/format";
import type { LeaderboardRow } from "@/lib/types";

export function KlasemenView() {
  const [unlocked, setUnlocked] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [campaignTitle, setCampaignTitle] = useState("");
  const [exporting, setExporting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/leaderboard/full", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.ok) {
        setError(body.message || COPY.errors.wrongPasscode);
        setLoading(false);
        return;
      }
      setRows(body.rows);
      setCampaignTitle(body.campaignTitle);
      setUnlocked(true);
      setLoading(false);
    } catch {
      setError(COPY.errors.saveFailed);
      setLoading(false);
    }
  }

  async function handleExportPdf() {
    setExporting(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      await import("jspdf-autotable");
      const doc = new jsPDF();
      doc.setFontSize(14);
      doc.text(campaignTitle || COPY.appTitle, 14, 16);
      doc.setFontSize(10);
      doc.text(`Diekspor pada ${formatDateTime(new Date())}`, 14, 22);

      // Hanya Ranking, Nama, Skor yang masuk PDF -- tanpa NIP (bagian 20B.3 & 30).
      (doc as unknown as { autoTable: (opts: Record<string, unknown>) => void }).autoTable({
        startY: 28,
        head: [["Ranking", "Nama", "Skor"]],
        body: rows.map((row) => [`#${row.rank}`, row.name, `${row.score}/${row.maxScore}`]),
        styles: { fontSize: 10 },
        headStyles: { fillColor: [20, 99, 96] },
      });

      doc.save(`klasemen-${(campaignTitle || "campaign").toLowerCase().replace(/\s+/g, "-")}.pdf`);
    } finally {
      setExporting(false);
    }
  }

  if (!unlocked) {
    return (
      <div className="flex flex-col items-center gap-6 py-10">
        <KangCageur pose="clipboard" size={110} />
        <Card className="w-full p-5">
          <h1 className="text-center text-base font-extrabold text-navy-900">{COPY.full.modalTitle}</h1>
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
            <input
              type="password"
              inputMode="text"
              placeholder={COPY.full.passcodePlaceholder}
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full rounded-2xl border-2 border-navy-100 bg-navy-50/40 px-4 py-3 text-base text-navy-900 outline-none transition focus:border-teal-500 focus:bg-white"
            />
            {error ? <ErrorBanner message={error} /> : null}
            <Button type="submit" disabled={loading || !passcode} fullWidth>
              {loading ? "Memeriksa…" : COPY.full.submit}
            </Button>
          </form>
        </Card>
        <LinkButton href="/hub" variant="ghost" fullWidth>
          {COPY.result.ctaHub}
        </LinkButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-6">
      <div className="text-center">
        <h1 className="text-lg font-extrabold text-navy-900">Klasemen Lengkap</h1>
        <p className="text-sm text-navy-500">{campaignTitle}</p>
      </div>

      <Button variant="secondary" onClick={handleExportPdf} disabled={exporting || rows.length === 0} fullWidth>
        {exporting ? "Menyiapkan PDF…" : COPY.full.exportPdf}
      </Button>

      <div className="overflow-x-auto rounded-2xl ring-1 ring-navy-900/5">
        <table className="w-full min-w-full text-left text-sm">
          <thead className="bg-navy-50 text-xs font-bold uppercase text-navy-500">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Nama</th>
              <th className="px-3 py-2">Skor</th>
              <th className="px-3 py-2">Quest</th>
              <th className="px-3 py-2">Selesai</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.rank} className="border-t border-navy-100">
                <td className="px-3 py-2 font-bold text-navy-700">{row.rank}</td>
                <td className="px-3 py-2 font-semibold text-navy-800">{row.name}</td>
                <td className="px-3 py-2 text-navy-700">
                  {row.score}/{row.maxScore}
                </td>
                <td className="px-3 py-2 text-navy-500">{row.questsCompleted}</td>
                <td className="px-3 py-2 text-navy-500">{formatDate(row.completedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 ? <p className="py-6 text-center text-sm text-navy-400">Belum ada peserta yang menyelesaikan campaign ini.</p> : null}

      <LinkButton href="/hub" variant="ghost" fullWidth>
        {COPY.result.ctaHub}
      </LinkButton>
    </div>
  );
}
