import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Atkinson_Hyperlegible, Bricolage_Grotesque } from "next/font/google";
import { DEFAULT_THEME, THEME_COOKIE, resolveThemeId } from "@/lib/themes";
import "./globals.css";

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

const body = Atkinson_Hyperlegible({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.AUTH_URL ?? "https://showshow.vercel.app"),
  title: {
    default: "ShowShow",
    template: "%s · ShowShow",
  },
  description:
    "Art fair directory from official show websites. Application tracking and private ROI logs for exhibiting artists.",
  applicationName: "ShowShow",
  appleWebApp: {
    capable: true,
    title: "ShowShow",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "ShowShow",
    description: "Art fair directory from official show websites.",
    url: "/",
    siteName: "ShowShow",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1E3D32",
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
