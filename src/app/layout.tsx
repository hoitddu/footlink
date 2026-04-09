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
  description: "FootLink, the fastest way to join mercenary futsal and soccer matches in Suwon.",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "FOOTLINK",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "FOOTLINK",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FOOTLINK",
    images: ["/opengraph-image"],
  },
  icons: {
    icon: [{ url: "/footlink_logo.png", sizes: "1536x1024", type: "image/png" }],
    apple: [{ url: "/footlink_logo.png", sizes: "1536x1024", type: "image/png" }],
  },
  other: { viewport: "width=device-width, initial-scale=1, viewport-fit=cover" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" style={{ backgroundColor: "#04070d" }}>
      <body
        className={`${brandFont.variable} min-h-screen antialiased`}
        style={{ backgroundColor: "#04070d", color: "#f8faf8" }}
      >
        {children}
      </body>
    </html>
  );
}
