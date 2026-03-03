export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import * as container from "@/server/container";
import { TournamentSettingsForm } from "@/components/tournament-settings-form";
import { FormSkeleton } from "@/components/section-skeleton";

async function SettingsData() {
  const tournament = await container.getTournament();

  if (!tournament) {
    return (
      <p className="text-muted-foreground">大会データが見つかりません</p>
    );
  }

  return <TournamentSettingsForm tournament={tournament} />;
}

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <Link href="/more" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="mr-1 h-4 w-4" />
        管理メニュー
      </Link>
      <h1 className="text-xl font-bold">大会設定</h1>
      <Suspense fallback={<FormSkeleton />}>
        <SettingsData />
      </Suspense>
    </div>
  );
}
