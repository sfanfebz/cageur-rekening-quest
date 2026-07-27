"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button, LinkButton } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ErrorBanner } from "@/components/ui/error-banner";
import { formatDate } from "@/lib/format";
import type { AdminCampaignOption, AdminDashboardStats, AdminParticipantHistoryRow, AdminParticipantOption } from "@/lib/types";

interface AdminViewProps {
  stats: AdminDashboardStats;
  participants: AdminParticipantOption[];
  campaigns: AdminCampaignOption[];
}

type ModalKey = "reset-all" | "reset-participant" | "switch-campaign" | null;

const CAMPAIGN_STATUS_LABEL: Record<string, string> = {
  active: "Aktif",
  upcoming: "Segera Hadir",
  archived: "Arsip",
};

const PARTICIPANT_STATUS_LABEL: Record<string, string> = {
  started: "Sedang Berjalan",
  completed: "Selesai",
};

async function postJson<T = any>(url: string, body?: unknown): Promise<{ ok: boolean; message?: string } & T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await response.json().catch(() => ({}));
  return { ok: response.ok && json.ok, message: json.message, ...json };
}

export function AdminView({ stats, participants, campaigns }: AdminViewProps) {
  const router = useRouter();
  const [openModal, setOpenModal] = useState<ModalKey>(null);

  async function handleLogout() {
    await postJson("/api/admin/logout");
    router.push("/hub");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-teal-600">Panel Admin</p>
          <h1 className="font-display text-lg font-extrabold text-navy-900">Konfigurasi Aplikasi</h1>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full px-3 py-1.5 text-xs font-bold text-gray-500 transition hover:bg-gray-100 hover:text-navy-700"
        >
          Keluar
        </button>
      </div>

      {/* --------------------------------------------------------------- */}
      {/* Dashboard ringkas */}
      {/* --------------------------------------------------------------- */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Campaign Aktif</p>
          <p className="mt-1 font-display text-sm font-extrabold leading-tight text-navy-900">
            {stats.activeCampaignTitle ?? "Belum ada"}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Total Pemain Tercatat</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-navy-900">{stats.totalParticipants}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Selesai Campaign Aktif</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-teal-600">{stats.completedCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Rata-rata Skor</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-gold-600">
            {stats.averageScorePercent === null ? "-" : `${stats.averageScorePercent}%`}
          </p>
        </Card>
      </div>

      {/* --------------------------------------------------------------- */}
      {/* Aksi admin */}
      {/* --------------------------------------------------------------- */}
      <div className="flex flex-col gap-3">
        <Button variant="danger" fullWidth onClick={() => setOpenModal("reset-all")}>
          🔄 Reset Progress Semua Pemain
        </Button>
        <Button variant="secondary" fullWidth onClick={() => setOpenModal("reset-participant")}>
          👤 Reset Progress Pemain Tertentu
        </Button>
        <Button variant="secondary" fullWidth onClick={() => setOpenModal("switch-campaign")}>
          🔀 Ganti Campaign Aktif
        </Button>
        <LinkButton variant="ghost" fullWidth href="/klasemen">
          🏆 Lihat Klasemen Lengkap
        </LinkButton>
      </div>

      <ResetAllModal open={openModal === "reset-all"} onClose={() => setOpenModal(null)} onSuccess={() => router.refresh()} />
      <ResetParticipantModal
        open={openModal === "reset-participant"}
        onClose={() => setOpenModal(null)}
        onSuccess={() => router.refresh()}
        participants={participants}
      />
      <SwitchCampaignModal
        open={openModal === "switch-campaign"}
        onClose={() => setOpenModal(null)}
        onSuccess={() => router.refresh()}
        campaigns={campaigns}
      />
    </div>
  );
}

// -----------------------------------------------------------------------
// Modal 1: Reset progress semua pemain
// -----------------------------------------------------------------------
function ResetAllModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [phase, setPhase] = useState<"confirm" | "loading" | "done" | "error">("confirm");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ questRowsDeleted: number; campaignRowsDeleted: number } | null>(null);

  function reset() {
    setPhase("confirm");
    setError(null);
    setResult(null);
  }

  async function handleConfirm() {
    setPhase("loading");
    setError(null);
    const res = await postJson<{ questRowsDeleted: number; campaignRowsDeleted: number }>("/api/admin/reset-all");
    if (!res.ok) {
      setError(res.message || "Gagal reset progres.");
      setPhase("error");
      return;
    }
    setResult({ questRowsDeleted: res.questRowsDeleted, campaignRowsDeleted: res.campaignRowsDeleted });
    setPhase("done");
    onSuccess();
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        onClose();
        reset();
      }}
      title="Reset Progress Semua Pemain"
    >
      {phase === "confirm" || phase === "loading" ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-700">
            Tindakan ini akan <strong>menghapus progres quest & campaign SEMUA pemain</strong> (data identitas nama/NIP
            tidak terhapus). Peserta akan mulai dari nol lagi begitu membuka Game Hub. Tindakan ini{" "}
            <strong>tidak bisa dibatalkan</strong>.
          </p>
          <ErrorBanner message="Pastikan kamu benar-benar yakin sebelum lanjut." />
          <div className="flex gap-2">
            <Button variant="ghost" fullWidth onClick={onClose} disabled={phase === "loading"}>
              Batal
            </Button>
            <Button variant="danger" fullWidth onClick={handleConfirm} loading={phase === "loading"}>
              Ya, Reset Semua
            </Button>
          </div>
        </div>
      ) : null}

      {phase === "error" ? (
        <div className="flex flex-col gap-4">
          <ErrorBanner message={error ?? "Gagal reset progres."} />
          <Button fullWidth onClick={reset}>
            Coba Lagi
          </Button>
        </div>
      ) : null}

      {phase === "done" && result ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-700">
            ✅ Berhasil! <strong>{result.campaignRowsDeleted}</strong> baris progres campaign dan{" "}
            <strong>{result.questRowsDeleted}</strong> baris progres quest sudah dihapus dari semua pemain.
          </p>
          <Button fullWidth onClick={onClose}>
            Tutup
          </Button>
        </div>
      ) : null}
    </Modal>
  );
}

