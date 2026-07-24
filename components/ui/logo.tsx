import Link from "next/link";

export function BudayaKerjaLogo() {
  return (
    <Link href="/hub" className="inline-flex items-center gap-2" aria-label="Budaya Kerja">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-navy-900 font-display text-xs font-bold text-white">
        BK
      </span>
      <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-600">Budaya Kerja</span>
    </Link>
  );
}
