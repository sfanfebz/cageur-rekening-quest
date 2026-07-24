import Image from "next/image";
import Link from "next/link";

export function BudayaKerjaLogo() {
  return (
    <Link href="/hub" className="inline-flex items-center gap-2" aria-label="Budaya Kerja">
      <Image src="/logo-budaya-kerja.svg" alt="Logo Budaya Kerja" width={36} height={36} priority />
      <span className="hidden text-xs font-bold uppercase tracking-wider text-navy-500 sm:inline">Budaya Kerja</span>
    </Link>
  );
}
