import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import OfflineStatus from "@/components/OfflineStatus";
import { Viewport } from "next";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CotaLog | Premium Logistics Quotation Tool",
  description: "Advanced logistics cost automation and offer tracking system.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CotaLog",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={outfit.className}>
        <div className="app-container">
          <Sidebar />
          <OfflineStatus />
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
