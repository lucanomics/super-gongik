import type { Metadata } from "next";
import type { ReactNode } from "react";

import { OfflineBanner } from "@/components/offline-banner";
import { PwaRegistrar } from "@/components/pwa-registrar";
import { environment } from "@/env";
import "./globals.css";

export const metadata: Metadata = {
  title: "SUPER GONGIK",
  description: "사회복무요원을 위한 신뢰할 수 있는 개인 복무 관리 도구",
  applicationName: "SUPER GONGIK",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SUPER GONGIK",
  },
};

export const viewport = {
  themeColor: "#071a3d",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  void environment;

  return (
    <html lang="ko">
      <body>
        <PwaRegistrar />
        <OfflineBanner />
        {children}
      </body>
    </html>
  );
}
