import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Navigation } from "@/components/navigation";
import { TeamSelectModal } from "@/components/team-select-modal";

export const metadata: Metadata = {
  title: "AWS Kick Summit",
  description: "フットサル大会管理アプリ",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-background text-foreground antialiased">
        <Providers>
          <TeamSelectModal />
          <main className="mx-auto max-w-lg px-4 pb-20 pt-4">{children}</main>
          <Navigation />
        </Providers>
      </body>
    </html>
  );
}
