export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import * as container from "@/server/container";
import { ScheduleGenerator } from "@/components/schedule-generator";
import { MatchManager } from "@/components/match-manager";
import { FormSkeleton, CardSkeleton } from "@/components/section-skeleton";

async function ScheduleGeneratorSection() {
  const [teams, groups, matches] = await Promise.all([
    container.getTeams(),
    container.getGroups(),
    container.getMatches(),
  ]);
  return <ScheduleGenerator teams={teams} groups={groups} existingMatches={matches} />;
}

async function MatchListSection() {
  const [matches, teams, groups] = await Promise.all([
    container.getMatches(),
    container.getTeams(),
    container.getGroups(),
  ]);
  return <MatchManager matches={matches} teams={teams} groups={groups} />;
}

export default function MatchesPage() {
  return (
    <div className="space-y-4">
      <Link href="/more" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="mr-1 h-4 w-4" />
        管理メニュー
      </Link>
      <h1 className="text-xl font-bold">試合管理</h1>
      <Suspense fallback={<FormSkeleton />}>
        <ScheduleGeneratorSection />
      </Suspense>
      <Suspense fallback={<CardSkeleton count={6} />}>
        <MatchListSection />
      </Suspense>
    </div>
  );
}
