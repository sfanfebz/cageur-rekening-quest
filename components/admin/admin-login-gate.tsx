"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/ui/error-banner";
import { KangCageur } from "@/components/ui/kang-cageur";

/**
 * Gerbang panel admin -- muncul sebagai popup (bukan kartu inline seperti
 * gerbang Klasemen Lengkap) sesuai permintaan, supaya jelas beda konteks:
 * ini area internal, bukan fitur pemain.
 */
export function AdminLoginGate() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!passcode.trim()) return;
    setLoading(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.ok) {
        setError(body.message || "Passcode admin belum cocok. Cek deui, ya.");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Gagal menghubungi server. Coba lagi sakedap deui.");
      setLoading(false);
    }
  }

  return (
    <Modal open onClose={() => router.push("/hub")} title="🔐 Admin Area">
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <KangCageur pose="phone-hold" size={110} />
        <p className="text-sm text-gray-600">Masukkan passcode admin untuk membuka panel konfigurasi.</p>
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
          <input
            type="password"
            inputMode="text"
            autoFocus
            placeholder="Passcode admin"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className="w-full rounded-2xl border-2 border-gray-200 bg-white px-4 py-3 text-center text-base text-navy-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-50"
          />
          {error ? <ErrorBanner message={error} /> : null}
          <Button type="submit" disabled={loading || !passcode.trim()} fullWidth>
            {loading ? "Memeriksa…" : "MASUK"}
          </Button>
        </form>
      </div>
    </Modal>
  );
}
