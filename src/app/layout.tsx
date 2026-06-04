import type { Metadata } from "next";
import "./globals.css";
import "@uploadthing/react/styles.css";

export const metadata: Metadata = {
  title: "Linchpin Studio — Content That Converts",
  description:
    "We create high-impact short-form video content, reels, and brand films for ambitious brands. Scroll-stopping creative, delivered fast.",
  keywords: ["digital marketing", "video production", "reels", "short form content", "brand films", "social media marketing"],
  openGraph: {
    title: "Linchpin Studio — Content That Converts",
    description: "High-impact video content for ambitious brands.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&f[]=satoshi@400,500,700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