// -----------------------------------------------------------------------
// Modal 2: Reset progress pemain tertentu
// -----------------------------------------------------------------------
function ResetParticipantModal({
  open,
  onClose,
  onSuccess,
  participants,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  participants: AdminParticipantOption[];
}) {
  const [participantId, setParticipantId] = useState("");
  const [history, setHistory] = useState<AdminParticipantHistoryRow[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [phase, setPhase] = useState<"select" | "confirm" | "loading" | "done" | "error">("select");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ questRowsDeleted: number; campaignRowsDeleted: number } | null>(null);

  function reset() {
    setParticipantId("");
    setHistory(null);
    setPhase("select");
    setError(null);
    setResult(null);
  }

  async function handleSelectParticipant(id: string) {
    setParticipantId(id);
    setHistory(null);
    if (!id) return;
    setHistoryLoading(true);
    const res = await postJson<{ history: AdminParticipantHistoryRow[] }>("/api/admin/participant-history", { participantId: id });
    setHistoryLoading(false);
    if (res.ok) setHistory(res.history);
  }

  async function handleConfirm() {
    setPhase("loading");
    setError(null);
    const res = await postJson<{ questRowsDeleted: number; campaignRowsDeleted: number }>("/api/admin/reset-participant", {
      participantId,
    });
    if (!res.ok) {
      setError(res.message || "Gagal reset progres peserta.");
      setPhase("error");
      return;
    }
    setResult({ questRowsDeleted: res.questRowsDeleted, campaignRowsDeleted: res.campaignRowsDeleted });
    setPhase("done");
    onSuccess();
  }

  const selectedParticipant = participants.find((p) => p.id === participantId);

  return (
    <Modal
      open={open}
      onClose={() => {
        onClose();
        reset();
      }}
      title="Reset Progress Pemain Tertentu"
    >
      {phase === "select" ? (
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-bold text-navy-700">Pilih Peserta</label>
            <select
              value={participantId}
              onChange={(e) => handleSelectParticipant(e.target.value)}
              className="w-full rounded-2xl border-2 border-gray-200 bg-white px-4 py-3 text-sm text-navy-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-50"
            >
              <option value="">-- Pilih peserta --</option>
              {participants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({p.nip})
                </option>
              ))}
            </select>
          </div>

          {historyLoading ? <p className="text-sm text-gray-500">Memuat riwayat…</p> : null}

          {history && history.length === 0 ? (
            <p className="text-sm text-gray-500">Peserta ini belum punya riwayat progres apa pun.</p>
          ) : null}

          {history && history.length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Riwayat Progres</p>
              <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto rounded-2xl bg-gray-50 p-3">
                {history.map((row, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-navy-900">{row.campaignTitle}</p>
                      <p className="text-gray-500">
                        {PARTICIPANT_STATUS_LABEL[row.status] ?? row.status} · {row.completedQuestCount} quest ·{" "}
                        {row.totalScore}/{row.maxScore} poin
                      </p>
                    </div>
                    <span className="shrink-0 text-gray-400">{formatDate(row.completedAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <Button variant="danger" fullWidth disabled={!participantId} onClick={() => setPhase("confirm")}>
            Reset Progres Peserta Ini
          </Button>
        </div>
      ) : null}

      {phase === "confirm" || phase === "loading" ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-700">
            Progres <strong>{selectedParticipant?.fullName}</strong> di <strong>semua campaign</strong> akan dihapus dan
            tidak bisa dikembalikan. Lanjutkan?
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" fullWidth onClick={() => setPhase("select")} disabled={phase === "loading"}>
              Batal
            </Button>
            <Button variant="danger" fullWidth onClick={handleConfirm} loading={phase === "loading"}>
              Ya, Reset
            </Button>
          </div>
        </div>
      ) : null}

      {phase === "error" ? (
        <div className="flex flex-col gap-4">
          <ErrorBanner message={error ?? "Gagal reset progres peserta."} />
          <Button fullWidth onClick={() => setPhase("select")}>
            Kembali
          </Button>
        </div>
      ) : null}

      {phase === "done" && result ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-700">
            ✅ Berhasil! Progres <strong>{selectedParticipant?.fullName}</strong> sudah direset (
            {result.campaignRowsDeleted} baris campaign, {result.questRowsDeleted} baris quest).
          </p>
          <Button fullWidth onClick={onClose}>
            Tutup
          </Button>
        </div>
      ) : null}
    </Modal>
  );
}

// -----------------------------------------------------------------------
// Modal 3: Ganti campaign aktif
// -----------------------------------------------------------------------
function SwitchCampaignModal({
  open,
  onClose,
  onSuccess,
  campaigns,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  campaigns: AdminCampaignOption[];
}) {
  const [campaignId, setCampaignId] = useState("");
  const [phase, setPhase] = useState<"select" | "confirm" | "loading" | "done" | "error">("select");
  const [error, setError] = useState<string | null>(null);
  const [resultTitle, setResultTitle] = useState<string | null>(null);

  function reset() {
    setCampaignId("");
    setPhase("select");
    setError(null);
    setResultTitle(null);
  }

  async function handleConfirm() {
    setPhase("loading");
    setError(null);
    const res = await postJson<{ campaign: { title: string } }>("/api/admin/switch-campaign", { campaignId });
    if (!res.ok) {
      setError(res.message || "Gagal mengganti campaign aktif.");
      setPhase("error");
      return;
    }
    setResultTitle(res.campaign.title);
    setPhase("done");
    onSuccess();
  }

  const selectedCampaign = campaigns.find((c) => c.id === campaignId);

  return (
    <Modal
      open={open}
      onClose={() => {
        onClose();
        reset();
      }}
      title="Ganti Campaign Aktif"
    >
      {phase === "select" ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-600">
            Hanya campaign berstatus <strong>Segera Hadir</strong> yang bisa diaktifkan. Campaign aktif saat ini otomatis
            diarsipkan.
          </p>
          <div className="flex flex-col gap-2">
            {campaigns.map((c) => {
              const selectable = c.status === "upcoming";
              const isSelected = campaignId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  disabled={!selectable}
                  onClick={() => setCampaignId(c.id)}
                  className={`flex items-center justify-between rounded-2xl border-2 px-4 py-3 text-left transition ${
                    !selectable
                      ? "cursor-not-allowed border-gray-100 bg-gray-50 opacity-60"
                      : isSelected
                        ? "border-teal-500 bg-teal-50"
                        : "border-gray-200 bg-white hover:border-teal-300"
                  }`}
                >
                  <div>
                    <p className="text-sm font-bold text-navy-900">{c.title}</p>
                    <p className="text-xs text-gray-500">
                      {CAMPAIGN_STATUS_LABEL[c.status] ?? c.status} · {c.questCount} quest
                    </p>
                  </div>
                  {c.status === "active" ? <span className="text-xs font-bold text-teal-600">● Aktif</span> : null}
                </button>
              );
            })}
          </div>
          {campaigns.some((c) => c.status === "archived") ? (
            <p className="text-xs text-gray-400">
              Campaign berstatus Arsip tidak bisa dibuka lagi dari sini. Hubungi superadmin kalau perlu membuka campaign
              terdahulu.
            </p>
          ) : null}
          <Button fullWidth disabled={!campaignId} onClick={() => setPhase("confirm")}>
            Lanjut
          </Button>
        </div>
      ) : null}

      {phase === "confirm" || phase === "loading" ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-700">
            Aktifkan <strong>{selectedCampaign?.title}</strong> sebagai campaign aktif? Campaign aktif saat ini akan
            otomatis diarsipkan.
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" fullWidth onClick={() => setPhase("select")} disabled={phase === "loading"}>
              Batal
            </Button>
            <Button fullWidth onClick={handleConfirm} loading={phase === "loading"}>
              Ya, Aktifkan
            </Button>
          </div>
        </div>
      ) : null}

      {phase === "error" ? (
        <div className="flex flex-col gap-4">
          <ErrorBanner message={error ?? "Gagal mengganti campaign aktif."} />
          <Button fullWidth onClick={() => setPhase("select")}>
            Kembali
          </Button>
        </div>
      ) : null}

      {phase === "done" && resultTitle ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-700">
            ✅ Berhasil! <strong>{resultTitle}</strong> sekarang jadi campaign aktif.
          </p>
          <Button fullWidth onClick={onClose}>
            Tutup
          </Button>
        </div>
      ) : null}
    </Modal>
  );
}
