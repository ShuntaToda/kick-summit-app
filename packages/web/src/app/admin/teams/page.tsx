export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import * as container from "@/server/container";
import { TeamManager } from "@/components/team-manager";
import { CardSkeleton } from "@/components/section-skeleton";

async function TeamsData() {
  const [teams, groups] = await Promise.all([
    container.getTeams(),
    container.getGroups(),
  ]);
  return <TeamManager teams={teams} groups={groups} />;
}

export default function TeamsPage() {
  return (
    <div className="space-y-4">
      <Link href="/more" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="mr-1 h-4 w-4" />
        管理メニュー
      </Link>
      <h1 className="text-xl font-bold">チーム管理</h1>
      <Suspense fallback={<CardSkeleton count={4} />}>
        <TeamsData />
      </Suspense>
    </div>
  );
}
