"use client";

import { TeamProvider } from "@/hooks/use-team";
import { AdminProvider } from "@/hooks/use-admin";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <TeamProvider>{children}</TeamProvider>
    </AdminProvider>
  );
}
