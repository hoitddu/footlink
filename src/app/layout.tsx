import type { Metadata } from "next";
import localFont from "next/font/local";
import { Space_Grotesk } from "next/font/google";

import "@/app/globals.css";

const koreanFont = localFont({
  src: "./fonts/PretendardVariable.ttf",
  variable: "--font-korean",
  display: "swap",
});

const brandFont = Space_Grotesk({
  variable: "--font-brand",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: "FootLink",
  description: "수원 풋살 매치를 가장 빠르게 연결하는 FootLink MVP",
  other: { viewport: "width=device-width, initial-scale=1, viewport-fit=cover" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${koreanFont.variable} ${brandFont.variable} min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  );
}
