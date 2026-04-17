import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Navigation } from "@/components/shared/navigation";
import { TimeOverride } from "@/components/shared/time-override";
import { TeamSelectModal } from "@/features/team/ui/team-select-modal";

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
  const isTestEnv =
    process.env.TABLE_PREFIX?.includes("test") ??
    process.env.NODE_ENV === "development";

  return (
    <html lang="ja">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__IS_TEST_ENV__=${JSON.stringify(isTestEnv)}`,
          }}
        />
      </head>
      <body className="bg-background text-foreground antialiased">
        <Providers>
          <TeamSelectModal />
          <main className="mx-auto max-w-lg px-4 pb-20 pt-4">{children}</main>
          <Navigation />
          <TimeOverride />
        </Providers>
      </body>
    </html>
  );
}
