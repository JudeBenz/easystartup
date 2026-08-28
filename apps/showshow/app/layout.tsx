import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Atkinson_Hyperlegible, Big_Shoulders } from "next/font/google";
import { DEFAULT_THEME, THEME_COOKIE, resolveThemeId } from "@/lib/themes";
import "./globals.css";

const display = Big_Shoulders({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600"],
});

const body = Atkinson_Hyperlegible({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "ShowShow",
    template: "%s · ShowShow",
  },
  description:
    "Art fair directory, private ROI tracker, and application tools for exhibiting artists.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F2F6F5",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const theme = resolveThemeId(jar.get(THEME_COOKIE)?.value ?? DEFAULT_THEME);

  return (
    <html lang="en" data-theme={theme} suppressHydrationWarning>
      <body className={`${display.variable} ${body.variable}`}>{children}</body>
    </html>
  );
}
