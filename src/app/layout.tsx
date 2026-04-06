import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";

import "@/app/globals.css";

const brandFont = Space_Grotesk({
  variable: "--font-brand",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://footlink-gray.vercel.app"),
  title: "FootLink",
  description: "수원 풋살 매치를 가장 빠르게 연결하는 FootLink MVP",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "FootLink",
    description: "풋살 매칭을 가장 빠르게 연결하는 FootLink",
    images: [
      {
        url: "/og-share.png",
        width: 1200,
        height: 630,
        alt: "FootLink 풋살 매칭 서비스 공유 이미지",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FootLink",
    description: "풋살 매칭을 가장 빠르게 연결하는 FootLink",
    images: ["/og-share.png"],
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  other: { viewport: "width=device-width, initial-scale=1, viewport-fit=cover" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${brandFont.variable} min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  );
}
