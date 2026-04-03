export const dynamic = "force-dynamic";

import { Suspense } from "react";
import * as container from "@/server/container";
import { Refresher } from "@/components/refresher";
import { TimetableTabs } from "@/components/timetable-tabs";
import { TimetableMatchList } from "@/components/timetable-match-list";
import { CardSkeleton } from "@/components/section-skeleton";

type PageProps = { searchParams: Promise<{ id?: string }> };

async function TimetableData({ eventId }: { eventId: string }) {
  const [teams, matches, groups] = await Promise.all([
    container.getTeams(eventId),
    container.getMatches(eventId),
    container.getGroups(eventId),
  ]);

  const teamMap: Record<string, { name: string; color: string; groupId: string }> = {};
  for (const t of teams) {
    teamMap[t.id] = { name: t.name, color: t.color, groupId: t.groupId };
  }

  const sortByTime = (a: { scheduledTime: string }, b: { scheduledTime: string }) =>
    a.scheduledTime.localeCompare(b.scheduledTime);

  const leagueMatches = matches
    .filter((m) => m.type === "league")
    .sort(sortByTime);

  const tournamentMatches = matches
    .filter((m) => m.type === "tournament")
    .sort(sortByTime);

  const leagueContentByGroup: Record<string, React.ReactNode> = {};
  for (const group of groups) {
    const groupMatches = leagueMatches.filter((m) => m.groupId === group.id);
    leagueContentByGroup[group.id] = (
      <TimetableMatchList matches={groupMatches} teamMap={teamMap} />
    );
  }

  return (
    <TimetableTabs
      groups={groups.map((g) => ({ id: g.id, name: g.name }))}
      leagueContentAll={
        <TimetableMatchList matches={leagueMatches} teamMap={teamMap} />
      }
      leagueContentByGroup={leagueContentByGroup}
      tournamentContent={
        <TimetableMatchList matches={tournamentMatches} teamMap={teamMap} />
      }
    />
  );
}

export default async function TimetablePage({ searchParams }: PageProps) {
  const { id } = await searchParams;
  const eventId = id || "default";

  return (
    <div className="space-y-4">
      <Refresher />
      <h1 className="text-xl font-bold">タイムテーブル</h1>
      <Suspense fallback={<CardSkeleton count={6} />}>
        <TimetableData eventId={eventId} />
      </Suspense>
    </div>
  );
}
