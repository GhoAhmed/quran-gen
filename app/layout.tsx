import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "./components/ui/navbar";

export const metadata: Metadata = {
  title: "Quran Studio — Create beautiful recitation videos",
  description:
    "Pick a surah, choose verses, select a reciter, and export a shareable recitation video.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#0a0f1c] text-gray-100">
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}