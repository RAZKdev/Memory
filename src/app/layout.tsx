import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MemoryVault — Private Technical Context & Memory System",
  description:
    "Private cross-project context/memory system for preserving project decisions, notes, useful context and source references for AI-assisted work.",
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
    <html lang="en" className="dark">
      <body className="bg-archive-bg text-archive-primary antialiased min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
