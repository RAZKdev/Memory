import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MemoryVault — Sistem Konteks & Memori Teknis",
  description:
    "Sistem memori dan konteks teknis privat lintas proyek untuk mendokumentasikan keputusan arsitektural, catatan teknis, dan sumber rujukan AI tanpa halusinasi.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0f17",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body className="bg-archive-bg text-archive-primary antialiased min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
