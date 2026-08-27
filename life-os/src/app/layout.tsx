import type { Metadata, Viewport } from "next";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { RegisterSW } from "@/components/pwa/RegisterSW";
import "./globals.css";

export const metadata: Metadata = {
  title: "Life OS — GTA Life Tracker",
  description:
    "Your personal life tracker modeled after the GTA V computer. Budget, calendar, projects, and more.",
  applicationName: "Life OS",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Life OS",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0c1a3a",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full overflow-hidden">
        {children}
        <RegisterSW />
        <InstallPrompt />
      </body>
    </html>
  );
}
