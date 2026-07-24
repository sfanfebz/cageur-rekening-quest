import type { Metadata, Viewport } from "next";
import { BudayaKerjaLogo } from "@/components/ui/logo";
import { MuteToggle } from "@/components/ui/mute-toggle";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Cageur Rekening Quest",
  description: "Game edukasi literasi keuangan untuk program budaya kerja CAGEUR – Cageur Rekening.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#146360",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-dvh bg-teal-50 font-sans text-navy-900 antialiased">
        <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-[#f4f8f7] shadow-xl shadow-navy-900/5">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-navy-900/5 bg-white/90 px-4 py-3 backdrop-blur">
            <BudayaKerjaLogo />
            <MuteToggle />
          </header>
          <main className="flex-1 px-4 pb-10 pt-4">{children}</main>
        </div>
      </body>
    </html>
  );
}
