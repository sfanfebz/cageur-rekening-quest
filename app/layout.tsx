import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Baloo_2, Nunito } from "next/font/google";
import { BudayaKerjaLogo } from "@/components/ui/logo";
import { MuteToggle } from "@/components/ui/mute-toggle";
import { MusicMuteToggle } from "@/components/ui/music-mute-toggle";
import { IconGembok } from "@/components/ui/icons";
import "@/app/globals.css";

const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-baloo",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cageur Rekening Quest",
  description: "Game edukasi literasi keuangan untuk program budaya kerja CAGEUR – Cageur Rekening.",
  icons: {
    icon: "/logo-fesbuker.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0F9B8E",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${baloo.variable} ${nunito.variable}`}>
      <body className="min-h-dvh bg-gray-50 font-sans text-navy-900 antialiased">
        <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-gray-50 shadow-xl shadow-navy-900/5">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white/90 px-4 py-3 backdrop-blur">
            <BudayaKerjaLogo />
            <div className="flex items-center gap-1.5">
              <MusicMuteToggle />
              <MuteToggle />
              <Link
                href="/admin"
                aria-label="Admin"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-navy-700 transition hover:bg-teal-50 hover:text-teal-600 active:scale-95"
              >
                <IconGembok size={18} />
              </Link>
            </div>
          </header>
          <main className="flex-1 px-4 pb-10 pt-4">{children}</main>
          <footer className="px-4 pb-4 text-center text-[10px] text-gray-400">
            Bagian dari program CP Budker Kesejahteraan 2026
          </footer>
        </div>
      </body>
    </html>
  );
}
