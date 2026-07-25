import Link from "next/link";

export function BudayaKerjaLogo() {
  return (
    <Link href="/hub" className="inline-flex items-center gap-2" aria-label="Cageur Rekening Quest">
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG lokal, tidak perlu optimisasi next/image */}
      <img src="/logo-fesbuker.svg" alt="" width={36} height={36} className="h-9 w-9 shrink-0" />
      <span className="flex flex-col items-start text-left leading-tight">
        <span className="font-display text-xs font-extrabold uppercase tracking-wide text-navy-900">
          Cageur Rekening Quest
        </span>
        <span className="text-[10px] font-normal text-gray-500">Change Program BI Jabar</span>
      </span>
    </Link>
  );
}
