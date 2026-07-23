import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = { title: "Cageur Rekening Quest", description: "Misi kecil buat rekening yang makin cageur." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
