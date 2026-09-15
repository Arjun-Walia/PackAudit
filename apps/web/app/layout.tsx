import type { ReactNode } from "react";
import { ONE_LINE, PRODUCT_NAME } from "@/lib/site";
import { PwaRegister } from "@/components/pwa/PwaRegister";
import "./globals.css";

export const metadata = {
  title: `${PRODUCT_NAME} — packaged commodity inspection`,
  description: ONE_LINE,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: PRODUCT_NAME,
    statusBarStyle: "default",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192" },
      { url: "/icons/icon-512.png", sizes: "512x512" },
    ],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
