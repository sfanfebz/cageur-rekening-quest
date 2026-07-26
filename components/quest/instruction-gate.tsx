"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { KangCageur } from "@/components/ui/kang-cageur";

interface InstructionGateProps {
  instruction: string;
  onConfirm: () => void;
}

/**
 * Layar instruksi wajib-konfirmasi buat quest yang punya hitungan mundur
 * (quick_reaction, hidden_object) -- timer/countdown-nya BELUM mulai sama
 * sekali sebelum pemain tap "Oke, Mulai!" di sini, supaya pemain sempat
 * baca instruksi dulu dan tidak keburu kehabisan waktu di detik pertama.
 * Sengaja tidak bisa ditutup lewat backdrop/Escape (beda dari Modal biasa)
 * -- satu-satunya jalan keluar ya konfirmasi.
 */
export function InstructionGate({ instruction, onConfirm }: InstructionGateProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Instruksi quest"
    >
      <div className="animate-pop-in flex w-full max-w-sm flex-col items-center gap-3 rounded-3xl bg-white p-6 text-center shadow-e3">
        <KangCageur pose="phone-hold" size={140} />
        <p className="font-display text-base font-extrabold text-navy-900">Baca dulu, ya!</p>
        <p className="text-sm text-navy-600">{instruction}</p>
        <Button onClick={onConfirm} fullWidth>
          OKE, MULAI!
        </Button>
      </div>
    </div>
  );
}
