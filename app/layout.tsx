import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Barlow, JetBrains_Mono } from "next/font/google";
import { SiteNav } from "@/components/gp/site-nav";
import { SiteFooter } from "@/components/gp/site-footer";
import { MobileTabBar } from "@/components/gp/mobile-tab-bar";
import "./globals.css";

const display = Bebas_Neue({
  weight: "400",
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const body = Barlow({
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aruba Solo Cup GP",
  description:
    "Family RC Grand Prix in Aruba. $500 winner-take-all. GTA-style driver dossiers. Race Control on one phone.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Solo Cup GP",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#070d12" },
    { color: "#070d12" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${body.variable} ${mono.variable} font-sans`}
      >
        <SiteNav />
        <main className="gp-main min-h-[70vh]">{children}</main>
        <SiteFooter />
        <MobileTabBar />
      </body>
    </html>
  );
}
