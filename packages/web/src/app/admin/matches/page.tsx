export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import * as container from "@/server/container";
import { ScheduleGenerator } from "@/components/schedule-generator";
import { MatchManager } from "@/components/match-manager";
import { FormSkeleton, CardSkeleton } from "@/components/section-skeleton";

type PageProps = { searchParams: Promise<{ id?: string }> };

async function ScheduleGeneratorSection({ eventId }: { eventId: string }) {
  const [teams, groups, matches, courts] = await Promise.all([
    container.getTeams(eventId),
    container.getGroups(eventId),
    container.getMatches(eventId),
    container.getCourts(eventId),
  ]);
  return <ScheduleGenerator teams={teams} groups={groups} existingMatches={matches} courts={courts} eventId={eventId} />;
}

async function MatchListSection({ eventId }: { eventId: string }) {
  const [matches, teams, groups] = await Promise.all([
    container.getMatches(eventId),
    container.getTeams(eventId),
    container.getGroups(eventId),
  ]);
  return <MatchManager matches={matches} teams={teams} groups={groups} eventId={eventId} />;
}

export default async function MatchesPage({ searchParams }: PageProps) {
  const { id } = await searchParams;
  const eventId = id || "default";
  const backHref = id ? `/more?id=${id}` : "/more";

  return (
    <div className="space-y-4">
      <Link href={backHref} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="mr-1 h-4 w-4" />
        管理メニュー
      </Link>
      <h1 className="text-xl font-bold">試合管理</h1>
      <Suspense fallback={<FormSkeleton />}>
        <ScheduleGeneratorSection eventId={eventId} />
      </Suspense>
      <Suspense fallback={<CardSkeleton count={6} />}>
        <MatchListSection eventId={eventId} />
      </Suspense>
    </div>
  );
}
