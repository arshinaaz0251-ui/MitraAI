import type { Metadata } from "next";
import { Inter, Noto_Sans_Telugu, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansTelugu = Noto_Sans_Telugu({
  subsets: ["telugu"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-telugu",
  display: "swap",
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-devanagari",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MitraAI — AI Guide for Digital Tasks",
  description:
    "Prototype assistant to help verify welfare scheme criteria with demo data. Independent research prototype not affiliated with any government body.",
  keywords: [
    "MitraAI",
    "welfare eligibility",
    "scheme guide",
    "digital tasks",
    "Telugu",
    "Hindi",
    "accessible assistant",
  ],
};

import { LanguageProvider } from "@/context/LanguageContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${notoSansTelugu.variable} ${notoSansDevanagari.variable}`}
    >
      <body className="min-h-screen bg-[#F7F5F0] text-[#1B2430] antialiased">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
